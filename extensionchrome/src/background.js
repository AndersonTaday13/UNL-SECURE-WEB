import axios from "axios";

const API_URL = "http://localhost:3000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Definir claves de almacenamiento
const STORAGE_KEYS = {
  TOKEN: "complement_token",
  STATUS: "complement_status",
  INTERVAL: "complement_interval",
};

// Servicio de almacenamiento usando chrome.storage.local
const storageService = {
  getToken: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.TOKEN], (result) => {
        resolve(result[STORAGE_KEYS.TOKEN]);
      });
    });
  },

  saveComplementData: (data) => {
    const storageData = {};
    if (data.token) storageData[STORAGE_KEYS.TOKEN] = data.token;
    if (data.status !== undefined)
      storageData[STORAGE_KEYS.STATUS] = data.status.toString();
    if (typeof data.interval === "string" && data.interval.trim()) {
      storageData[STORAGE_KEYS.INTERVAL] = data.interval;
    }

    return new Promise((resolve) => {
      chrome.storage.local.set(storageData, resolve);
    });
  },
};

// Servicio del complemento
const complementService = {
  register: async () => {
    try {
      const storedToken = await storageService.getToken();
      console.log("Token almacenado:", storedToken);
      const response = await axiosInstance.post("/register", {
        token: storedToken || undefined,
      });

      // Guardar los datos recibidos en chrome.storage.local
      await storageService.saveComplementData(response.data);
      return response.data;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error.response?.data || error.message;
    }
  },
};

// Función de inicialización
async function initializeExtension() {
  console.log("Iniciando registro en segundo plano...");

  try {
    const registrationData = await complementService.register();
    console.log("Registro exitoso:", registrationData);
  } catch (error) {
    console.error("Error durante el registro:", error);
  }
}

// Evento al instalar la extensión
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extensión instalada");
  initializeExtension();
});

let previousUrl = "";

// Función para enviar la URL al servidor usando Axios
async function sendUrlToServer(url) {
  try {
    const response = await axiosInstance.post(
      "/receive-url",
      { url: url },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log("URL enviada exitosamente");
    } else {
      console.error("Error al enviar la URL:", response.status);
    }
  } catch (error) {
    console.error("Error al enviar la URL:", error.message);
  }
}

// Función para obtener la URL activa
function getCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0] && tabs[0].url) {
      const currentUrl = tabs[0].url;

      // Solo enviar si la URL ha cambiado
      if (currentUrl !== previousUrl) {
        previousUrl = currentUrl;
        sendUrlToServer(currentUrl);
      }
    }
  });
}

// Eventos a monitorear
chrome.tabs.onActivated.addListener(function (activeInfo) {
  getCurrentTab();
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url) {
    getCurrentTab();
  }
});

// Verificar periódicamente por cambios (como respaldo)
setInterval(getCurrentTab, 1000);
