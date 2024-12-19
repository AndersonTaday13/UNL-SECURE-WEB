import express from "express";
const router = express.Router();
import { downloadReport } from "../controllers/downloadReport.controller.js";

router.post("/download-report", downloadReport);

export default router;
