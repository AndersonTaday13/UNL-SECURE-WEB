import { Router } from "express";
import { UrlExtractor } from "../controllers/scanner.controller.js";

const router = Router();

router.post("/", UrlExtractor.extractUrlsController);

export default router;
