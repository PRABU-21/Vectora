import express from "express";
import multer from "multer";
import path from "path";
import {
  createJob,
  getMyJobs,
  getJobApplicants,
  bulkUpdateApplications,
  applyToJob,
  getPublicJob,
  closeJob,
} from "../controllers/jobController.js";
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

// Protected routes (for recruiters)
router.post("/", protect, createJob); // Create a new job
router.get("/", protect, getMyJobs); // Get all jobs for logged-in recruiter
router.get("/:jobId/applicants", protect, getJobApplicants); // Get applicants for a job
router.post("/:jobId/bulk-update", protect, bulkUpdateApplications); // Bulk select/reject
router.patch("/:jobId/close", protect, closeJob); // Close a job manually

// Public routes (for applicants)
router.get("/:jobId/public", getPublicJob); // Get public job details
router.post("/:jobId/apply", upload.single("resume"), (req, res) => {
  req.resumeFile = req.file;
  applyToJob(req, res);
}); // Apply to a job

export default router;
