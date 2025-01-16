import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";

import complementoRoutes from "./routes/complement.route.js";
import urlReport from "./routes/urlReport.route.js";
import scannerURL from "./routes/scanner.route.js";
//import task from "./libs/scheduledTasks.libs.js";
import downloadRouter from "./routes/downloadReport.route.js";
import testScanner from "./routes/adapter.scanner.route.js";

const app = express();

app.use(express.static(path.join(path.resolve(), "src", "public")));
app.set("views", path.join(path.resolve(), "src", "views"));
app.set("view engine", "ejs");

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

//task.start();
app.use("/api", complementoRoutes);
app.use("/api", urlReport);
app.use("/api", scannerURL);
app.use("/api", downloadRouter);
app.use("/test", testScanner);

export default app;
