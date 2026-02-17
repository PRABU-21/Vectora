import Proposal from '../models/Proposal.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

// @desc    Create a new proposal
// @route   POST /api/proposals
// @access  Private
export const createProposal = async (req, res) => {
  try {
    const { projectId, expectedCost, expectedDelivery, description } = req.body;

    // Validate required fields
    if (!projectId || !expectedCost || !expectedDelivery || !description) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is trying to apply to their own project
    if (project.postedBy.toString() === req.userId) {
      return res.status(400).json({ message: 'Cannot apply to your own project' });
    }

    // Create proposal
    const proposal = new Proposal({
      projectId,
      freelancerId: req.userId,
      expectedCost,
      expectedDelivery,
      description
    });

    await proposal.save();

    // Update project applicants count
    project.applicants += 1;
    await project.save();

    res.status(201).json({
      success: true,
      data: proposal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all proposals for a specific project
// @route   GET /api/proposals/project/:projectId
// @access  Private (only project owner)
export const getProposalsByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project
    if (project.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view proposals for this project' });
    }

    const proposals = await Proposal.find({ projectId: req.params.projectId })
      .populate('freelancerId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all proposals by a freelancer
// @route   GET /api/proposals/my-proposals
// @access  Private
export const getMyProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({ freelancerId: req.userId })
      .populate('projectId', 'title description status minBudget maxBudget duration deadline')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active projects for the authenticated freelancer (accepted/shortlisted proposals)
// @route   GET /api/proposals/my-active-projects
// @access  Private
export const getMyActiveProjects = async (req, res) => {
  try {
    const proposals = await Proposal.find({
      freelancerId: req.userId,
      status: { $in: ['Accepted', 'Shortlisted'] }
    })
      .populate('projectId', 'title description status minBudget maxBudget duration deadline postedBy applicants')
      .sort({ updatedAt: -1 });

    const projects = proposals
      .map((proposal) => proposal.projectId)
      .filter(Boolean)
      .filter((project) => project.status !== 'Completed' && project.status !== 'Closed');

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update proposal status
// @route   PUT /api/proposals/:id/status
// @access  Private (only project owner)
export const updateProposalStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const proposal = await Proposal.findById(req.params.id).populate('projectId');
    
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check if user owns the project that the proposal is for
    const project = await Project.findById(proposal.projectId);
    if (project.postedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this proposal status' });
    }

    const validStatuses = ['Submitted', 'Viewed', 'Shortlisted', 'Accepted', 'Rejected', 'In Progress', 'Needs Updates', 'Submitted Work', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    proposal.status = status;
    await proposal.save();

    // Keep project status in sync for key milestones
    if (status === 'Accepted' || status === 'In Progress' || status === 'Needs Updates') {
      project.status = 'In Progress';
      await project.save();
    }

    if (status === 'Completed') {
      project.status = 'Completed';
      await project.save();
    }

    res.status(200).json({
      success: true,
      data: proposal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Freelancer submits final work (link/notes) and moves to Submitted Work
// @route   PUT /api/proposals/:id/submit-work
// @access  Private (freelancer only)
export const submitProposalWork = async (req, res) => {
  try {
    const { deliveryUrl = '', deliveryNote = '' } = req.body;

    const proposal = await Proposal.findById(req.params.id).populate('projectId');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.freelancerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to submit work for this proposal' });
    }

    proposal.deliveryUrl = deliveryUrl;
    proposal.deliveryNote = deliveryNote;
    proposal.deliverySubmittedAt = new Date();
    proposal.status = 'Submitted Work';

    await proposal.save();

    res.status(200).json({
      success: true,
      data: proposal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get proposal by ID
// @route   GET /api/proposals/:id
// @access  Private (only project owner or freelancer)
export const getProposalById = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('projectId', 'title description')
      .populate('freelancerId', 'name email');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check if user is the project owner or the freelancer who submitted the proposal
    const project = await Project.findById(proposal.projectId);
    if (project.postedBy.toString() !== req.userId && proposal.freelancerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view this proposal' });
    }

    res.status(200).json({
      success: true,
      data: proposal
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};