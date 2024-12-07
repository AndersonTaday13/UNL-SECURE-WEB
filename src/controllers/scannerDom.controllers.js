// urlController.js

// Variable para almacenar la última URL recibida
let lastUrl = "";

// Controlador para manejar la recepción de URLs
export const receiveUrl = (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ message: "No se recibió ninguna URL." });
  }
  console.log("URL recibida:", url);

  // Guardar la URL recibida
  lastUrl = url;

  res
    .status(200)
    .json({ message: "URL recibida exitosamente.", receivedUrl: lastUrl });
};
