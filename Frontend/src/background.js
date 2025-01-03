// background.js
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

    // Configurar las reglas de bloqueo
    declarativeNetRequestService.setBlockingRules(blockedUrls);
  } catch (error) {
    console.error("Error durante la inicialización:", error);
  }
}

// Listener para mensajes desde content.js
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

        declarativeNetRequestService.setBlockingRules(blockedUrls);
      } else {
        console.warn("El backend no devolvió URLs para bloquear");
      }

      sendResponse({ success: true });
    } else {
      console.warn("Acción no reconocida:", message.action);
      sendResponse({ success: false, error: "Acción no reconocida" });
    }
  } catch (error) {
    console.error("Error procesando URLs:", error);
    sendResponse({ success: false, error: error.message });
  }
  return true; // Indica que la respuesta es asíncrona
});

// Eventos de instalación y inicio
if (!chrome.runtime.onInstalled.hasListener(initializeExtension)) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log("Extensión instalada");
    initializeExtension();
  });
}

if (!chrome.runtime.onStartup.hasListener(initializeExtension)) {
  chrome.runtime.onStartup.addListener(() => {
    console.log("Navegador iniciado");
    initializeExtension();
  });
}
