import "dotenv/config";
import express from "express";
import cors from "cors";
import "./config/db.mjs";

import protectedRoutes from "./routes/index.mjs";
import { protect } from "./middleware/authMiddleware.mjs";
import authRoutes from "./routes/authRoutes.mjs";

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// AUTH Routes
app.use("/api/v1/auth", authRoutes);

// API Routes
app.use("/api/v1", protect, protectedRoutes);

const port = process.env.PORT || 4000;

app.listen(port, () => console.log(`✅ Server running on port ${port}`));

export default app;
