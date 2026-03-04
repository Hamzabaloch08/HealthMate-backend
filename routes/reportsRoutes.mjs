import express from "express";
import { addReport, getReports, editReport, deleteReport } from "../controllers/reportsController.mjs";
import uploadFile from "../middleware/multerMiddleware.mjs";

const router = express.Router();

router.post("/", uploadFile, addReport);
router.get("/", getReports);
router.put("/:id", uploadFile, editReport);
router.delete("/:id", deleteReport);

export default router;
