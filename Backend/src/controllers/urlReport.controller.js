import Complement from "../models/complement.model.js";
import Url from "../models/urlReport.model.js";

export const reportUrl = async (req, res) => {
  try {
    const { token, url } = req.body;

    const defaultStatus = Url.schema.path("status").enumValues[0];

    if (!url || url.trim() === "") {
      return res.status(400).json({ error: "La URL es requerida" });
    }

    const complementToken = await Complement.findOne({ token });
    if (!complementToken) {
      return res.status(401).json({ error: "Token no válido o inactivo" });
    }

    // Check if URL already exists
    const existingUrl = await Url.findOne({ url: url.trim() });
    if (existingUrl) {
      return res.status(400).json({
        error: "La URL ya ha sido reportada",
        data: existingUrl,
      });
    }

    const newUrl = new Url({
      token,
      url: url.trim(),
      status: defaultStatus,
      time: true,
    });

    await newUrl.save();

    return res.status(201).json({
      msg: "URL reportada exitosamente",
      data: newUrl,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error al reportar la URL",
    });
  }
};
