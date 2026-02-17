import express from "express";
import { shortlistResumes } from "../controllers/recruiterController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/recruiter/shortlist
// Body: { jobDescription: string, skills?: string[], topN?: number, experienceRange?: { minYears?, maxYears? } }
router.post("/shortlist", protect, shortlistResumes);

export default router;