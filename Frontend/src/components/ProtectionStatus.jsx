import React, { useState, useEffect, useCallback } from "react";
import { complementService } from "../api/axios.config";
import { storageService } from "../services/storage.service.js";
import { notifications } from "../services/notifications.service.js";

export const ProtectionStatus = () => {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const initializeStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedStatus = await storageService.getStatus();
      setIsActive(storedStatus);
    } catch (error) {
      console.error("Error al cargar el estado inicial:", error);
      notifications.error(
        "Error al cargar el estado",
        "No se pudo obtener el estado inicial"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeStatus();
  }, [initializeStatus]);

  const handleToggle = async () => {
    if (isUpdating) return; // Prevenir múltiples actualizaciones simultáneas

    try {
      setIsUpdating(true);
      // Actualizamos el estado visual inmediatamente
      const newStatus = !isActive;
      setIsActive(newStatus);

      const promise = complementService.updateStatus();

      await notifications.loading(promise, {
        loading: "Actualizando estado...",
        success: "Estado actualizado correctamente",
        error: "Error al actualizar el estado",
      });

      const result = await promise;
      await storageService.saveStatus(result.status);

      // Aseguramos que el estado final refleje la respuesta del servidor
      setIsActive(result.status);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      // Revertimos al estado anterior en caso de error
      const currentStatus = await storageService.getStatus();
      setIsActive(currentStatus);

      notifications.error(
        "Error al actualizar estado",
        "Ocurrió un error al cambiar el estado."
      );
    } finally {
      setIsUpdating(false);
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
            isLoading || isUpdating ? "opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={!isLoading && !isUpdating ? handleToggle : undefined}
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
