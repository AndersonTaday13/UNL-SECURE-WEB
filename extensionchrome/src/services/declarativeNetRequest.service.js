// direccion src/services/declarateNetRequest.service.js:

// Función para generar un hash único para cada URL
const generateUniqueId = async (url) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return parseInt(hashHex.slice(0, 8), 16);
};

const formatUrlForBlocking = (url) => {
  try {
    const parsedUrl = new URL(url);
    return `*://${parsedUrl.hostname}/*`;
  } catch (error) {
    console.error("Error formateando URL:", url);
    return null;
  }
};

export const declarativeNetRequestService = {
  setBlockingRules: async (blockedUrls) => {
    try {
      const formattedUrls = blockedUrls
        .map((url) => formatUrlForBlocking(url))
        .filter((url) => url !== null);

      // Obtener las reglas existentes
      const existingRules =
        await chrome.declarativeNetRequest.getDynamicRules();

      // Crear un Set de las URLs ya bloqueadas
      const existingUrls = new Set(
        existingRules.map((rule) => rule.condition.urlFilter)
      );

      // Filtrar URLs nuevas
      const newUrls = formattedUrls.filter((url) => !existingUrls.has(url));

      if (newUrls.length === 0) {
        console.log("No hay URLs nuevas para bloquear.");
        return;
      }

      // Generar reglas de bloqueo
      const rules = await Promise.all(
        newUrls.map(async (url) => ({
          id: await generateUniqueId(url),
          priority: 1,
          action: { type: "block" },
          condition: {
            urlFilter: url,
            resourceTypes: [
              "main_frame", // Bloquea la carga de página principal
              "sub_frame", // Bloquea iframes
              "script", // Bloquea scripts
              "xmlhttprequest", // Bloquea solicitudes AJAX
              "other", // Otros recursos
            ],
          },
        }))
      );

      // Actualizar reglas dinámicas
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules,
        removeRuleIds: [],
      });

      console.log("Reglas de bloqueo actualizadas:", rules);
    } catch (error) {
      console.error("Error al configurar reglas de bloqueo:", error);
    }
  },

  // Método para desbloquear URLs
  removeBlockingRules: async (urlsToUnblock) => {
    try {
      const existingRules =
        await chrome.declarativeNetRequest.getDynamicRules();

      // Encontrar IDs de reglas a eliminar
      const ruleIdsToRemove = existingRules
        .filter((rule) => urlsToUnblock.includes(rule.condition.urlFilter))
        .map((rule) => rule.id);

      if (ruleIdsToRemove.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIdsToRemove,
        });
        console.log("Reglas de bloqueo eliminadas:", ruleIdsToRemove);
      } else {
        console.log("No se encontraron reglas para eliminar.");
      }
    } catch (error) {
      console.error("Error al eliminar reglas de bloqueo:", error);
    }
  },
};
