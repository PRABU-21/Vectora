import express from "express";
import {
  getAllJobs,
  getJobRecommendations,
  applyToJob,
  getAppliedJobs,
} from "../controllers/jobController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all jobs (public or protected based on your requirements)
router.get("/", getAllJobs);

// Get personalized job recommendations based on resume similarity
// Protected route - requires authentication
router.get("/recommendations", protect, getJobRecommendations);

// Apply to a job
// Protected route - requires authentication
router.post("/apply", protect, applyToJob);

// Get applied jobs for the user
// Protected route - requires authentication
router.get("/applied", protect, getAppliedJobs);

export default router;
