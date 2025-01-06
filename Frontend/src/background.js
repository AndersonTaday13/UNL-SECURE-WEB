//background.js:

import { complementService } from "./services/complement.service.js";
import { storageService } from "./services/storage.service.js";
import { declarativeNetRequestService } from "./services/declarativeNetRequest.service.js";
import { notifications } from "./services/notifications.service.js";
import { uiNotifications } from "./services/ui-notifications.service.js";

// Configuración
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Utilidad para reintento de operaciones
async function retryOperation(operation, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

// Validación de URLs
function validateUrls(urls) {
  if (!Array.isArray(urls)) return false;
  return urls.every((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
}

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
    uiNotifications.error(
      "Error de Inicialización",
      "No se pudo iniciar correctamente la extensión"
    );
  }
}

// Procesamiento de mensajes
async function handleMessage(message, sender) {
  console.log("Procesando mensaje:", message.action);

  switch (message.action) {
    case "collect_urls":
      return await handleUrlCollection(message.data);
    case "allowTemporarily":
      return await handleTemporaryAllow(message.url);
    case "updateMode":
      return await handleModeUpdate(message.mode);
    case "getRules":
      return await handleGetRules();
    default:
      throw new Error("Acción no reconocida");
  }
}

// Manejador principal de mensajes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error("Error en manejo de mensaje:", error);
      sendResponse({ success: false, error: error.message });
    });
  return true; // Indica que la respuesta es asíncrona
});

// Manejo de recolección de URLs
async function handleUrlCollection(urls) {
  try {
    if (!validateUrls(urls)) {
      throw new Error("URLs inválidas recibidas");
    }

    const response = await complementService.sendUrlsToBackend(urls);

    if (Array.isArray(response) && response.length > 0) {
      await storageService.saveUrls(response);
      const blockedUrls = await storageService.getUrls();

      console.log("URLs completas a bloquear:", blockedUrls);

      // Aplicar reglas de bloqueo
      await declarativeNetRequestService.setBlockingRules(blockedUrls);

      // Añadir notificaciones para cada URL bloqueada
      for (const url of response) {
        await notifications.addBlockedUrlNotification(url);
      }

      return { success: true };
    }

    return { success: false, error: "No se obtuvieron URLs para bloquear" };
  } catch (error) {
    console.error("Error procesando URLs:", error);
    throw error;
  }
}

// Manejo de permiso temporal
async function handleTemporaryAllow(url) {
  try {
    await declarativeNetRequestService.allowTemporarily(url);
    uiNotifications.success(
      "Acceso Temporal Permitido",
      `Se ha permitido temporalmente el acceso a: ${new URL(url).hostname}`
    );
    return { success: true };
  } catch (error) {
    console.error("Error al permitir temporalmente:", error);
    throw error;
  }
}

// Manejo de actualización de modo
async function handleModeUpdate(mode) {
  try {
    console.log("Actualizando modo:", mode);
    const currentRules = await declarativeNetRequestService.getCurrentRules();
    if (currentRules && currentRules.length > 0) {
      await declarativeNetRequestService.setBlockingRules(
        currentRules.map((rule) => rule.condition.urlFilter)
      );
    }
    return { success: true };
  } catch (error) {
    console.error("Error actualizando modo:", error);
    throw error;
  }
}

// Obtención de reglas actuales
async function handleGetRules() {
  try {
    const rules = await declarativeNetRequestService.getCurrentRules();
    return { success: true, rules };
  } catch (error) {
    console.error("Error obteniendo reglas:", error);
    throw error;
  }
}

// Listener para cambios en el almacenamiento
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === "local") {
    if (changes.mode) {
      console.log("Modo cambiado:", changes.mode.newValue);
      await declarativeNetRequestService.restoreRules();
    }

    if (changes.blockedUrls) {
      console.log(
        "URLs bloqueadas actualizadas:",
        changes.blockedUrls.newValue
      );
      const newBlockedUrls = changes.blockedUrls.newValue;
      if (Array.isArray(newBlockedUrls)) {
        await declarativeNetRequestService.setBlockingRules(newBlockedUrls);
      }
    }
  }
});

// Listener para actualización de la extensión
chrome.runtime.onUpdateAvailable.addListener(async (details) => {
  console.log("Nueva versión disponible:", details.version);
  const currentRules = await declarativeNetRequestService.getCurrentRules();
  await chrome.storage.local.set({ preUpdateRules: currentRules });
  chrome.runtime.reload();
});

// Eventos del ciclo de vida de la extensión
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("Extensión instalada/actualizada:", details.reason);

  if (details.reason === "update") {
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

// Inicio del navegador
chrome.runtime.onStartup.addListener(async () => {
  console.log("Navegador iniciado");
  await initializeExtension();
});

// Suspensión de la extensión
chrome.runtime.onSuspend.addListener(async () => {
  console.log("Extensión suspendida");
  const currentRules = await declarativeNetRequestService.getCurrentRules();
  await chrome.storage.local.set({ suspendedRules: currentRules });
});
