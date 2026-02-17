import express from "express";
import { 
  createFreelancerProfile,
  getFreelancerProfile,
  getFreelancerById,
  getAllFreelancers,
  updateFreelancerProfile,
  deleteFreelancerProfile
} from "../controllers/freelancerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes start with /api/freelancers

// Private routes (require authentication)
router.route('/profile')
  .post(protect, createFreelancerProfile)      // Create freelancer profile
  .get(protect, getFreelancerProfile)          // Get own freelancer profile
  .put(protect, updateFreelancerProfile)       // Update freelancer profile
  .delete(protect, deleteFreelancerProfile);   // Delete freelancer profile

// Public routes
router.route('/').get(getAllFreelancers);      // Get all freelancers with filters
router.route('/:id').get(getFreelancerById);  // Get freelancer by ID

export default router;