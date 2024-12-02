import crypto from "crypto";

/**
 * Genera un token único utilizando crypto
 * @param {number} [length=16] - Longitud de bytes para generar (por defecto 16)
 * @returns {string} Token único generado
 */
export function generateUniqueToken(length = 16) {
  try {
    const randomBytes = crypto.randomBytes(length);
    const token = randomBytes.toString("hex");
    const timestamp = Date.now().toString(36);

    return `${token}-${timestamp}`;
  } catch (error) {
    console.error("Error generating unique token:", error);
    throw new Error("Failed to generate unique token");
  }
}

/**
 * Valida la estructura de un token generado
 * @param {string} token - Token a validar
 * @returns {boolean} - Indica si el token tiene un formato válido
 */
export function validateToken(token) {
  const tokenRegex = /^[0-9a-f]+-[0-9a-z]+$/;
  return tokenRegex.test(token);
}
