import React, { useState } from "react";

export const ScanConfig = () => {
  const [scanInterval, setScanInterval] = useState("");
  return (
    <div className="px-4 py-3 w-full">
      <h2 className="text-sm font-medium mb-3 text-center">
        Configuración Adicional
      </h2>
      <div className="flex gap-2 justify-center">
        <select
          className="flex-1 p-2 border rounded-md text-sm shadow-sm"
          value={scanInterval}
          onChange={(e) => setScanInterval(e.target.value)}
        >
          <option value="">Tiempo</option>
          <option value="5">5 minutos</option>
          <option value="15">15 minutos</option>
          <option value="30">30 minutos</option>
          <option value="60">1 hora</option>
        </select>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm 
          hover:bg-blue-600 shadow-sm"
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};
