const STORAGE_KEYS = {
  TOKEN: "complement_token",
  STATUS: "complement_status",
  INTERVAL: "complement_interval",
};

export const storageService = {
  // Métodos para token
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

  // Métodos para status
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

  // Métodos para interval
  getInterval: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.INTERVAL], (result) => {
        resolve(parseFloat(result[STORAGE_KEYS.INTERVAL]) || null);
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

  // Guardar todos los datos del complemento
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
