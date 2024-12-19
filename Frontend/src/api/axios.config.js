import { storageService } from "../services/storage.service.js";
import { axiosInstance } from "../services/axiosInstance.service.js";

export const complementService = {
  updateStatus: async () => {
    try {
      const token = await storageService.getToken();
      if (!token) throw new Error("No token available");
      const response = await axiosInstance.put("/update-State", { token });
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

      if (response.data.currentInterval) {
        await storageService.saveInterval(response.data.currentInterval);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateInterval: async (interval) => {
    try {
      const token = await storageService.getToken();
      if (!token) throw new Error("No token available");

      const response = await axiosInstance.put("/update-Interval", {
        token,
        interval,
      });

      await storageService.saveInterval(response.data.interval);

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export const urlService = {
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
  generateReport: async () => {
    try {
      const token = await storageService.getToken();
      if (!token) {
        throw new Error("Token no encontrado. Por favor, inicia sesión.");
      }

      const response = await axiosInstance.post(
        "/download-report",
        { token },
        { responseType: "blob" }
      );

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = window.URL.createObjectURL(pdfBlob);

      return pdfUrl;
    } catch (error) {
      console.error("Error generando el reporte PDF:", error);
      throw new Error("No se pudo generar el reporte.");
    }
  },
};
