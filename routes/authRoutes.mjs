import express from "express";
import { signUp, login, check } from "../controllers/authController.mjs";

const authRoutes = express.Router();

authRoutes.post("/signup", signUp);
authRoutes.post("/login", login);
authRoutes.get("/check", check);


export default authRoutes;
