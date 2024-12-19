// direccion src/background.js:
import { complementService } from "./services/complement.service.js";
import { storageService } from "./services/storage.service.js";
import { declarativeNetRequestService } from "./services/declarativeNetRequest.service.js";

// Función principal que inicializa la extensión
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

// Listener para mensajes de `content.js` (esto es para recolectar las URLs)
chrome.runtime.onMessage.addListener(async (message) => {

  if (message.action === "collect_urls") {
    const urls = message.data;
    console.log("URLs recibidas para procesar:", urls);

    try {
      const response = await complementService.sendUrlsToBackend(urls);
      console.log("URLs procesadas por backend:", response);

      if (Array.isArray(response) && response.length > 0) {
        await storageService.saveUrls(response);

        const blockedUrls = await storageService.getUrls();
        console.log("URLs COMPLETAS a bloquear:", blockedUrls);

        declarativeNetRequestService.setBlockingRules(blockedUrls);
      } else {
        console.warn("El backend no devolvió URLs para bloquear");
      }
    } catch (error) {
      console.error("Error procesando URLs:", error);
    }
  }
});

// Evento de instalación de la extensión
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extensión instalada");
  initializeExtension();
});

// Evento de inicio del navegador
chrome.runtime.onStartup.addListener(() => {
  console.log("Navegador iniciado");
  initializeExtension();
});
