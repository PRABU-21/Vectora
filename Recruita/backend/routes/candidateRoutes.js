import express from "express";
import multer from "multer";
import path from "path";
import {
  signup,
  login,
  getProfile,
  parseResume,
  parseResumeJson,
  getAllJobs,
  applyToJob,
  getMyApplications,
} from "../controllers/candidateController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".txt" || ext === ".pdf" || ext === ".doc" || ext === ".docx") {
      cb(null, true);
    } else {
      cb(new Error("Only .txt, .pdf, .doc, .docx files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Protected routes
router.get("/profile", protect, getProfile);
router.post("/parse-resume", protect, upload.single("resume"), (req, res) => {
  req.resumeFile = req.file;
  parseResume(req, res);
});
router.post("/parse-resume-json", protect, parseResumeJson);
router.get("/jobs", protect, getAllJobs);
router.post("/apply/:jobId", protect, applyToJob);
router.get("/applications", protect, getMyApplications);

export default router;
