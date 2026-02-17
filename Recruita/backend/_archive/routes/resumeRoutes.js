import express from "express";
import multer from "multer";
import { parseResume, saveParsedProfile, getParsedProfile } from "../controllers/resumeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

router.post("/parse", protect, upload.single("resume"), parseResume);
router.post("/save", protect, saveParsedProfile);
router.get("/profile", protect, getParsedProfile);

export default router;
