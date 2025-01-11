import UrlHistorial from "../models/urlHistory.model.js";
import UrlReport from "../models/urlReport.model.js";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export const downloadReport = async (req, res) => {
  let browser;
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token es requerido" });
    }

    const [maliciousUrls, reportUrls] = await Promise.all([
      // Traer todas las URLs activas del historial
      UrlHistorial.find({ token, active: true }, { url: 1, _id: 0 }),
      // Traer todas las URLs con sus estados de los reportes
      UrlReport.find({ token, active: true }, { url: 1, status: 1, _id: 0 }),
    ]);

    // Convertir CSS y logo a base64
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const cssPath = path.join(__dirname, "..", "public/styles.css");
    const logoPath = path.join(__dirname, "..", "public/logo.png");

    const cssBase64 = fs.readFileSync(cssPath, "base64");
    const logoBase64 = fs.readFileSync(logoPath, "base64");

    // Renderizar la plantilla EJS
    const htmlContent = await new Promise((resolve, reject) => {
      res.render(
        "report",
        {
          countMaliciousUrls: maliciousUrls.length,
          maliciousUrls,
          reportUrls,
          countReportUrls: reportUrls.length,
          cssBase64,
          logoBase64,
        },
        (err, html) => {
          if (err) reject(err);
          else resolve(html);
        }
      );
    });

    // Configurar Puppeteer
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: ["domcontentloaded", "networkidle0"],
    });

    // Generar PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    await browser.close();

    // Generar un nombre de archivo único
    const fileName = `report-${Date.now()}.pdf`;

    // Configurar headers para forzar la descarga
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": pdfBuffer.length,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: 0,
    });

    // Enviar el PDF
    return res.end(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: "Error generando el PDF" });
  }
};
