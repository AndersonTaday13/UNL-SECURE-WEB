/*import axios from "axios";
import { JSDOM } from "jsdom";
import puppeteer from "puppeteer";

const URL_SELECTORS = {
  a: "href",
  img: "src",
  iframe: "src",
  script: "src",
  link: "href",
  video: "src",
  audio: "src",
  source: "src",
  track: "src",
  embed: "src",
};

const URL_REGEX = /https?:\/\/[^\s"'<>()]+/gi;


const addUrl = (url, base, urls) => {
  if (!url) return;
  try {
    const normalizedUrl = new URL(url, base).href.trim();
    if (normalizedUrl) urls.add(normalizedUrl);
  } catch (error) {
    // Manejo del error, pero no interrumpe el flujo
    console.debug(`Error al normalizar URL: ${url}`);
  }
};

// Extraer URLs con Axios, más eficiente y rápido
const extractUrlsFromAxios = async (targetUrl, urls) => {
  try {
    const response = await axios.get(targetUrl, {
      timeout: 10000,
      maxRedirects: 5,
      headers: {
        "Accept-Encoding": "gzip, deflate",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = response.data;

    // Extraer todas las URLs con regex primero (más rápido)
    const matches = html.match(URL_REGEX) || [];
    matches.forEach((url) => addUrl(url, targetUrl, urls));

    // Usar JSDOM solo para elementos específicos
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Procesar selectores en un solo recorrido
    Object.entries(URL_SELECTORS).forEach(([tag, attr]) => {
      document.querySelectorAll(tag).forEach((el) => {
        addUrl(el.getAttribute(attr), targetUrl, urls);
      });
    });
  } catch (error) {
    console.error(`Error en Axios para ${targetUrl}:`, error.message);
  }
};

// Extraer URLs con Puppeteer solo si es absolutamente necesario
const extractUrlsFromPuppeteer = async (targetUrl, urls) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Deshabilitar recursos no esenciales para mejorar velocidad
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (["image", "stylesheet", "font"].includes(request.resourceType())) {
        request.abort();
      } else {
        addUrl(request.url(), targetUrl, urls);
        request.continue();
      }
    });

    // Reducir timeout para páginas lentas
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    // Extraer URLs usando una sola evaluación
    const dynamicUrls = await page.evaluate((selectors) => {
      const foundUrls = new Set();
      const seen = new Set();

      // Función helper para procesar URLs
      const processUrl = (url) => {
        if (url && !seen.has(url)) {
          seen.add(url);
          if (url.startsWith("http")) foundUrls.add(url);
        }
      };

      // Procesar selectores en un solo recorrido
      const elements = document.querySelectorAll(
        Object.keys(selectors).join(",")
      );
      elements.forEach((el) => {
        const attr = selectors[el.tagName.toLowerCase()];
        processUrl(el.getAttribute(attr));
      });

      // Buscar URLs en atributos y estilos en el mismo recorrido
      document.querySelectorAll("*").forEach((el) => {
        // Procesar atributos data-*
        for (const attr of el.attributes) {
          if (attr.value.startsWith("http")) {
            processUrl(attr.value);
          }
        }

        // Procesar estilos inline
        const style = el.getAttribute("style");
        if (style) {
          const styleUrls = style.match(/url\(['"]?(.*?)['"]?\)/g);
          if (styleUrls) {
            styleUrls.forEach((url) => {
              processUrl(url.replace(/url\(['"]?|['"]?\)/g, ""));
            });
          }
        }
      });

      return [...foundUrls];
    }, URL_SELECTORS);

    dynamicUrls.forEach((url) => addUrl(url, targetUrl, urls));
  } catch (error) {
    console.error("Error en Puppeteer:", error.message);
  }
};

// Función principal para extraer URLs
export const extractUrls = async (targetUrl) => {
  const urls = new Set();

  try {
    console.time("URL Extraction Time"); // Iniciar el contador de tiempo

    // Ejecutar Axios primero, y Puppeteer solo si es necesario
    await extractUrlsFromAxios(targetUrl, urls);
    // Solo usar Puppeteer si no encontramos suficientes URLs con Axios
    if (urls.size === 0) {
      await extractUrlsFromPuppeteer(targetUrl, urls);
    }

    console.timeEnd("URL Extraction Time"); // Finalizar el contador de tiempo

    return Array.from(urls);
  } catch (error) {
    console.error("Error durante la extracción de URLs:", error.message);
    return Array.from(urls); // Retornar las URLs encontradas hasta el momento
  }
};
*/
import axios from "axios";
import { JSDOM } from "jsdom";
import puppeteer from "puppeteer";
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

