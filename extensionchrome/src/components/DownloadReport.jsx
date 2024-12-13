import { DownloadIcon } from "lucide-react";
import { urlService } from "../api/axios.config.js";
import { notifications } from "../services/notifications.service";

export const DownloadReport = () => {
  const handleClick = async () => {
    try {
      notifications.success(
        "Generando informe...",
        "Por favor, espera un momento."
      );
      const response = await urlService.generateReport({
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();

      notifications.success(
        "Informe generado",
        "El informe se descargó exitosamente."
      );
    } catch (error) {
      console.error("Error generando el informe PDF:", error);

      notifications.error(
        "Error al generar el informe",
        "Hubo un problema generando o descargando el informe."
      );
    }
  };

  return (
    <div className="px-4 py-3 w-full">
      <button
        className="w-full flex items-center justify-center gap-2 p-2 text-sm 
      text-gray-600 hover:bg-gray-100 rounded-md shadow-sm transition-colors"
        onClick={handleClick}
      >
        <span>Informe del día</span>
        <DownloadIcon size={16} />
      </button>
    </div>
  );
};
