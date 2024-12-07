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
    if (data.interval)
      storageData[STORAGE_KEYS.INTERVAL] = data.interval.toString();

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
