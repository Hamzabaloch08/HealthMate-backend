import express from "express";
import { chat } from "../controllers/aiController.mjs";
import uploadFile from "../middleware/multerMiddleware.mjs";

const router = express.Router();

router.post("/chat", uploadFile, chat);

export default router;
