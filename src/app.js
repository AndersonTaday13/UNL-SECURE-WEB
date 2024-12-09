import express from "express";
import morgan from "morgan";
import complementoRoutes from "./routes/complement.route.js";
import urlReport from "./routes/urlReport.route.js";
import scannerURL from "./routes/scanner.route.js";
import cors from "cors";
import task from "./libs/scheduledTasks.libs.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

task.start();
app.use("/api", complementoRoutes);
app.use("/api", urlReport);
app.use("/api", scannerURL);

export default app;
