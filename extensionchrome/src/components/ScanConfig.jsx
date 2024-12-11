import { useState, useEffect } from "react";
import { complementService } from "../api/axios.config";
import { notifications } from "../services/notifications.service.js";

export const ScanConfig = () => {
  const [scanInterval, setScanInterval] = useState("");
  const [intervals, setIntervals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIntervals = async () => {
      try {
        const { intervals, currentInterval } =
          await complementService.getIntervals();
        setIntervals(intervals);
        setScanInterval(currentInterval);
      } catch (err) {
        setError("Error al cargar los intervalos");
        console.error("Error:", err);
        notifications.error(
          "Error",
          "Hubo un problema al cargar los intervalos."
        );
      } finally {
        setLoading(false);
      }
    };

    loadIntervals();
  }, []);

  const handleIntervalChange = (e) => {
    setScanInterval(e.target.value);
  };

  const handleApply = async () => {
    if (!scanInterval) return;

    try {
      await complementService.updateInterval(scanInterval);
      setError(null);
      notifications.success(
        "Éxito",
        "El intervalo se ha actualizado correctamente."
      );
    } catch (err) {
      setError("Error al actualizar el intervalo");
      console.error("Error:", err);
      notifications.error(
        "Error",
        "Ocurrió un problema al actualizar el intervalo."
      );
    }
  };

  const getIntervalText = (value) => {
    return value === "DEFAULT" ? "Por defecto" : value;
  };

  if (loading) {
    return <div className="text-center">Cargando...</div>;
  }

  return (
    <div className="px-4 py-3 w-full">
      <h2 className="text-sm font-medium mb-3 text-center">
        Configuración Adicional
      </h2>
      {error && (
        <p className="text-red-500 text-sm mb-2 text-center">{error}</p>
      )}
      <div className="flex gap-2 justify-center">
        <select
          className="flex-1 p-2 border rounded-md text-sm shadow-sm"
          value={scanInterval}
          onChange={handleIntervalChange}
        >
          {intervals.map((interval) => (
            <option key={interval} value={interval}>
              {getIntervalText(interval)}
            </option>
          ))}
        </select>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm 
          hover:bg-blue-600 shadow-sm"
          onClick={handleApply}
          disabled={!scanInterval}
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};
