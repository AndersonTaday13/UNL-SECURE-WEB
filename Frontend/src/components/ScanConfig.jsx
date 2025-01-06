import { useState, useEffect } from "react";
import { complementService } from "../api/axios.config";
import { uiNotifications } from "../services/ui-notifications.service.js";
import { toast } from "sonner";

export const ScanConfig = () => {
  const [scanInterval, setScanInterval] = useState("");
  const [intervals, setIntervals] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingInterval, setPendingInterval] = useState(null);

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
        uiNotifications.error(
          "Error",
          "Hubo un problema al cargar los intervalos."
        );
      } finally {
        setLoading(false);
      }
    };

    loadIntervals();
  }, []);

  const updateInterval = async (newInterval) => {
    try {
      await complementService.updateInterval(newInterval);
      setScanInterval(newInterval);
      setPendingInterval(null);
      setError(null);
      uiNotifications.success(
        "Éxito",
        "El intervalo se ha actualizado correctamente."
      );
    } catch (err) {
      setError("Error al actualizar el intervalo");
      console.error("Error:", err);
      uiNotifications.error(
        "Error",
        "Ocurrió un problema al actualizar el intervalo."
      );
    }
  };

  const handleIntervalChange = (e) => {
    setPendingInterval(e.target.value);
  };

  const handleApply = async () => {
    if (!pendingInterval || pendingInterval === scanInterval) return;

    if (scanInterval === "DEFAULT") {
      toast.custom(
        (t) => (
          <div className="bg-white p-4 rounded-lg shadow-lg border">
            <h3 className="font-medium text-lg mb-2">
              ¿Cambiar modo de seguridad?
            </h3>
            <p className="text-gray-600 mb-4">
              El modo DEFAULT proporciona el nivel más alto de seguridad para tu
              sistema. Cambiar a otro modo podría reducir las medidas de
              seguridad implementadas. ¿Estás seguro de que deseas continuar?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
                onClick={() => {
                  setPendingInterval(scanInterval); // Revertir al valor anterior
                  toast.dismiss(t);
                }}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                onClick={() => {
                  updateInterval(pendingInterval);
                  toast.dismiss(t);
                }}
              >
                Confirmar cambio
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          position: "center",
        }
      );
    } else {
      updateInterval(pendingInterval);
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
          value={pendingInterval || scanInterval}
          onChange={handleIntervalChange}
        >
          {intervals.map((interval) => (
            <option key={interval} value={interval}>
              {getIntervalText(interval)}
            </option>
          ))}
        </select>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 shadow-sm"
          onClick={handleApply}
          disabled={!pendingInterval || pendingInterval === scanInterval}
        >
          Aplicar
        </button>
      </div>
    </div>
  );
};
