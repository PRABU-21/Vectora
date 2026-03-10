import express from "express";
import { 
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getMyProjects
} from "../controllers/projectController.js";
import { protect, optionalProtect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes start with /api/projects

// Public routes (optional auth to exclude own projects from public list)
router.route('/').get(optionalProtect, getProjects);              // Get all projects with filters

// Private routes (require authentication)
router.route('/').post(protect, requireRole("applicant"), createProject); // Create new project
router.route('/my-projects').get(protect, requireRole("applicant"), getMyProjects); // Get user's projects

// Routes with ID param (keep after specific routes to avoid collisions)
router.route('/:id').get(getProjectById);       // Get project by ID
router.route('/:id').put(protect, requireRole("applicant"), updateProject); // Update project
router.route('/:id').delete(protect, requireRole("applicant"), deleteProject); // Delete project

export default router;