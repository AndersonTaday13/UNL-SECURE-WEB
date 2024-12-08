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
  // Actualizar estado
  updateStatus: async () => {
    try {
      const token = await storageService.getToken();
      if (!token) throw new Error("No token available");
      const response = await axiosInstance.put("/update-State", { token });
      // Actualizar el estado en localStorage
      storageService.saveStatus(response.data.status);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getIntervals: async () => {
    try {
      const token = await storageService.getToken();
      if (!token) throw new Error("No token available");

      const response = await axiosInstance.get("/get-Interval", {
        headers: { token },
      });

      // Guardar el intervalo actual en localStorage
      if (response.data.currentInterval) {
        await storageService.saveInterval(response.data.currentInterval);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Actualizar intervalo
  updateInterval: async (interval) => {
    try {
      const token = await storageService.getToken();
      if (!token) throw new Error("No token available");

      const response = await axiosInstance.put("/update-Interval", {
        token,
        interval,
      });

      // Actualizar el intervalo en localStorage
      await storageService.saveInterval(response.data.interval);

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
      const token = await storageService.getToken();
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
