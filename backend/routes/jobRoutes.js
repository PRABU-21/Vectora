import express from "express";
import {
  getAllJobs,
  getJobRecommendations,
  applyToJob,
  getAppliedJobs,
  fetchExternalJobs,
  getExternalJobs,
  getLeetCodeProfile,
  fetchAndEmbedAdzunaJobs,
} from "../controllers/jobController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Fetch jobs from Adzuna and auto-generate embeddings
router.get("/fetch-adzuna", fetchAndEmbedAdzunaJobs);

// Pull fresh jobs from external API and cache to JSON
router.get("/fetch-external", fetchExternalJobs);

// Read cached external jobs JSON
router.get("/external", getExternalJobs);

// Fetch LeetCode profile stats by username
router.get("/leetcode/:username", getLeetCodeProfile);

// Get all jobs (public or protected based on your requirements)
router.get("/", getAllJobs);

// Get personalized job recommendations based on resume similarity
// Protected route - requires authentication & applicant role
router.get("/recommendations", protect, requireRole("applicant"), getJobRecommendations);

// Apply to a job
// Protected route - requires authentication & applicant role
router.post("/apply", protect, requireRole("applicant"), applyToJob);

// Get applied jobs for the user
// Protected route - requires authentication & applicant role
router.get("/applied", protect, requireRole("applicant"), getAppliedJobs);

export default router;