export const extractUrls = async (targetUrl, options = {}) => {
  const {
    timeout = 15000,
    maxRedirects = 3,
    concurrent = true,
    useWorkers = true,
    cacheResults = true
  } = options;

  // Cache para URLs ya procesadas
  const urlCache = new Map();
  const urls = new Set();

  // Regex optimizada usando un único patrón
  const URL_REGEX = new RegExp([
    // URLs con protocolo
    '(?:https?:)?//',
    // Dominio y subdominio
    '(?:(?:[a-z0-9][a-z0-9-]*[a-z0-9])\\.)+',
    // TLD
    '[a-z]{2,}',
    // Puerto opcional y path
    '(?::\\d{2,5})?(?:/[^\\s"\'<>(){}\\[\\]]*)?'
  ].join(''), 'gi');

  // Worker para procesamiento paralelo
  const createWorker = (task, data) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(`
        const { parentPort, workerData } = require('worker_threads');
        ${task.toString()}
        (async () => {
          try {
            const result = await task(workerData);
            parentPort.postMessage(result);
          } catch (error) {
            parentPort.postMessage({ error: error.message });
          }
        })();
      `, { eval: true, workerData: data });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  };

  // Función optimizada para normalizar URLs
  const normalizeUrl = (() => {
    const cache = new Map();
    return (url, base) => {
      const key = `${url}|${base}`;
      if (cache.has(key)) return cache.get(key);
      try {
        const normalized = new URL(url, base).href;
        cache.set(key, normalized);
        return normalized;
      } catch {
        cache.set(key, null);
        return null;
      }
    };
  })();

  // Procesamiento en memoria compartida para múltiples workers
  const sharedUrls = new Set();
  
  try {
    // Ejecutar extracciones en paralelo con workers
    const tasks = [];

    // 1. Worker para Puppeteer
    if (useWorkers) {
      tasks.push(createWorker(async ({ url, timeout }) => {
        const browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
          ]
        });

        try {
          const page = await browser.newPage();
          
          // Optimizar rendimiento de página
          await Promise.all([
            page.setCacheEnabled(true),
            page.setRequestInterception(true),
            page.setJavaScriptEnabled(true),
            page.setBypassCSP(true)
          ]);

          // Interceptar y optimizar requests
          page.on('request', request => {
            if (['image', 'stylesheet', 'font', 'media'].includes(request.resourceType())) {
              request.abort();
            } else {
              const url = request.url();
              if (url.startsWith('http')) sharedUrls.add(url);
              request.continue();
            }
          });

          // Cargar página con timeout optimizado
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout
          });

          // Extraer URLs en una sola evaluación
          const foundUrls = await page.evaluate(() => {
            const urls = new Set();
            const seen = new Set();

            const addUrl = (url) => {
              if (url && url.startsWith('http') && !seen.has(url)) {
                seen.add(url);
                urls.add(url);
              }
            };

            // Selector optimizado para todos los elementos relevantes
            const elements = document.querySelectorAll(
              'a[href], img[src], script[src], link[href], iframe[src], source[src], video[src], audio[src], embed[src]'
            );

            elements.forEach(el => {
              addUrl(el.src || el.href);
            });

            // Buscar URLs en atributos data-* y estilos
            document.querySelectorAll('[data-*], [style]').forEach(el => {
              Array.from(el.attributes).forEach(attr => {
                if (attr.value.startsWith('http')) {
                  addUrl(attr.value);
                }
              });
            });

            return Array.from(urls);
          });

          foundUrls.forEach(url => sharedUrls.add(url));
          
          await browser.close();
          return Array.from(sharedUrls);
        } catch (error) {
          await browser.close();
          throw error;
        }
      }, { url: targetUrl, timeout }));
    }

    // 2. Worker para análisis estático
    if (useWorkers) {
      tasks.push(createWorker(async ({ url, timeout, maxRedirects }) => {
        const response = await axios.get(url, {
          timeout,
          maxRedirects,
          headers: {
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml',
            'User-Agent': 'Mozilla/5.0'
          },
          decompress: true
        });

        const html = response.data;
        const staticUrls = new Set();

        // Extraer URLs con regex optimizada
        const matches = html.matchAll(URL_REGEX);
        for (const match of matches) {
          if (match[0].startsWith('http')) {
            staticUrls.add(match[0]);
          }
        }

        // Análisis DOM optimizado
        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Query selector optimizado
        document.querySelectorAll(
          '[href], [src], [data-*]'
        ).forEach(el => {
          const url = el.href || el.src;
          if (url?.startsWith('http')) {
            staticUrls.add(url);
          }
        });

        return Array.from(staticUrls);
      }, { url: targetUrl, timeout, maxRedirects }));
    }

    // Ejecutar tasks en paralelo
    const results = await Promise.all(tasks);
    
    // Combinar y normalizar resultados
    results.flat().forEach(url => {
      const normalized = normalizeUrl(url, targetUrl);
      if (normalized) urls.add(normalized);
    });

    // Guardar en cache si está habilitado
    if (cacheResults) {
      urlCache.set(targetUrl, Array.from(urls));
    }

    return Array.from(urls);

  } catch (error) {
    console.error("Error durante la extracción de URLs:", error.message);
    return Array.from(urls);
  }
};