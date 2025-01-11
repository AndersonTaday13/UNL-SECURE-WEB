import request from "supertest";
import jest from "jest-mock";
import fs from "fs";
import app from "../src/app.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import UrlHistorial from "../src/models/urlHistory.model.js";
import UrlReport from "../src/models/urlReport.model.js";
dotenv.config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URL);
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();

  await UrlHistorial.create([
    {
      token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
      url: "www.example1.com",
      active: true,
    },
    {
      token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
      url: "www.example2.com",
      active: true,
    },
  ]);

  await UrlReport.create([
    {
      token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
      url: "www.example1.com",
      status: "maliciosa",
      active: true,
    },
    {
      token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
      url: "www.example3.com",
      status: "benigna",
      active: true,
    },
  ]);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /api/download-report", () => {
  it("Debe generar y devolver un archivo PDF con el informe correctamente", async () => {
    const response = await request(app).post("/api/download-report").send({
      token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe("application/pdf");
    expect(response.headers["content-disposition"]).toMatch(
      /attachment; filename="report-\d+\.pdf"/
    );
    expect(response.body).toBeInstanceOf(Buffer);
  });

  it("Devolver un error si no se proporciona el token", async () => {
    const response = await request(app).post("/api/download-report").send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Token es requerido");
  });

  it("Devolver un error si no se puede generar el archivo PDF", async () => {
    jest.spyOn(fs, "readFileSync").mockImplementation((path) => {
      if (path.includes("styles.css")) {
        throw new Error("Error leyendo el archivo");
      }
      return "contenido simulado";
    });

    const response = await request(app)
      .post("/api/download-report")
      .send({ token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt" });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("error", "Error generando el PDF");

    // Restaura la implementación original
    fs.readFileSync.mockRestore();
  });
});
