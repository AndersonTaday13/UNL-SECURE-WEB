import Blacklist from "../models/blacklist.model.js";
import UrlHistory from "../models/urlHistory.model.js";

export const scanMultipleUrls = async (req, res) => {
  try {
    const { urls, token } = req.body;
    console.log("Datos recibidos en el backend un total de urls:", urls.length);

    if (!Array.isArray(urls) || typeof token !== "string") {
      console.error(
        "Error: Las URLs deben ser un array y el token una cadena."
      );
      return res.status(400).json({ error: "Datos inválidos" });
    }

    // Buscar coincidencias en la lista negra
    const blacklistedUrls = await Blacklist.find({ url: { $in: urls } });
    const blacklistedUrlsArray = blacklistedUrls.map((entry) => entry.url);

    // Procesar URLs para registrar o actualizar en el historial
    const updatedUrls = [];
    for (const url of blacklistedUrlsArray) {
      const existingRecord = await UrlHistory.findOne({ token, url });

      if (existingRecord) {
        // Solo actualizamos y añadimos al array si active era false
        if (!existingRecord.active) {
          existingRecord.active = true;
          await existingRecord.save();
          updatedUrls.push(url);
        }
      } else {
        // Si no existe el registro, crear uno nuevo
        const newRecord = new UrlHistory({ token, url, active: true });
        await newRecord.save();
        updatedUrls.push(url);
      }
    }

    // Responder con el nuevo array y el token
    return res.json({
      urls: updatedUrls,
    });
  } catch (error) {
    console.error("Error procesando las URLs:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
