import express from "express";
import morgan from "morgan";
import complementoRoutes from "./routes/complement.route.js";
import urlReport from "./routes/urlReport.route.js";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(morgan("dev"));
app.use(express.json());

app.use("/api", complementoRoutes);
app.use("/api", urlReport);

export default app;
