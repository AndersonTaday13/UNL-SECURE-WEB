// content.js: 

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
        resolve(result[STORAGE_KEYS.STATUS] === "true" || false);
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

let observer = null;
let intervalId = null;

const observeDomChanges = () => {
  if (document.body) {
    if (observer) observer.disconnect();
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

const startIntervalScraping = (intervalMinutes) => {
  if (intervalId) {
    clearInterval(intervalId);
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  intervalId = setInterval(() => {
    const urls = extractUrls();
    console.log(`Scraping realizado tras ${intervalMinutes} minuto(s):`, urls);
    sendUrlsToBackground(urls);
  }, intervalMs);
};

const stopIntervalScraping = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

const sendUrlsToBackground = (urls) => {
  try {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        { action: "collect_urls", data: urls },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error enviando mensaje al background:",
              chrome.runtime.lastError.message
            );
          } else {
            console.log("Respuesta del background:", response);
          }
        }
      );
    } else {
      console.warn("chrome.runtime o sendMessage no están disponibles.");
    }
  } catch (error) {
    console.error("Error inesperado enviando mensaje al background:", error);
  }
};

const init = () => {
  storageService.getStatus().then((status) => {
    if (status) {
      storageService.getIntervalnum().then((intervalNum) => {
        if (intervalNum === 0) {
          console.log("Modo DEFAULT activado.");
          stopIntervalScraping();
          observeDomChanges();
        } else {
          console.log(`Modo de intervalo activado: ${intervalNum} minuto(s).`);
          stopObservingDomChanges();
          startIntervalScraping(intervalNum);
        }
      });
    } else {
      console.log("El estado es falso, deteniendo scraping.");
      stopObservingDomChanges();
      stopIntervalScraping();
    }
  });
};

chrome.storage.onChanged.addListener(() => {
  console.log("Configuración actualizada, reiniciando scraping.");
  init();
});

if (!window.__CONTENT_SCRIPT_LOADED__) {
  window.__CONTENT_SCRIPT_LOADED__ = true;
  init();
}
