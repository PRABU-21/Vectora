import express from "express";
import { 
  createFreelancerProfile,
  getFreelancerProfile,
  getFreelancerById,
  getAllFreelancers,
  updateFreelancerProfile,
  deleteFreelancerProfile
} from "../controllers/freelancerController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes start with /api/freelancers

// Private routes (require authentication)
router.route('/profile')
  .post(protect, requireRole("applicant"), createFreelancerProfile)      // Create freelancer profile
  .get(protect, requireRole("applicant"), getFreelancerProfile)          // Get own freelancer profile
  .put(protect, requireRole("applicant"), updateFreelancerProfile)       // Update freelancer profile
  .delete(protect, requireRole("applicant"), deleteFreelancerProfile);   // Delete freelancer profile

// Public routes
router.route('/').get(getAllFreelancers);      // Get all freelancers with filters
router.route('/:id').get(getFreelancerById);  // Get freelancer by ID

export default router;