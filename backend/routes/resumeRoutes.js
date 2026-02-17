import express from "express";
import multer from "multer";
import { parseResume, saveParsedProfile, getParsedProfile } from "../controllers/resumeController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/parse", protect, requireRole("applicant"), upload.single("resume"), parseResume);
router.post("/save", protect, requireRole("applicant"), saveParsedProfile);
router.get("/profile", protect, requireRole("applicant"), getParsedProfile);

export default router;
