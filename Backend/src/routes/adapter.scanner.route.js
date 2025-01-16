import express from "express";
const router = express.Router();
import { checkUrls } from "../controllers/adapter.scanner.controller.js";

router.post("/test-scan-multiple", checkUrls);

export default router;
