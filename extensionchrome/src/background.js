import axios from "axios";

const API_URL = "http://localhost:3000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const STORAGE_KEYS = {
  TOKEN: "complement_token",
  STATUS: "complement_status",
  INTERVAL: "complement_interval",
};

let currentIntervalId = null;
let intervalWakeupAlarmName = "intervalWakeupAlarm";
let previousUrl = "";

// Servicios para almacenamiento local
const storageService = {
  getToken: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.TOKEN], (result) => {
        resolve(result[STORAGE_KEYS.TOKEN]);
      });
    });
  },

  getStatus: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.STATUS], (result) => {
        resolve(result[STORAGE_KEYS.STATUS] === "true");
      });
    });
  },

  getInterval: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.INTERVAL], (result) => {
        resolve(result[STORAGE_KEYS.INTERVAL] || "DEFAULT");
      });
    });
  },

  saveComplementData: (data) => {
    const storageData = {};
    if (data.token) storageData[STORAGE_KEYS.TOKEN] = data.token;
    if (data.status !== undefined)
      storageData[STORAGE_KEYS.STATUS] = data.status.toString();
    if (typeof data.interval === "string" || data.interval === "DEFAULT") {
      storageData[STORAGE_KEYS.INTERVAL] = data.interval;
    }

    return new Promise((resolve) => {
      chrome.storage.local.set(storageData, resolve);
    });
  },
};

const complementService = {
  register: async () => {
    try {
      const storedToken = await storageService.getToken();
      console.log("Token almacenado:", storedToken);
      const response = await axiosInstance.post("/register", {
        token: storedToken || undefined,
      });

      const currentInterval = await storageService.getInterval();
      await storageService.saveComplementData({
        ...response.data,
        status: true,
        interval: currentInterval,
      });
      return response.data;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error.response?.data || error.message;
    }
  },
};

async function sendUrlToServer(url) {
  try {
    const token = await storageService.getToken();
    const response = await axiosInstance.post("/scan", { url, token });

    if (response.status === 200) {
      console.log("URL enviada exitosamente:", url);
    }
  } catch (error) {
    console.error("Error al enviar la URL:", error.message);
  }
}

async function sendUrlsToServer(urls) {
  try {
    const token = await storageService.getToken();
    const response = await axiosInstance.post("/scan-multiple", {
      urls,
      token,
    });

    if (response.status === 200) {
      console.log("URLs enviadas exitosamente:", urls);
    }
  } catch (error) {
    console.error("Error al enviar las URLs:", error.message);
  }
}

async function getAllOpenTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      const urls = tabs
        .map((tab) => tab.url)
        .filter((url) => url && !url.startsWith("chrome://"));
      resolve(urls);
    });
  });
}

function handleTabActivation(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, async (tab) => {
    const isActive = await storageService.getStatus();
    if (isActive && tab.url && tab.url !== previousUrl) {
      previousUrl = tab.url;
      await sendUrlToServer(tab.url);
    }
  });
}

function handleTabUpdate(tabId, changeInfo, tab) {
  if (changeInfo.url && changeInfo.url !== previousUrl) {
    storageService.getStatus().then(async (isActive) => {
      if (isActive) {
        previousUrl = changeInfo.url;
        await sendUrlToServer(changeInfo.url);
      }
    });
  }
}

function setupAlarm(minutes) {
  chrome.alarms.clear(intervalWakeupAlarmName, () => {
    if (minutes > 0) {
      chrome.alarms.create(intervalWakeupAlarmName, {
        periodInMinutes: minutes,
        delayInMinutes: 0,
      });
      console.log(`Alarma configurada para ejecutarse cada ${minutes} minutos`);
    }
  });
}

async function processIntervalMonitoring() {
  const isActive = await storageService.getStatus();

  if (!isActive) {
    console.log("Monitoreo desactivado");
    return;
  }

  const urls = await getAllOpenTabs();
  console.log(`Procesando ${urls.length} URLs`);

  if (urls.length > 0) {
    await sendUrlsToServer(urls);
  }
}

async function setupUrlMonitoring(isInitial = false) {
  const isActive = await storageService.getStatus();
  const interval = await storageService.getInterval();

  if (currentIntervalId) {
    clearInterval(currentIntervalId);
    currentIntervalId = null;
  }
  chrome.tabs.onActivated.removeListener(handleTabActivation);
  chrome.tabs.onUpdated.removeListener(handleTabUpdate);
  chrome.alarms.clearAll();

  if (!isActive) {
    console.log("Monitoreo desactivado");
    return;
  }

  console.log("Configurando monitoreo con intervalo:", interval);

  if (interval === "DEFAULT") {
    console.log("Iniciando monitoreo en tiempo real (DEFAULT)");
    chrome.tabs.onActivated.addListener(handleTabActivation);
    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    return;
  }

  const match = interval.match(/^(\d+)\s+minuto\(s\)$/);
  if (!match) {
    console.error("Formato de intervalo inválido:", interval);
    return;
  }

  const minutes = parseInt(match[1]);
  if (minutes < 1 || minutes > 5) {
    console.error("Intervalo fuera de rango permitido (1-5 minutos):", minutes);
    return;
  }

  setupAlarm(minutes);

  if (isInitial) {
    await processIntervalMonitoring();
  }
}

async function initializeExtension() {
  console.log("Iniciando extensión...");
  try {
    const registrationData = await complementService.register();
    console.log("Registro exitoso:", registrationData);

    const interval = await storageService.getInterval();
    console.log("Restaurando intervalo guardado:", interval);
    await setupUrlMonitoring(true);
  } catch (error) {
    console.error("Error durante la inicialización:", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extensión instalada");
  initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("Navegador iniciado");
  initializeExtension();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === intervalWakeupAlarmName) {
    console.log("Ejecutando monitoreo por alarma");
    await processIntervalMonitoring();
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (
    namespace === "local" &&
    (changes[STORAGE_KEYS.STATUS] || changes[STORAGE_KEYS.INTERVAL])
  ) {
    console.log("Configuración cambiada, reiniciando monitoreo...");
    setupUrlMonitoring();
  }
});
