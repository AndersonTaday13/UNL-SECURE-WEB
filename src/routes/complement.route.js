import { Router } from "express";
import {
  register,
  updateInterval,
  updateStatus,
} from "../controllers/complement.controller.js";

const router = Router();

router.post("/register", register);
router.put("/update-State", updateStatus);
router.put("/update-Interval", updateInterval);

export default router;
