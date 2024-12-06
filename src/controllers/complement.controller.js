import Complement from "../models/complement.model.js";
import { generateUniqueToken, validateToken } from "../libs/tokenManager.js";

export const register = async (req, res) => {
  try {
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
        interval: 0.03,
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

    if (![0.03, 1, 2, 3, 4, 5].includes(interval)) {
      return res.status(400).json({
        message: "Intervalo no válido. Debe ser: 0.03, 1, 2, 3, 4 o 5",
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
