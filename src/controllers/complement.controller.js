import Complement from "../models/complement.model.js";
import { generateUniqueToken, validateToken } from "../libs/tokenManager.js";

export const register = async (req, res) => {
  try {
    const defaultInterval = Complement.schema.path("interval").enumValues[0];
    const { token } = req.body;
    let complement =
      token && validateToken(token)
        ? await Complement.findOne({ token })
        : null;

    if (!complement) {
      const newToken =
        token && validateToken(token) ? token : generateUniqueToken();

      complement = await Complement.create({
        token: newToken,
        status: true,
        interval: defaultInterval,
      });
    }
    res.json(complement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { token } = req.body;

    const complement = await Complement.findOne({ token });

    if (!complement) {
      return res.status(404).json({ message: "Complement no encontrado" });
    }

    complement.status = !complement.status;
    await complement.save();

    res.json(complement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateInterval = async (req, res) => {
  try {
    const { token, interval } = req.body;

    // Obtener los valores permitidos desde el enum
    const allowedIntervals = Complement.schema.path("interval").enumValues;

    if (!allowedIntervals.includes(interval)) {
      return res.status(400).json({
        message: `Intervalo no válido. Debe ser uno de: ${allowedIntervals.join(
          ", "
        )}`,
      });
    }

    const complement = await Complement.findOneAndUpdate(
      { token },
      { interval },
      { new: true }
    );

    if (!complement) {
      return res.status(404).json({ message: "Complement no encontrado" });
    }

    res.json(complement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loadinterval = async (req, res) => {
  try {
    const { token } = req.headers;

    // Obtenemos los valores del enum
    const intervalValues = Complement.schema.path("interval").enumValues;

    // Obtenemos el intervalo actual del complemento
    const complement = await Complement.findOne({ token });
    const currentInterval = complement ? complement.interval : "DEFAULT";

    res.json({
      intervals: intervalValues,
      currentInterval: currentInterval,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
