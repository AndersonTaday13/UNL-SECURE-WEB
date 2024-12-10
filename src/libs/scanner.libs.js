import axios from "axios";
import * as cheerio from "cheerio";
import { URL } from "url";
import Blacklist from "../models/blacklist.model.js";
import UrlHistory from "../models/urlHistory.model.js";

// Cache configuration
const urlCache = new Map();
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

class URLProcessingQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.batchSize = 10;
  }

  async add(urls, token) {
    this.queue.push(...urls.map((url) => ({ url, token })));
    if (!this.processing) {
      await this.process();
    }
  }

  async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);
      await Promise.all(batch.map((item) => processURL(item.url, item.token)));
    }
    this.processing = false;
  }
}

export const processingQueue = new URLProcessingQueue();

export async function extractURLsFromHTML(html, baseUrl) {
  const $ = cheerio.load(html);
  const urls = new Set();

  try {
    // Extract URLs from links
    $("a[href]").each((_, elem) => {
      const href = $(elem).attr("href");
      if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          if (absoluteUrl.startsWith("http")) {
            urls.add(absoluteUrl);
          }
        } catch (e) {
          console.log("Invalid URL ignored:", href);
        }
      }
    });

    // Extract URLs from images, scripts, iframes, etc.
    $("[src]").each((_, elem) => {
      const src = $(elem).attr("src");
      if (src) {
        try {
          const absoluteUrl = new URL(src, baseUrl).href;
          if (absoluteUrl.startsWith("http")) {
            urls.add(absoluteUrl);
          }
        } catch (e) {
          console.log("Invalid URL ignored:", src);
        }
      }
    });

    // Search for URLs in text content
    const urlRegex = /https?:\/\/[^\s<>"']+/g;
    $("script, style").remove();
    const textContent = $("body").text();
    const matches = textContent.match(urlRegex) || [];
    matches.forEach((url) => {
      try {
        const absoluteUrl = new URL(url).href;
        urls.add(absoluteUrl);
      } catch (e) {
        console.log("Invalid URL ignored:", url);
      }
    });

    return Array.from(urls);
  } catch (error) {
    console.error("Error extracting URLs:", error);
    return [];
  }
}

export async function checkAgainstBlacklist(url) {
  try {
    const normalizedUrl = new URL(url).href;
    const blacklistEntry = await Blacklist.findOne({ url: normalizedUrl });

    if (blacklistEntry) {
      blacklistEntry.cont += 1;
      await blacklistEntry.save();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error checking blacklist:", error);
    return false;
  }
}

export async function saveToHistory(url, token, isMalicious) {
  try {
    const normalizedUrl = new URL(url).href;
    await UrlHistory.findOneAndUpdate(
      { url: normalizedUrl },
      {
        token,
        url: normalizedUrl,
        active: true,
        isMalicious,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    console.error("Error saving to history:", error);
  }
}

export async function processURL(url, token) {
  try {
    // Check cache
    if (urlCache.has(url)) {
      const cachedResult = urlCache.get(url);
      if (Date.now() - cachedResult.timestamp < CACHE_TIMEOUT) {
        return cachedResult.data;
      }
      urlCache.delete(url);
    }

    // Get and analyze content
    const response = await axios.get(url, {
      timeout: 5000,
      maxContentLength: 10 * 1024 * 1024,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const extractedUrls = await extractURLsFromHTML(response.data, url);
    const maliciousUrls = [];

    // Process extracted URLs
    for (const extractedUrl of extractedUrls) {
      const isMalicious = await checkAgainstBlacklist(extractedUrl);
      await saveToHistory(extractedUrl, token, isMalicious);
      if (isMalicious) {
        maliciousUrls.push(extractedUrl);
      }
    }

    // Process original URL
    const isOriginalMalicious = await checkAgainstBlacklist(url);
    await saveToHistory(url, token, isOriginalMalicious);
    if (isOriginalMalicious) {
      maliciousUrls.push(url);
    }

    const result = {
      originalUrl: url,
      totalUrlsFound: extractedUrls.length,
      maliciousUrlsFound: maliciousUrls.length,
      maliciousUrls,
      timestamp: Date.now(),
    };

    // Update cache
    urlCache.set(url, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    console.error(`Error processing ${url}:`, error.message);
    await saveToHistory(url, token, false);
    return {
      originalUrl: url,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  for (const [url, data] of urlCache.entries()) {
    if (now - data.timestamp > CACHE_TIMEOUT) {
      urlCache.delete(url);
    }
  }
}, CACHE_TIMEOUT);
