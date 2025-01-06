import downloadThreatIntel from "./threatIntelDownloader.libs.js";
import cron from "node-cron";

const task = cron.schedule("*/2 * * * *", () => {
  downloadThreatIntel()
    .then(() => console.log("Tarea ejecutada exitosamente"))
    .catch((error) =>
      console.error("Error en la ejecución programada:", error)
    );
});

export default task;
