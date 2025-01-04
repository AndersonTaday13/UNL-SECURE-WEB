import Blacklist from "../models/blacklist.model.js";
import UrlHistory from "../models/urlHistory.model.js";

export const scanMultipleUrls = async (req, res) => {
  try {
    const { urls, token } = req.body;
    const fecha = new Date();
    console.log(`[${fecha.toLocaleString()}] Escaneo de URLs iniciado`);
    console.log(
      "Datos recibidos en el backend, un total de URLs:",
      urls.length
    );

    // Validación de entrada
    if (!Array.isArray(urls) || !urls.length || typeof token !== "string") {
      console.error(
        "Error: Las URLs deben ser un array no vacío y el token una cadena."
      );
      return res.status(400).json({ error: "Datos inválidos" });
    }

    // Buscar coincidencias en la lista negra
    const blacklistedUrls = await Blacklist.find({ url: { $in: urls } }).select(
      "url -_id"
    );
    const blacklistedUrlsArray = blacklistedUrls.map((entry) => entry.url);

    // Procesar URLs para registrar o actualizar en el historial
    const bulkOperations = [];
    blacklistedUrlsArray.forEach((url) => {
      bulkOperations.push({
        updateOne: {
          filter: { token, url },
          update: { $set: { active: true } },
          upsert: true,
        },
      });
    });

    if (bulkOperations.length > 0) {
      await UrlHistory.bulkWrite(bulkOperations);
    }

    console.log(`[${fecha.toLocaleString()}] Escaneo completado.`);
    return res.json({ urls: blacklistedUrlsArray });
  } catch (error) {
    console.error("Error procesando las URLs:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
