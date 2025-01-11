// Importaciones
import request from "supertest";
import jest from "jest-mock";
import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "../src/app.js";
import Complement from "../src/models/complement.model.js";

dotenv.config();

// Configuración inicial
beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  await mongoose.connection.db.dropDatabase();

  await Complement.create({
    token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
  });
});

// Limpieza de conexiones después de cada prueba
afterEach(async () => {
  await mongoose.connection.db.dropDatabase();
});

// Cierre final
afterAll(async () => {
  await mongoose.connection.close();
});

describe("Complement pruebas", () => {
  describe("POST /api/register", () => {
    it("Debe registrar un complemento correctamente", async () => {
      const response = await request(app).post("/api/register").send({});
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
    });

    it("debe devolver un error si la base de datos falla", async () => {
      jest
        .spyOn(Complement, "create")
        .mockRejectedValueOnce(new Error("Error en la base de datos"));

      const response = await request(app).post("/api/register").send({});
      expect(response.status).toBe(500);
      expect(response.body.message).toBe("Error en la base de datos");
    });
  });

  describe("PUT /api/update-State", () => {
    it("Debe actualizar el estado del complemento", async () => {
      const response = await request(app)
        .put("/api/update-State")
        .send({ token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt" });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(false);
    });

    it("Debe devolver un error si no se encuentra el complemento", async () => {
      const response = await request(app)
        .put("/api/update-State")
        .send({ token: "invalido" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Complement no encontrado");
    });
  });

  describe("PUT /api/update-Interval", () => {
    it("Debe actualizar el intervalo del complemento", async () => {
      const response = await request(app).put("/api/update-Interval").send({
        token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
        interval: "1 minuto(s)",
      });

      expect(response.status).toBe(200);
      expect(response.body.interval).toBe("1 minuto(s)");
    });

    it("Debe devolver un error si el intervalo no es válido", async () => {
      const response = await request(app).put("/api/update-Interval").send({
        token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt",
        interval: "10 minutos(s)",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Intervalo no válido");
    });
  });

  describe("GET /api/get-Interval", () => {
    it("Debe devolver los intervalos disponibles y el actual", async () => {
      const response = await request(app)
        .get("/api/get-Interval")
        .set({ token: "ad3f05fe8542f448c94b548460e9d5dc-m5kk2upt" });

      expect(response.status).toBe(200);
      expect(response.body.intervals).toContain("DEFAULT");
      expect(response.body.currentInterval).toBe("DEFAULT");
    });
  });
});
