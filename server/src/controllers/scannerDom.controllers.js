import { processURL, processingQueue } from "../libs/scanner.libs.js";

export const scanUrl = async (req, res) => {
  try {
    const { url, token } = req.body;

    if (!token) {
      return res.status(401).json({ error: "Token not provided" });
    }

    if (!url) {
      return res.status(400).json({ error: "URL not provided" });
    }

    const result = await processURL(url, token);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in scanUrl:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const scanMultipleUrls = async (req, res) => {
  try {
    const { urls, token } = req.body;

    if (!token) {
      return res.status(401).json({ error: "Token not provided" });
    }

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "URLs not provided correctly" });
    }

    await processingQueue.add(urls, token);

    res.status(202).json({
      success: true,
      message: "URLs being processed",
      urlsQueued: urls.length,
    });
  } catch (error) {
    console.error("Error in scanMultipleUrls:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
