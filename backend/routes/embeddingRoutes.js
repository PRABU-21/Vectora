import express from "express";
import { upload, uploadEmbedding, getEmbeddings, generateProfileEmbedding } from "../controllers/embeddingController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload TXT file and create embeddings
router.post("/upload-embedding", protect, requireRole("applicant"), upload.single('file'), uploadEmbedding);

// Generate embedding from profile text
router.post("/generate-profile", protect, requireRole("applicant"), generateProfileEmbedding);

// Get embeddings
router.get("/embeddings", protect, requireRole("applicant"), getEmbeddings);

export default router;