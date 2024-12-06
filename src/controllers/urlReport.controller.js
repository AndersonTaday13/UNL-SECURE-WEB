import Complement from "../models/complement.model.js";
import Url from "../models/urlReport.model.js";

export const reportUrl = async (req, res) => {
  try {
    const { token, url } = req.body;

    if (!url || url.trim() === "") {
      return res.status(400).json({ error: "La URL es requerida" });
    }

    const complementToken = await Complement.findOne({ token, status: true });
    if (!complementToken) {
      return res.status(401).json({ error: "Token no válido o inactivo" });
    }

    const newUrl = new Url({
      token,
      url,
      descripción: "Sin descripción",
    });

    await newUrl.save();

    return res.status(201).json({
      msg: "URL reportada exitosamente",
      data: newUrl,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: "La URL ya ha sido reportada",
      });
    }
    return res.status(500).json({
      error: "Error al reportar la URL",
    });
  }
};
