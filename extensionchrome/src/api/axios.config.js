import axios from "axios";
import { storageService } from "./storageService.js";

const API_URL = "http://localhost:3000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const complementService = {
  // Registrar o recuperar complemento
  register: async () => {
    try {
      const storedToken = storageService.getToken();

      const response = await axiosInstance.post("/register", {
        token: storedToken || undefined,
      });

      // Guardar todos los datos recibidos
      storageService.saveComplementData(response.data);

      return response.data;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error.response?.data || error.message;
    }
  },

  // Actualizar estado
  updateStatus: async () => {
    try {
      const token = storageService.getToken();
      if (!token) throw new Error("No token available");

      const response = await axiosInstance.put("/update-State", { token });

      // Actualizar el estado en localStorage
      storageService.saveStatus(response.data.status);

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Actualizar intervalo
  updateInterval: async (interval) => {
    try {
      const token = storageService.getToken();
      if (!token) throw new Error("No token available");

      const response = await axiosInstance.put("/update-Interval", {
        token,
        interval,
      });

      // Actualizar el intervalo en localStorage
      storageService.saveInterval(response.data.interval);

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const urlService = {
  // Reportar URL
  reportUrl: async (url) => {
    try {
      const token = storageService.getToken();
      if (!token) throw new Error("No token available");

      const response = await axiosInstance.post("/report-url", {
        token,
        url,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};
