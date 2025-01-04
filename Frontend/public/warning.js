document.addEventListener("DOMContentLoaded", () => {
  const backButton = document.getElementById("backButton");
  const continueButton = document.getElementById("continueButton");

  // Obtener la URL original de los parámetros
  const urlParams = new URLSearchParams(window.location.search);
  const originalUrl = decodeURIComponent(urlParams.get("originalUrl"));

  // Para depuración
  console.log("URL Original:", originalUrl);

  backButton.addEventListener("click", () => {
    window.history.back();
  });

  continueButton.addEventListener("click", async () => {
    if (originalUrl) {
      try {
        // Enviar mensaje al background para permitir la URL temporalmente
        await chrome.runtime.sendMessage({
          action: "allowTemporarily",
          url: originalUrl,
        });

        // Esperar un momento para asegurar que la regla se ha eliminado
        setTimeout(() => {
          // Asegurarnos de que la URL sea válida
          const cleanUrl = originalUrl.replace(
            /^chrome-extension:\/\/[^/]+\//,
            ""
          );
          window.location.href = cleanUrl;
        }, 500);
      } catch (error) {
        console.error("Error al procesar la redirección:", error);
        alert(
          "Hubo un error al procesar la redirección. Por favor, intenta de nuevo."
        );
      }
    }
  });
});
