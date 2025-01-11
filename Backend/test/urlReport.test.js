import request from "supertest";
import app from "../src/app.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Complement from "../src/models/complement.model.js";
import Url from "../src/models/urlReport.model.js";
dotenv.config();

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URL);
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();

  await Complement.create({
    token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
  });
  await Url.create({
    token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
    url: "www.axample1.com",
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("POST /api/report-url", () => {
  it("Registrar una URL correctamente si no existe", async () => {
    const response = await request(app).post("/api/report-url").send({
      token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
      url: "www.axampletest1.com",
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("msg", "URL reportada exitosamente");
  });

  it("Devolver un error si la URL ya ha sido reportada", async () => {
    const response = await request(app).post("/api/report-url").send({
      token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
      url: "www.axample1.com",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty(
      "error",
      "La URL ya ha sido reportada"
    );
  });

  it("Devolver un error si la URL no se proporciona", async () => {
    const response = await request(app).post("/api/report-url").send({
      token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error", "La URL es requerida");
  });

  it("Devolver un error si el token no es válido", async () => {
    const response = await request(app).post("/api/report-url").send({
      token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt-invalid",
      url: "www.axampletest1.com",
    });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error", "Token no válido o inactivo");
  });
});
