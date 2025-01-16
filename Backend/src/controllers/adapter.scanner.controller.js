import Blacklist from "../models/blacklist.model.js";

export const checkUrls = async (req, res) => {
  try {
    const urls = req.body;

    if (
      !Array.isArray(urls) ||
      !urls.every((entry) => entry.url && entry.expected)
    ) {
      return res.status(400).json({ error: "Formato de datos inválido" });
    }

    const urlsToCheck = urls.map((entry) => entry.url);

    const blacklistedUrls = await Blacklist.find({
      url: { $in: urlsToCheck },
    }).select("url -_id");

    const blacklistedUrlsSet = new Set(
      blacklistedUrls.map((entry) => entry.url)
    );

    const results = urls.map((entry) => ({
      url: entry.url,
      expected: entry.expected, 
      detected: blacklistedUrlsSet.has(entry.url) ? "malicious" : "benign", 
    }));
    return res.json(results); 
  } catch (error) {
    console.error("Error interno del servidor:", error.message);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
