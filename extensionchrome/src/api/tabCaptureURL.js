
export const tabCaptureURL = {
  // Monitorear cambios de URL y cambios de pestaña
  startUrlMonitoring: () => {
    // Detectar cambios de URL en cualquier pestaña
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete" && tab.url) {
        console.log("URL actualizada:", tab.url);
      }
    });

    // Detectar cambios entre pestañas
    chrome.tabs.onActivated.addListener((activeInfo) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        console.log("Nueva pestaña activa:", tab.url);
      });
    });
  },
};
