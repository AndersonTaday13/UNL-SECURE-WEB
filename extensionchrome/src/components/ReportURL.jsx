import React, { useState } from "react";
import { urlService } from "../api/axios.config";

export const ReportURL = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      await urlService.reportUrl(url);
      setUrl(""); // Limpiar el input después de éxito
      // Aquí podrías mostrar un mensaje de éxito
    } catch (error) {
      console.error("Error al reportar URL:", error);
      // Aquí podrías mostrar un mensaje de error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-3 w-full">
      <h2 className="text-sm font-medium mb-3 text-center">Reportar URL</h2>
      <div className="flex gap-2 justify-center">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://ejemplo.com"
          className="flex-1 p-2 border rounded-md text-sm shadow-sm"
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`px-4 py-2 ${
            isLoading ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"
          } text-white rounded-md text-sm shadow-sm`}
        >
          {isLoading ? "Añadiendo..." : "Añadir"}
        </button>
      </div>
    </div>
  );
};
