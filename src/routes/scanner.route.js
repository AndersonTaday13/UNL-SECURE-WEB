import express from "express";
const router = express.Router();
import {
  scanUrl,
  scanMultipleUrls,
} from "../controllers/scannerDom.controllers.js";

router.post("/scan", scanUrl);
router.post("/scan-multiple", scanMultipleUrls);

export default router;
