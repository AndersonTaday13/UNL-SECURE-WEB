import crypto from "crypto";

export const generateUniqueToken = (length = 16) => {
  try {
    const randomBytes = crypto.randomBytes(length);
    const token = randomBytes.toString("hex");
    const timestamp = Date.now().toString(36);

    return `${token}-${timestamp}`;
  } catch (error) {
    console.error("Error generating unique token:", error);
    throw new Error("Failed to generate unique token");
  }
};

export const validateToken = (token) => {
  const tokenRegex = /^[0-9a-f]+-[0-9a-z]+$/;
  return tokenRegex.test(token);
};
