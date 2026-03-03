import express from "express";
import { addVitals, getVitals, editVitals, deleteVitals } from "../controllers/healthController.mjs";
import { protect } from "../middleware/authMiddleware.mjs";

const router = express.Router();

// Add new vitals manually
router.post("/add", addVitals);

// Get all vitals for a user
router.get("/:userId", getVitals);

// Edit vitals by ID
router.put("/edit/:id", editVitals);

// Delete vitals by ID
router.delete("/delete/:id", deleteVitals);

export default router;
