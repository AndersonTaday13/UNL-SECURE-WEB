import express from "express";
import "dotenv/config";
import morgan from "morgan";
import complementRouter from "./routes/complement.route.js";
import scannerRouter from "./routes/scanner.route.js";

const app = express();

//middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.use("/api/v1/complement", complementRouter);
app.use("/api/v1/scanner", scannerRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:3000");
});
