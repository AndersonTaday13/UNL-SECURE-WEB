import React, { useState, useEffect } from "react";
import { complementService } from "../api/axios.config";
import { storageService } from "../api/storageService";

export const ProtectionStatus = () => {
  const [isActive, setIsActive] = useState(false);

  // Efecto para cargar el estado inicial desde localStorage
  useEffect(() => {
    const storedStatus = storageService.getStatus();
    setIsActive(storedStatus);
  }, []);

  const handleToggle = async () => {
    try {
      const result = await complementService.updateStatus();
      setIsActive(result.status);
    } catch (error) {
      console.error("Error al actualizar estado:", error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  return (
    <div className="p-4 flex flex-col items-center bg-gray-50 rounded-lg mx-4 shadow-sm">
      <h2 className="text-sm font-medium mb-4">Estado de protección</h2>
      <div className="flex items-center justify-center">
        <div
          className={`w-12 h-6 rounded-full relative ${
            isActive ? "bg-green-500" : "bg-gray-300"
          } 
          transition-colors cursor-pointer shadow-sm`}
          onClick={handleToggle}
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
