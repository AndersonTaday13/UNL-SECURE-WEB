// declarativeNetRequest.service.js: 

const generateUniqueId = async (url) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return Math.abs(parseInt(hashHex.slice(0, 8), 16) % 2147483647);
};

const formatUrlForBlocking = (url) => {
  try {
    const cleanUrl = url.replace(/^chrome-extension:\/\/[^/]+\//, "");
    const parsedUrl = new URL(cleanUrl);
    return {
      urlFilter: `||${parsedUrl.hostname}${parsedUrl.pathname}${parsedUrl.search}`,
      originalUrl: cleanUrl,
    };
  } catch (error) {
    console.error("Error formateando URL:", url, error);
    return null;
  }
};

export const declarativeNetRequestService = {
  // Almacena las reglas actuales en el storage local
  saveCurrentRules: async (rules) => {
    try {
      await chrome.storage.local.set({ currentRules: rules });
      console.log("Reglas guardadas en storage:", rules);
    } catch (error) {
      console.error("Error guardando reglas:", error);
    }
  },

  // Recupera las reglas guardadas
  getCurrentRules: async () => {
    try {
      const data = await chrome.storage.local.get("currentRules");
      return data.currentRules || [];
    } catch (error) {
      console.error("Error recuperando reglas:", error);
      return [];
    }
  },

  setBlockingRules: async (blockedUrls) => {
    try {
      const formattedUrls = blockedUrls
        .map((url) => formatUrlForBlocking(url))
        .filter((url) => url !== null);

      const existingRules =
        await chrome.declarativeNetRequest.getDynamicRules();

      const rules = await Promise.all(
        formattedUrls.map(async ({ urlFilter, originalUrl }) => {
          const warningUrl = chrome.runtime.getURL("warning.html");
          return {
            id: await generateUniqueId(originalUrl),
            priority: 1,
            action: {
              type: "redirect",
              redirect: {
                url: `${warningUrl}?originalUrl=${encodeURIComponent(
                  originalUrl
                )}`,
              },
            },
            condition: {
              urlFilter: urlFilter,
              resourceTypes: ["main_frame"],
            },
          };
        })
      );

      const removeRuleIds = existingRules.map((rule) => rule.id);

      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules,
        removeRuleIds: removeRuleIds,
      });

      // Guardar las reglas actuales
      await declarativeNetRequestService.saveCurrentRules(rules);

      console.log("Reglas de redirección actualizadas:", rules);
    } catch (error) {
      console.error("Error al configurar reglas de redirección:", error);
    }
  },

  allowTemporarily: async (url) => {
    try {
      const formattedUrl = formatUrlForBlocking(url);
      if (!formattedUrl) return;

      const existingRules =
        await chrome.declarativeNetRequest.getDynamicRules();
      const currentRules = await declarativeNetRequestService.getCurrentRules();

      // Encontrar las reglas relacionadas con esta URL
      const ruleIdsToRemove = existingRules
        .filter((rule) =>
          rule.condition.urlFilter.includes(formattedUrl.urlFilter)
        )
        .map((rule) => rule.id);

      if (ruleIdsToRemove.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIdsToRemove,
        });

        // Actualizar las reglas en storage
        const updatedRules = currentRules.filter(
          (rule) => !ruleIdsToRemove.includes(rule.id)
        );
        await declarativeNetRequestService.saveCurrentRules(updatedRules);

        // Restaurar después de 5 minutos
        setTimeout(async () => {
          const rulesToRestore = currentRules.filter((rule) =>
            ruleIdsToRemove.includes(rule.id)
          );

          await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: rulesToRestore,
            removeRuleIds: [], // No necesitamos remover reglas aquí
          });

          // Actualizar storage con las reglas restauradas
          const currentStoredRules =
            await declarativeNetRequestService.getCurrentRules();
          await declarativeNetRequestService.saveCurrentRules([
            ...currentStoredRules,
            ...rulesToRestore,
          ]);
        }, 5 * 60 * 1000);
      }
    } catch (error) {
      console.error("Error al permitir temporalmente la URL:", error);
    }
  },

  // Método para restaurar las reglas guardadas
  restoreRules: async () => {
    try {
      const savedRules = await declarativeNetRequestService.getCurrentRules();
      if (savedRules && savedRules.length > 0) {
        const existingRules =
          await chrome.declarativeNetRequest.getDynamicRules();
        const removeRuleIds = existingRules.map((rule) => rule.id);

        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: savedRules,
          removeRuleIds: removeRuleIds,
        });
        console.log("Reglas restauradas exitosamente:", savedRules);
      }
    } catch (error) {
      console.error("Error restaurando reglas:", error);
    }
  },
};