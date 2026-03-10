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
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes start with /api/proposals

// Private routes (require authentication)
router.route('/').post(protect, requireRole("applicant"), createProposal);                    // Create new proposal
router.route('/my-proposals').get(protect, requireRole("applicant"), getMyProposals);        // Get user's proposals
router.route('/my-active-projects').get(protect, requireRole("applicant"), getMyActiveProjects); // Get active projects for freelancer
router.route('/project/:projectId').get(protect, requireRole("applicant"), getProposalsByProject); // Get proposals for a project
router.route('/:id').get(protect, requireRole("applicant"), getProposalById);                // Get proposal by ID
router.route('/:id/status').put(protect, requireRole("applicant"), updateProposalStatus);    // Update proposal status
router.route('/:id/submit-work').put(protect, requireRole("applicant"), submitProposalWork); // Freelancer submits final work

export default router;