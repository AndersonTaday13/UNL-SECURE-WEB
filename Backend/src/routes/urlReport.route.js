import express from "express";
import { reportUrl } from "../controllers/urlReport.controller.js"; 

const router = express.Router();

router.post("/report-url", reportUrl);

export default router;
