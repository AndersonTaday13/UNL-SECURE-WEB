// direccion src/services/complement.service.js:

import { axiosInstance } from "./axiosInstance.service.js";
import { storageService } from "./storage.service.js";

export const complementService = {
  register: async () => {
    try {
      const storedToken = await storageService.getToken();
      console.log("Token almacenado:", storedToken);

      const response = await axiosInstance.post("/register", {
        token: storedToken || undefined,
      });

      const currentInterval = await storageService.getInterval();
      await storageService.saveComplementData({
        ...response.data,
        status: true,
        interval: currentInterval,
      });

      return response.data;
    } catch (error) {
      console.error("Error en registro:", error);

      // Manejo de errores más detallado
      if (error.response) {
        // El servidor respondió con un estado fuera del rango 2xx
        console.error("Datos de error:", error.response.data);
        console.error("Código de estado:", error.response.status);
      } else if (error.request) {
        // La solicitud se realizó pero no se recibió respuesta
        console.error("No se recibió respuesta del servidor");
      } else {
        // Algo sucedió al configurar la solicitud
        console.error("Error de configuración:", error.message);
      }

      throw error.response?.data || error.message;
    }
  },

  sendUrlsToBackend: async (urls) => {
    try {
      const token = await storageService.getToken();
      const response = await axiosInstance.post("/scan-multiple", {
        urls,
        token,
      });
      return response.data.urls;
    } catch (error) {
      console.error("Error enviando URLs al backend:", error);
      throw error.response?.data || error.message;
    }
  },
};
