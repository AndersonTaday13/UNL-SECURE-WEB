export const receiveUrl = (req, res) => {
  try {
    const { url, urls, token } = req.body;

    // Verificar autenticación
    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    let results = [];

    if (url) {
      // Caso de una sola URL
      console.log("URL recibida:", url);
      console.log("Token recibido:", token);

      results = {
        url,
      };
    } else if (urls && Array.isArray(urls)) {
      // Caso de múltiples URLs
      urls.forEach((singleUrl) => {
        // Imprimir detalles en consola para cada URL
        console.log("URL recibida:", singleUrl);
        console.log("Token recibido:", token);

        // Añadir al array de resultados
        results.push({
          url: singleUrl,
        });
      });
    } else {
      return res.status(400).json({ error: "Formato de datos inválido" });
    }

    // Enviar respuesta
    res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("Error procesando las URLs:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
