import axios from "axios";
import Blacklist from "../models/blacklist.model.js";
import { parse } from "csv-parse/sync"; // Necesitarás instalar este paquete: npm install csv-parse

const CONFIG = {
  BATCH_SIZE: 1000,
  CONCURRENT_CONNECTIONS: 5,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

class RetryableOperation {
  static async execute(
    operation,
    maxAttempts = CONFIG.RETRY_ATTEMPTS,
    delay = CONFIG.RETRY_DELAY
  ) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }
    throw lastError;
  }
}

class DownloadPool {
  #queue = [];
  #active = 0;
  #maxConcurrent;

  constructor(maxConcurrent = CONFIG.CONCURRENT_CONNECTIONS) {
    this.#maxConcurrent = maxConcurrent;
  }

  async add(task) {
    if (this.#active >= this.#maxConcurrent) {
      await new Promise((resolve) => this.#queue.push(resolve));
    }
    this.#active++;
    try {
      return await task();
    } finally {
      this.#active--;
      if (this.#queue.length > 0) {
        const next = this.#queue.shift();
        next();
      }
    }
  }
}

const processUrlBatch = async (urls, source, description) => {
  const operations = {
    new: 0,
    existing: 0,
    errors: 0,
  };

  for (let i = 0; i < urls.length; i += CONFIG.BATCH_SIZE) {
    const batch = urls.slice(i, i + CONFIG.BATCH_SIZE);

    try {
      const existingUrls = new Set(
        (await Blacklist.find({ url: { $in: batch } }, { url: 1 })).map(
          (doc) => doc.url
        )
      );

      const bulkOps = batch.map((url) => {
        if (existingUrls.has(url)) {
          operations.existing++;
          return {
            updateOne: {
              filter: { url },
              update: { $inc: { cont: 1 } },
            },
          };
        } else {
          operations.new++;
          return {
            insertOne: {
              document: {
                url,
                description: `[${source}] ${description}`,
                cont: 1,
              },
            },
          };
        }
      });

      await Blacklist.bulkWrite(bulkOps, { ordered: false });
    } catch (error) {
      operations.errors += batch.length;
    }
  }

  return operations;
};

const parsePhishTankCSV = (csvData) => {
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });

  return records.map((record) => record.url.trim());
};

const downloadFeed = async (feed, pool) => {
  return pool.add(async () => {
    return await RetryableOperation.execute(async () => {
      const response = await axios.get(feed.url, {
        timeout: 5000,
        headers: {
          "User-Agent": "ThreatIntelResearchBot/1.0",
        },
        decompress: true,
        responseType: "stream",
      });

      const chunks = [];
      for await (const chunk of response.data) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks).toString("utf8");
    });
  });
};

const FEEDS = [
  {
    name: "URLhaus",
    url: "https://urlhaus.abuse.ch/downloads/text_online/",
    description: "Base de datos de URLs maliciosas activas",
  },
  {
    name: "OpenPhish",
    url: "https://openphish.com/feed.txt",
    description: "Feed de phishing de código abierto",
  },
  {
    name: "PhishTank",
    url: "http://data.phishtank.com/data/online-valid.csv",
    description: "Feed de URLs verificadas de PhishTank",
    isCSV: true, // Indicador para feeds con formato CSV
  },
];

const downloadThreatIntel = async () => {
  console.log("Iniciando proceso de actualización de URLs...");

  const results = {
    successful: [],
    failed: [],
  };

  const pool = new DownloadPool();

  const feedPromises = FEEDS.map(async (feed) => {
    try {
      const data = await downloadFeed(feed, pool);

      let urls;
      if (feed.isCSV) {
        urls = parsePhishTankCSV(data);
      } else {
        urls = data.split("\n").filter((line) => {
          const trimmed = line.trim();
          return trimmed.length > 0 && !trimmed.startsWith("#");
        });
      }

      const dbResults = await processUrlBatch(
        urls,
        feed.name,
        feed.description
      );

      results.successful.push({
        name: feed.name,
        newUrls: dbResults.new,
      });
    } catch (error) {
      results.failed.push({
        name: feed.name,
      });
      console.error(`Error en feed ${feed.name}: ${error.message}`);
    }
  });

  await Promise.all(feedPromises);

  results.successful.forEach((feed) => {
    console.log(`${feed.name}: ${feed.newUrls} nuevas URLs agregadas`);
  });

  if (results.failed.length > 0) {
    console.log("\nFeeds con errores:");
    results.failed.forEach((feed) => {
      console.log(`- ${feed.name}`);
    });
  }

  return results;
};

export default downloadThreatIntel;
