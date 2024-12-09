import React, { useState, useEffect } from "react";
import { complementService } from "../api/axios.config";
import { storageService } from "../api/storageService";

export const ProtectionStatus = () => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Efecto para cargar el estado inicial
  useEffect(() => {
    const initializeStatus = async () => {
      try {
        setIsLoading(true);
        // Obtener el estado del almacenamiento local
        const storedStatus = await storageService.getStatus();
        setIsActive(storedStatus);
      } catch (error) {
        console.error("Error al cargar el estado inicial:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStatus();
  }, []);

  const handleToggle = async () => {
    try {
      setIsLoading(true);
      // Actualizar en el backend
      const result = await complementService.updateStatus();
      // Guardar en el almacenamiento local
      await storageService.saveStatus(result.status);
      setIsActive(result.status);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      // Revertir al estado anterior en caso de error
      const currentStatus = await storageService.getStatus();
      setIsActive(currentStatus);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col items-center bg-gray-50 rounded-lg mx-4 shadow-sm">
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col items-center bg-gray-50 rounded-lg mx-4 shadow-sm">
      <h2 className="text-sm font-medium mb-4">Estado de protección</h2>
      <div className="flex items-center justify-center">
        <div
          className={`w-12 h-6 rounded-full relative ${
            isActive ? "bg-green-500" : "bg-gray-300"
          } 
          transition-colors cursor-pointer shadow-sm ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={!isLoading ? handleToggle : undefined}
        >
          <div
            className={`absolute w-5 h-5 rounded-full bg-white top-0.5 left-0.5 
            transition-transform shadow-sm ${isActive ? "translate-x-6" : ""}`}
          />
        </div>
        <span className="ml-2 text-sm">
          {isActive ? "Activado" : "Desactivado"}
        </span>
      </div>
    </div>
  );
};
