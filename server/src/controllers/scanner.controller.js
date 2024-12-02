// import axios from "axios";
// import * as cheerio from "cheerio";

// // Funciones auxiliares
// const resolveUrl = (base, relative) => {
//   try {
//     return new URL(relative, base).href;
//   } catch {
//     return relative; // Devuelve la relativa si no es válida como URL
//   }
// };

// /**
//  * Extractor Ultra Comprehensivo de URLs
//  * @param {string} url - URL de la página a analizar
//  * @returns {Object} - Objeto con todas las URLs extraídas y metadatos
//  */
// const extractUltraComprehensiveUrls = async (url) => {
//   const startTime = Date.now();

//   // Objeto para almacenar todos los tipos de URLs y patrones
//   const extractedData = {
//     allUrls: new Set(),
//     protocols: new Set(),
//     domains: new Set(),
//     ipAddresses: new Set(),
//     emails: new Set(),
//     phoneNumbers: new Set(),
//     socialMedia: new Set(),
//     potentiallyMaliciousPatterns: new Set(),
//     rawPatterns: new Set(),
//   };

//   // Patrones de búsqueda comprehensivos
//   const patterns = {
//     urls: /((http|https|ftp):\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s<>"'{}|\\^`\[\]])?/gi,
//     protocols: /[a-zA-Z]+:\/\//gi,
//     domains: /([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/gi,
//     ipAddresses: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
//     emails: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
//     phoneNumbers:
//       /\+?(\d{1,4})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
//     socialMedia:
//       /(?:https?:\/\/)?(?:www\.)?(facebook\.com|twitter\.com|linkedin\.com|instagram\.com|t\.me|vk\.com|ok\.ru|youtube\.com|tiktok\.com|discord\.gg|telegram\.me)\/\S+/gi,
//     potentiallyMalicious:
//       /\b(admin|root|backup|test|dev|temp|secret|private|hidden|sensitive|credentials|login|password|token)[^\s]*/gi,
//     localNetworks:
//       /\b(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)\b/g,
//     ports: /:\d{2,5}\b/g,
//   };

//   try {
//     // Realizar solicitud HTTP para obtener contenido
//     const response = await axios.get(url, {
//       timeout: 10000,
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
//       },
//     });

//     const pageContent = response.data;

//     // Función para buscar y extraer patrones
//     const extractPatterns = (regex, category) => {
//       const matches = pageContent.match(regex) || [];
//       matches.forEach((match) => {
//         extractedData[category].add(match);
//         if (category === "urls" || category === "socialMedia") {
//           extractedData.allUrls.add(resolveUrl(url, match));
//         } else {
//           extractedData.allUrls.add(match);
//         }
//       });
//     };

//     // Ejecutar extracción de todos los patrones
//     Object.entries(patterns).forEach(([key, regex]) => {
//       extractPatterns(regex, key);
//     });

//     // Extraer URLs de elementos HTML usando Cheerio
//     const $ = cheerio.load(pageContent);
//     $("a[href], link[href], img[src], script[src]").each((i, elem) => {
//       const attrUrl = $(elem).attr("href") || $(elem).attr("src");
//       if (attrUrl) {
//         extractedData.allUrls.add(resolveUrl(url, attrUrl));
//       }
//     });

//     // Convertir sets a arrays ordenados
//     Object.keys(extractedData).forEach((key) => {
//       if (extractedData[key] instanceof Set) {
//         extractedData[key] = Array.from(extractedData[key]).sort();
//       }
//     });

//     // Metadatos adicionales
//     return {
//       data: extractedData,
//       metadata: {
//         totalUrls: extractedData.allUrls.length,
//         processingTime: `${Date.now() - startTime}ms`,
//         source: url,
//       },
//     };
//   } catch (error) {
//     console.error("Error al extraer URLs:", error.message);
//     return {
//       data: extractedData,
//       metadata: {
//         totalUrls: 0,
//         processingTime: `${Date.now() - startTime}ms`,
//         source: url,
//         error: error.message,
//       },
//     };
//   }
// };

// export const UrlExtractor = { extractUltraComprehensiveUrls };
import puppeteer from "puppeteer";

/**
 * Cache para almacenar resultados recientes y evitar escaneos duplicados
 * Estructura: { url: { data: {...}, timestamp: number } }
 */
const urlCache = new Map();

// Tiempo de vida del caché (en milisegundos)
const CACHE_TTL = 5000; // 5 segundos

// Límites para evitar sobrecarga
const CONCURRENT_LIMIT = 100; // Máximo de escaneos simultáneos
let currentScans = 0;

