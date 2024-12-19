// src/content.js:
const STORAGE_KEYS = {
  TOKEN: "complement_token",
  STATUS: "complement_status",
  INTERVAL: "complement_interval",
  URLS: "complement_urls",
};

const intervalMapping = {
  0: "DEFAULT",
  1: "1 minuto(s)",
  2: "2 minuto(s)",
  3: "3 minuto(s)",
  4: "4 minuto(s)",
  5: "5 minuto(s)",
};

const intervalReverseMapping = {
  DEFAULT: 0,
  "1 minuto(s)": 1,
  "2 minuto(s)": 2,
  "3 minuto(s)": 3,
  "4 minuto(s)": 4,
  "5 minuto(s)": 5,
};

const storageService = {
  getStatus: () => {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.STATUS], (result) => {
        if (result[STORAGE_KEYS.STATUS] !== undefined) {
          resolve(result[STORAGE_KEYS.STATUS] === "true");
        } else {
          resolve(false); // Valor por defecto si no se encuentra el estado
        }
      });
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
};

const extractUrls = () => {
  const urls = new Set();
  document.querySelectorAll("a[href]").forEach((link) => {
    urls.add(link.href);
  });
  return [...urls];
};

let observer;

const observeDomChanges = () => {
  if (document.body) {
    observer = new MutationObserver(() => {
      const urls = extractUrls();
      sendUrlsToBackground(urls);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    console.error("El cuerpo del documento no está disponible.");
  }
};

const stopObservingDomChanges = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

const sendUrlsToBackground = (urls) => {
  chrome.runtime.sendMessage({ action: "collect_urls", data: urls });
};

const init = () => {
  storageService.getStatus().then((status) => {
    if (status) {
      const initialUrls = extractUrls();
      sendUrlsToBackground(initialUrls);
      observeDomChanges();
    } else {
      console.log("El estado es falso, no se ejecutará el scraping.");
      stopObservingDomChanges();
    }
  });
};

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (STORAGE_KEYS.STATUS in changes) {
    const newValue = changes[STORAGE_KEYS.STATUS].newValue;
    if (newValue === "true") {
      console.log("Estado cambiado a true, iniciando scraping.");
      init();
    } else {
      console.log("Estado cambiado a false, deteniendo scraping.");
      stopObservingDomChanges();
    }
  }
});

init();
