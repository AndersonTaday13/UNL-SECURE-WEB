import { ComplementModel } from "../models/complement.model.js";
import { generateUniqueToken, validateToken } from "../utils/tokenManager.js";

// Funciones auxiliares para respuestas consistentes
const createResponse = (complement) => ({
  message: "New complement created successfully",
  complement,
});

const updateResponse = (complement, operation) => ({
  message: `${operation} updated successfully`,
  complement,
});

const errorResponse = (message, error) => ({
  message,
  error: error?.message || error,
});

/**
 * Crea o recupera un complement basado en el token proporcionado
 */
const create = async (req, res) => {
  try {
    const { token } = req.body;

    // Caso 1: Token no proporcionado
    if (!token) {
      const newToken = generateUniqueToken();
      const newComplement = await ComplementModel.create({ token: newToken });
      return res.status(201).json(createResponse(newComplement));
    }

    // Caso 2: Token proporcionado pero inválido
    const isValidToken = validateToken(token);
    if (!isValidToken) {
      const newToken = generateUniqueToken();
      const newComplement = await ComplementModel.create({ token: newToken });
      return res.status(201).json({
        ...createResponse(newComplement),
        message: "Invalid token provided, new token generated",
      });
    }

    // Caso 3: Token válido - verificar si existe
    const existingComplement = await ComplementModel.findByToken(token);
    if (existingComplement) {
      return res.status(200).json({
        message: "Existing complement found",
        complement: existingComplement,
      });
    }

    // Caso 4: Token válido pero no existe en BD
    const newComplement = await ComplementModel.create({ token });
    return res.status(201).json({
      ...createResponse(newComplement),
      message: "New complement created with provided token",
    });
  } catch (error) {
    if (error.message === "Token already exists.") {
      return res.status(409).json(errorResponse("Token already exists", error));
    }
    return res
      .status(500)
      .json(errorResponse("Error creating complement", error));
  }
};

/**
 * Actualiza el estado de protección de un complement
 */
const updateStatus = async (req, res) => {
  try {
    const { token, protection_status } = req.body;

    if (!token || !protection_status) {
      return res
        .status(400)
        .json(errorResponse("Token and protection_status are required"));
    }

    const updatedComplement = await ComplementModel.updateStatus({
      token,
      protection_status,
    });

    if (!updatedComplement) {
      return res.status(404).json(errorResponse("Complement not found"));
    }

    return res
      .status(200)
      .json(updateResponse(updatedComplement, "Protection status"));
  } catch (error) {
    return res.status(500).json(errorResponse("Error updating status", error));
  }
};

/**
 * Actualiza el intervalo de tiempo de un complement
 */
const updateInterval = async (req, res) => {
  try {
    const { token, interval_time } = req.body;

    if (!token || !interval_time) {
      return res
        .status(400)
        .json(errorResponse("Token and interval_time are required"));
    }

    const validIntervals = ["0.2", "1", "2", "3", "4", "5"];
    if (!validIntervals.includes(interval_time)) {
      return res
        .status(400)
        .json(
          errorResponse(
            `Invalid interval_time. Valid values are: ${validIntervals.join(
              ", "
            )}`
          )
        );
    }

    const updatedComplement = await ComplementModel.updateInterval({
      token,
      interval_time,
    });

    if (!updatedComplement) {
      return res.status(404).json(errorResponse("Complement not found"));
    }

    return res
      .status(200)
      .json(updateResponse(updatedComplement, "Interval time"));
  } catch (error) {
    return res
      .status(500)
      .json(errorResponse("Error updating interval", error));
  }
};

// Función auxiliar para validación
const validateFields = (fields, req) => {
  const missingFields = fields.filter((field) => !req.body[field]);
  if (missingFields.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missingFields.join(", ")}`,
    };
  }
  return { isValid: true };
};

export const ComplementController = {
  create,
  updateStatus,
  updateInterval,
};
