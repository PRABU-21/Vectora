import express from "express";
import multer from "multer";
import path from "path";
import {
  createJob,
  getMyJobs,
  getJobApplicants,
  getJobMatches,
  bulkUpdateApplications,
  closeJob,
  updateJob,
  deleteJob,
  getPublicJob,
  getPublicJobsList,
  applyToJob,
  shortlistResumes,
} from "../controllers/recruiterJobController.js";
import { protect, requireRole, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".txt", ".pdf", ".doc", ".docx"].includes(ext)) return cb(null, true);
    return cb(new Error("Only .txt, .pdf, .doc, .docx files are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Recruiter routes
router.post("/", protect, requireRole("recruiter"), createJob);
router.get("/", protect, requireRole("recruiter"), getMyJobs);
router.put("/:jobId", protect, requireRole("recruiter"), updateJob);
router.delete("/:jobId", protect, requireRole("recruiter"), deleteJob);
router.get("/:jobId/applicants", protect, requireRole("recruiter"), getJobApplicants);
router.get("/:jobId/matches", protect, requireRole("recruiter"), getJobMatches);
router.post("/:jobId/bulk-update", protect, requireRole("recruiter"), bulkUpdateApplications);
router.patch("/:jobId/close", protect, requireRole("recruiter"), closeJob);
router.post("/shortlist", protect, requireRole("recruiter"), shortlistResumes);

// Public/applicant routes
router.get("/public", getPublicJobsList);
router.get("/:jobId/public", getPublicJob);
router.post("/:jobId/apply", protect, requireRole("applicant"), upload.single("resume"), applyToJob);

export default router;