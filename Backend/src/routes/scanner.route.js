import express from "express";
const router = express.Router();
import { scanMultipleUrls } from "../controllers/scanner.controller.js";

router.post("/scan-multiple", scanMultipleUrls);

export default router;
