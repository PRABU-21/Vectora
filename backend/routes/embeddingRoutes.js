import express from "express";
import { upload, uploadEmbedding, getEmbeddings } from "../controllers/embeddingController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload TXT file and create embeddings
router.post("/upload-embedding", protect, requireRole("applicant"), upload.single('file'), uploadEmbedding);

// Get embeddings
router.get("/embeddings", protect, requireRole("applicant"), getEmbeddings);

export default router;