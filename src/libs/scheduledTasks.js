import downloadThreatIntel from "./threatIntelDownloader.js";
import cron from "node-cron";

const task = cron.schedule("*/30 * * * *", () => {
  downloadThreatIntel()
    .then(() => console.log("Tarea ejecutada exitosamente"))
    .catch((error) =>
      console.error("Error en la ejecución programada:", error)
    );
});

export default task;
