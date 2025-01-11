import request from "supertest";
import jest from "jest-mock";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../src/app.js";
import Blacklist from "../src/models/blacklist.model.js";
import UrlHistory from "../src/models/urlHistory.model.js";
dotenv.config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URL);
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();

  // Blacklist
  await Blacklist.create([
    { url: "www.malicious.com", description: "Known malicious site" },
    { url: "www.badactor.com", description: "Phishing site" },
    { url: "www.malicious2.com", description: "Phishing site" },
    { url: "www.malicious1.com", description: "Phishing site" },
  ]);

  // Prepopulate UrlHistory
  await UrlHistory.create([
    {
      token: "d3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
      url: "www.malicious.com",
      active: true,
    },
    {
      token: "d3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
      url: "www.malicious1.com",
      active: false,
    },
  ]);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /api/scan-multiple", () => {
  it("Debe devolver las URLs detectadas en la lista negra", async () => {
    const response = await request(app)
      .post("/api/scan-multiple")
      .send({
        token: "d3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
        urls: [
          "www.malicious.com",
          "www.badactor.com",
          "www.new-malicious.com",
          "www.malicious1.com",
        ],
      });

    // Verifica que la API responde con éxito
    expect(response.status).toBe(200);

    // Verifica que las URLs esperadas están en la respuesta
    expect(response.body.urls).toEqual(
      expect.arrayContaining(["www.badactor.com", "www.malicious1.com"])
    );
  });

  it("Debe devolver un error si los datos de entrada son inválidos", async () => {
    const response = await request(app).post("/api/scan-multiple").send({
      urls: "invalid data",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "Datos inválidos");
  });

  it("Debe manejar errores internos del servidor", async () => {
    jest.spyOn(Blacklist, "find").mockImplementationOnce(() => {
      throw new Error("Simulated database error");
    });

    const response = await request(app)
      .post("/api/scan-multiple")
      .send({
        token: "user-token-123",
        urls: ["www.badactor.com"],
      });

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty("error", "Error interno del servidor");

    // Restaura la implementación original
    Blacklist.find.mockRestore();
  });
});
