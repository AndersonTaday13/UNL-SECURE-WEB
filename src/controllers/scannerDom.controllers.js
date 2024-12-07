import { extractUrls } from "../libs/extractUrls.js";

async function testExtractor() {
  try {
    // 1. Prueba básica con un sitio web simple
    console.log("Probando con GitHub...");
    const githubUrls = await extractUrls("https://github.com");
    console.log(`Encontradas ${githubUrls.length} URLs en GitHub`);
    console.log("Primeras 5 URLs:", githubUrls.slice(0, 5));

    // 2. Prueba con un sitio más complejo
    console.log("\nProbando con Wikipedia...");
    const wikiUrls = await extractUrls("https://www.wikipedia.org");
    console.log(`Encontradas ${wikiUrls.length} URLs en Wikipedia`);
    console.log("Primeras 5 URLs:", wikiUrls.slice(0, 5));

    // 3. Prueba con sitio que tenga contenido dinámico
    console.log("\nProbando con Twitter...");
    const twitterUrls = await extractUrls("https://twitter.com");
    console.log(`Encontradas ${twitterUrls.length} URLs en Twitter`);
    console.log("Primeras 5 URLs:", twitterUrls.slice(0, 5));
  } catch (error) {
    console.error("Error durante las pruebas:", error);
  }
}

// Ejecutar las pruebas
testExtractor();
