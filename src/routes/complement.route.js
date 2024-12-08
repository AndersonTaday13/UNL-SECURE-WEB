import { Router } from "express";
import {
  register,
  updateInterval,
  updateStatus,
  loadinterval,
} from "../controllers/complement.controller.js";

const router = Router();

router.post("/register", register);
router.put("/update-State", updateStatus);
router.put("/update-Interval", updateInterval);
router.get("/get-Interval", loadinterval);
export default router;
