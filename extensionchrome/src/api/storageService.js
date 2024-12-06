const STORAGE_KEYS = {
  TOKEN: "complement_token",
  STATUS: "complement_status",
  INTERVAL: "complement_interval",
};

export const storageService = {
  // Métodos para token
  getToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),
  saveToken: (token) => localStorage.setItem(STORAGE_KEYS.TOKEN, token),

  // Métodos para status
  getStatus: () => localStorage.getItem(STORAGE_KEYS.STATUS) === "true",
  saveStatus: (status) => localStorage.setItem(STORAGE_KEYS.STATUS, status),

  // Métodos para interval
  getInterval: () => parseFloat(localStorage.getItem(STORAGE_KEYS.INTERVAL)),
  saveInterval: (interval) =>
    localStorage.setItem(STORAGE_KEYS.INTERVAL, interval),

  // Guardar todos los datos del complemento
  saveComplementData: (data) => {
    if (data.token) localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
    if (data.status !== undefined)
      localStorage.setItem(STORAGE_KEYS.STATUS, data.status);
    if (data.interval)
      localStorage.setItem(STORAGE_KEYS.INTERVAL, data.interval);
  },
};
