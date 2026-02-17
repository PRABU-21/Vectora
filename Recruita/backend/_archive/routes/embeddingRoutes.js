import express from "express";
import { upload, uploadEmbedding, getEmbeddings } from "../controllers/embeddingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Upload TXT file and create embeddings
router.post("/upload-embedding", protect, upload.single('file'), uploadEmbedding);

// Get embeddings
router.get("/embeddings", protect, getEmbeddings);

export default router;