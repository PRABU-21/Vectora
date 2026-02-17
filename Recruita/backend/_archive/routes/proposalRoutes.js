import express from "express";
import { 
  createProposal,
  getProposalsByProject,
  getMyProposals,
  submitProposalWork,
  getMyActiveProjects,
  updateProposalStatus,
  getProposalById
} from "../controllers/proposalController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes start with /api/proposals

// Private routes (require authentication)
router.route('/').post(protect, createProposal);                    // Create new proposal
router.route('/my-proposals').get(protect, getMyProposals);        // Get user's proposals
router.route('/my-active-projects').get(protect, getMyActiveProjects); // Get active projects for freelancer
router.route('/project/:projectId').get(protect, getProposalsByProject); // Get proposals for a project
router.route('/:id').get(protect, getProposalById);                // Get proposal by ID
router.route('/:id/status').put(protect, updateProposalStatus);    // Update proposal status
router.route('/:id/submit-work').put(protect, submitProposalWork); // Freelancer submits final work

export default router;