/**
 * Controlador optimizado para extracción de URLs
 * @param {Request} req - Objeto de petición Express
 * @param {Response} res - Objeto de respuesta Express
 */
const extractUrlsController = async (req, res) => {
  const { url } = req.body;
  const startTime = Date.now();

  if (!url) {
    return res.status(400).json({
      success: false,
      error: "URL es requerida",
    });
  }

  try {
    // Verificar límite de escaneos concurrentes
    if (currentScans >= CONCURRENT_LIMIT) {
      return res.status(429).json({
        success: false,
        error: "Demasiadas solicitudes simultáneas. Intente más tarde.",
      });
    }

    // Verificar caché
    const cachedResult = urlCache.get(url);
    if (cachedResult && startTime - cachedResult.timestamp < CACHE_TTL) {
      return res.status(200).json({
        success: true,
        data: cachedResult.data,
        metadata: {
          ...cachedResult.metadata,
          fromCache: true,
        },
      });
    }

    currentScans++;

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--disable-extensions",
      ],
    });

    const page = await browser.newPage();

    // Optimizar configuraciones de página
    await page.setRequestInterception(true);
    await page.setDefaultNavigationTimeout(10000); // 10 segundos máximo

    // Colección optimizada de URLs
    let foundUrls = {
      all: new Set(),
      resources: new Set(),
      external: new Set(),
      internal: new Set(),
      media: new Set(),
      documents: new Set(),
    };

    // Interceptar solo recursos relevantes
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      const requestUrl = request.url();

      if (
        ["document", "script", "stylesheet", "image"].includes(resourceType)
      ) {
        foundUrls.resources.add(requestUrl);
        foundUrls.all.add(requestUrl);
      }

      // Optimizar carga ignorando recursos no esenciales
      if (
        [
          "font",
          "media",
          "texttrack",
          "object",
          "beacon",
          "csp_report",
          "manifest",
        ].includes(resourceType)
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Navegar a la página con timeout reducido
    await page.goto(url, {
      waitUntil: "domcontentloaded", // Más rápido que 'networkidle0'
      timeout: 10000,
    });

    // Extraer URLs del contenido de manera optimizada
    const pageUrls = await page.evaluate((baseUrl) => {
      const urls = {
        all: new Set(),
        internal: new Set(),
        external: new Set(),
        media: new Set(),
        documents: new Set(),
      };

      // Función optimizada para clasificar URLs
      const classifyUrl = (urlString) => {
        try {
          const urlObj = new URL(urlString, baseUrl);
          const baseUrlObj = new URL(baseUrl);
          const href = urlObj.href;

          urls.all.add(href);

          if (urlObj.hostname === baseUrlObj.hostname) {
            urls.internal.add(href);
          } else {
            urls.external.add(href);
          }

          const extension = urlObj.pathname.split(".").pop().toLowerCase();
          if (
            ["jpg", "jpeg", "png", "gif", "svg", "mp4", "webm", "mp3"].includes(
              extension
            )
          ) {
            urls.media.add(href);
          } else if (
            ["pdf", "doc", "docx", "xls", "xlsx", "txt"].includes(extension)
          ) {
            urls.documents.add(href);
          }
        } catch {
          // Ignorar URLs inválidas
        }
      };

      // Optimizar selección de elementos
      const elements = document.querySelectorAll(
        "a[href], img[src], script[src], link[href], source[src]"
      );
      elements.forEach((element) => {
        const urlString = element.href || element.src;
        if (urlString) classifyUrl(urlString);
      });

      // Convertir Sets a Arrays
      return Object.fromEntries(
        Object.entries(urls).map(([key, value]) => [key, Array.from(value)])
      );
    }, url);

    await browser.close();
    currentScans--;

    // Combinar y procesar resultados
    const finalData = {};
    Object.keys(foundUrls).forEach((key) => {
      finalData[key] = [
        ...new Set([...foundUrls[key], ...(pageUrls[key] || [])]),
      ].sort();
    });

    const result = {
      success: true,
      data: finalData,
      metadata: {
        totalUrls: finalData.all.length,
        processingTime: `${Date.now() - startTime}ms`,
        source: url,
      },
    };

    // Guardar en caché
    urlCache.set(url, {
      data: finalData,
      metadata: result.metadata,
      timestamp: Date.now(),
    });

    // Limpiar caché antigua
    if (urlCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of urlCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          urlCache.delete(key);
        }
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    currentScans--;
    console.error("Error al extraer URLs:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      metadata: {
        processingTime: `${Date.now() - startTime}ms`,
        source: url,
      },
    });
  }
};

export const UrlExtractor = { extractUrlsController };
