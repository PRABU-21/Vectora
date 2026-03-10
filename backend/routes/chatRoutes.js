import express from "express";
import { handleChat } from "../controllers/chatController.js";
import { optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", optionalProtect, handleChat);

export default router;