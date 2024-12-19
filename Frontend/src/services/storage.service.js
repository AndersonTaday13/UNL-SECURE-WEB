// direccion src/services/storage.service.js:
export const STORAGE_KEYS = {
  TOKEN: "complement_token",
  STATUS: "complement_status",
  INTERVAL: "complement_interval",
  URLS: "complement_urls",
};

// Mapeo de los valores numéricos a sus representaciones legibles
const intervalMapping = {
  0: "DEFAULT",
  1: "1 minuto(s)",
  2: "2 minuto(s)",
  3: "3 minuto(s)",
  4: "4 minuto(s)",
  5: "5 minuto(s)",
};

// Mapeo inverso, de valores legibles a números
const intervalReverseMapping = {
  DEFAULT: 0,
  "1 minuto(s)": 1,
  "2 minuto(s)": 2,
  "3 minuto(s)": 3,
  "4 minuto(s)": 4,
  "5 minuto(s)": 5,
};

export const storageService = {
  getToken: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.TOKEN], (result) => {
        resolve(result[STORAGE_KEYS.TOKEN]);
      });
    });
  },
  saveToken: (token) => {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.TOKEN]: token }, resolve);
    });
  },

  getStatus: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.STATUS], (result) => {
        resolve(result[STORAGE_KEYS.STATUS] === "true");
      });
    });
  },
  saveStatus: (status) => {
    return new Promise((resolve) => {
      chrome.storage.local.set(
        { [STORAGE_KEYS.STATUS]: status.toString() },
        resolve
      );
    });
  },

  getInterval: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.INTERVAL], (result) => {
        resolve(result[STORAGE_KEYS.INTERVAL] || "DEFAULT");
      });
    });
  },

  saveInterval: (interval) => {
    return new Promise((resolve) => {
      chrome.storage.local.set(
        { [STORAGE_KEYS.INTERVAL]: interval.toString() },
        resolve
      );
    });
  },

  getIntervalnum: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.INTERVAL], (result) => {
        const storedValue = result[STORAGE_KEYS.INTERVAL];
        const mappedValue = intervalReverseMapping[storedValue] || 0;
        resolve(mappedValue);
      });
    });
  },

  // Método para guardar el intervalo en el localStorage como su valor legible
  saveIntervalnum: (interval) => {
    return new Promise((resolve) => {
      const storedValue = intervalMapping[interval] || "DEFAULT";
      chrome.storage.local.set(
        { [STORAGE_KEYS.INTERVAL]: storedValue },
        resolve
      );
    });
  },

  saveComplementData: (data) => {
    const storageData = {};
    if (data.token) storageData[STORAGE_KEYS.TOKEN] = data.token;
    if (data.status !== undefined)
      storageData[STORAGE_KEYS.STATUS] = data.status.toString();
    if (typeof data.interval === "string" || data.interval === "DEFAULT")
      storageData[STORAGE_KEYS.INTERVAL] = data.interval.toString();

    return new Promise((resolve) => {
      chrome.storage.local.set(storageData, resolve);
    });
  },

  getUrls: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.URLS], (result) => {
        resolve(result[STORAGE_KEYS.URLS] || []);
      });
    });
  },

  saveUrls: async (newUrls) => {
    const existingUrls = await storageService.getUrls();

    const mergedUrls = Array.from(new Set([...existingUrls, ...newUrls]));

    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEYS.URLS]: mergedUrls }, () => {
        resolve(mergedUrls);
      });
    });
  },
};
