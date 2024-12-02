import { Router } from "express";
import { ComplementController } from "../controllers/complement.controller.js";

const router = Router();

router.post("/create", ComplementController.create);
router.put("/status", ComplementController.updateStatus);
router.put("/interval", ComplementController.updateInterval);

export default router;
