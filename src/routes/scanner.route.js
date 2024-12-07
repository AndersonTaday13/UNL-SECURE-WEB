import express from "express";
const router = express.Router();
import { receiveUrl } from "../controllers/scannerDom.controllers.js";

router.post("/receive-url", receiveUrl);

export default router;
