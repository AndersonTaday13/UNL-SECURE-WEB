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
