import express from "express";
import aiRoutes from "./aiRoutes.mjs";
import healthRoutes from "./healthRoutes.mjs";
const router = express.Router();

router.use("/ai", aiRoutes);
router.use("/health", healthRoutes);

export default router;
