import { complementService } from "./services/complement.service.js";
import { storageService } from "./services/storage.service.js";
import { declarativeNetRequestService } from "./services/declarativeNetRequest.service.js";

// Inicialización de la extensión
async function initializeExtension() {
  console.log("Iniciando extensión...");

  try {
    const registrationData = await complementService.register();
    console.log("Registro exitoso:", registrationData);
    const blockedUrls = await storageService.getUrls();
    console.log("URLs bloqueadas:", blockedUrls);

    // Restaurar reglas guardadas
    await declarativeNetRequestService.restoreRules();

    // Configurar las reglas de bloqueo si hay nuevas URLs
    if (blockedUrls && blockedUrls.length > 0) {
      await declarativeNetRequestService.setBlockingRules(blockedUrls);
    }
  } catch (error) {
    console.error("Error durante la inicialización:", error);
  }
}

// Listener para cambios en el modo de la extensión
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === "local" && changes.mode) {
    console.log("Modo cambiado:", changes.mode.newValue);
    // Restaurar reglas cuando cambie el modo
    await declarativeNetRequestService.restoreRules();
  }
});

// Listener para mensajes desde otras partes de la extensión
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  try {
    if (message.action === "collect_urls") {
      const urls = message.data;
      console.log("URLs recibidas para procesar:", urls);

      const response = await complementService.sendUrlsToBackend(urls);
      console.log("URLs procesadas por backend:", response);

      if (Array.isArray(response) && response.length > 0) {
        await storageService.saveUrls(response);

        const blockedUrls = await storageService.getUrls();
        console.log("URLs completas a bloquear:", blockedUrls);

        await declarativeNetRequestService.setBlockingRules(blockedUrls);
      } else {
        console.warn("El backend no devolvió URLs para bloquear");
      }

      sendResponse({ success: true });
    } else if (message.action === "allowTemporarily") {
      const { url } = message;
      console.log("Permitiendo temporalmente la URL:", url);

      await declarativeNetRequestService.allowTemporarily(url);
      sendResponse({ success: true });
    } else if (message.action === "updateMode") {
      console.log("Actualizando modo:", message.mode);
      // Asegurarse de que las reglas persistan después del cambio de modo
      const currentRules = await declarativeNetRequestService.getCurrentRules();
      if (currentRules && currentRules.length > 0) {
        await declarativeNetRequestService.setBlockingRules(
          currentRules.map((rule) => rule.condition.urlFilter)
        );
      }
      sendResponse({ success: true });
    } else if (message.action === "getRules") {
      const rules = await declarativeNetRequestService.getCurrentRules();
      sendResponse({ success: true, rules });
    } else {
      console.warn("Acción no reconocida:", message.action);
      sendResponse({ success: false, error: "Acción no reconocida" });
    }
  } catch (error) {
    console.error("Error procesando mensaje:", error);
    sendResponse({ success: false, error: error.message });
  }
  return true; // Indica que la respuesta es asíncrona
});

// Listener para cambios en las URLs bloqueadas
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === "local" && changes.blockedUrls) {
    console.log("URLs bloqueadas actualizadas:", changes.blockedUrls.newValue);
    const newBlockedUrls = changes.blockedUrls.newValue;
    if (Array.isArray(newBlockedUrls)) {
      await declarativeNetRequestService.setBlockingRules(newBlockedUrls);
    }
  }
});

// Listener para actualizaciones de la extensión
chrome.runtime.onUpdateAvailable.addListener(async (details) => {
  console.log("Nueva versión disponible:", details.version);
  // Guardar el estado actual antes de la actualización
  const currentRules = await declarativeNetRequestService.getCurrentRules();
  await chrome.storage.local.set({ preUpdateRules: currentRules });
  chrome.runtime.reload();
});

// Eventos de instalación y inicio
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Extensión instalada/actualizada:", details.reason);

  if (details.reason === "update") {
    // Restaurar reglas después de una actualización
    const { preUpdateRules } = await chrome.storage.local.get("preUpdateRules");
    if (preUpdateRules) {
      await declarativeNetRequestService.setBlockingRules(
        preUpdateRules.map((rule) => rule.condition.urlFilter)
      );
      await chrome.storage.local.remove("preUpdateRules");
    }
  }

  await initializeExtension();
});

// Evento de inicio del navegador
chrome.runtime.onStartup.addListener(async () => {
  console.log("Navegador iniciado");
  await initializeExtension();
});

// Listener para cuando se cierra el navegador
chrome.runtime.onSuspend.addListener(async () => {
  console.log("Extensión suspendida");
  // Guardar el estado actual antes de que se cierre
  const currentRules = await declarativeNetRequestService.getCurrentRules();
  await chrome.storage.local.set({ suspendedRules: currentRules });
});
