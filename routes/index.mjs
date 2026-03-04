import express from "express";
import aiRoutes from "./aiRoutes.mjs";
import healthRoutes from "./healthRoutes.mjs";
import reportsRoutes from "./reportsRoutes.mjs";
const router = express.Router();

router.use("/ai", aiRoutes);
router.use("/health", healthRoutes);
router.use("/reports", reportsRoutes);

export default router;
