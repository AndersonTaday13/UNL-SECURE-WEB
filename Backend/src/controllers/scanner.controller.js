import Blacklist from "../models/blacklist.model.js";
import UrlHistory from "../models/urlHistory.model.js";

export const scanMultipleUrls = async (req, res) => {
  try {
    const { urls, token } = req.body;

    // Validación de entrada
    if (!Array.isArray(urls) || !urls.length || typeof token !== "string") {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    // Buscar coincidencias en la lista negra
    const blacklistedUrls = await Blacklist.find({ url: { $in: urls } }).select(
      "url -_id"
    );
    const blacklistedUrlsArray = blacklistedUrls.map((entry) => entry.url);

    // Buscar URLs existentes en el historial
    const existingHistory = await UrlHistory.find({
      token,
      url: { $in: blacklistedUrlsArray },
    });

    const historyMap = new Map(
      existingHistory.map((entry) => [entry.url, entry.active])
    );

    const bulkOperations = [];
    const urlsToSendToFrontend = [];

    blacklistedUrlsArray.forEach((url) => {
      const isInHistory = historyMap.has(url);
      const isActive = historyMap.get(url);

      if (!isInHistory) {
        // No está en el historial, insertar nueva entrada
        bulkOperations.push({
          insertOne: { document: { token, url, active: true } },
        });
        urlsToSendToFrontend.push(url);
      } else if (isInHistory && !isActive) {
        // Está en el historial pero no está activo, actualizar estado
        bulkOperations.push({
          updateOne: {
            filter: { token, url },
            update: { $set: { active: true } },
          },
        });
        urlsToSendToFrontend.push(url);
      }
      // Si está en el historial y ya está activo, no se añade a la lista
    });

    // Ejecutar las operaciones en bloque si hay algo que procesar
    if (bulkOperations.length > 0) {
      await UrlHistory.bulkWrite(bulkOperations);
    }

    //console.log("URLs enviadas al frontend:", urlsToSendToFrontend);

    return res.json({ urls: urlsToSendToFrontend });
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
