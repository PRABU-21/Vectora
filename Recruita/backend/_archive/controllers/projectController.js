import Project from '../models/Project.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    const { title, description, skills, minBudget, maxBudget, duration, deadline } = req.body;

    // Validate required fields
    if (!title || !description || !skills || !minBudget || !maxBudget || !duration || !deadline) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate budget range
    if (minBudget > maxBudget) {
      return res.status(400).json({ message: 'Minimum budget cannot be greater than maximum budget' });
    }

    // Validate deadline is in the future
    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({ message: 'Deadline must be in the future' });
    }

    const project = new Project({
      title,
      description,
      skills,
      minBudget,
      maxBudget,
      duration,
      deadline,
      postedBy: req.userId
    });

    await project.save();

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects with filters
// @route   GET /api/projects
// @access  Public
export const getProjects = async (req, res) => {
  try {
    const { 
      search, 
      minBudget, 
      maxBudget, 
      duration, 
      skills, 
      status,
      sortBy = 'latest',
      excludeMine
    } = req.query;

    let filter = {};

    // Exclude current user's own projects when requested and auth is present
    if (excludeMine === 'true' && req.userId) {
      filter.postedBy = { $ne: req.userId };
    }

    // Add search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Add budget filter
    if (minBudget || maxBudget) {
      filter.$and = [];
      if (minBudget) {
        filter.$and.push({ minBudget: { $gte: Number(minBudget) } });
      }
      if (maxBudget) {
        filter.$and.push({ maxBudget: { $lte: Number(maxBudget) } });
      }
    }

    // Add duration filter
    if (duration) {
      filter.duration = { $lte: Number(duration) };
    }

    // Add skills filter
    if (skills) {
      filter.skills = { $in: skills.split(',') };
    }

    // Add status filter
    if (status) {
      filter.status = status;
    }

    // Build query
    let query = Project.find(filter);

    // Add sorting
    switch (sortBy) {
      case 'highest-budget':
        query = query.sort({ maxBudget: -1, minBudget: -1 });
        break;
      case 'ending-soon':
        query = query.sort({ deadline: 1 });
        break;
      case 'latest':
      default:
        query = query.sort({ createdAt: -1 });
        break;
    }

    const projects = await query;

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Public
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (only project owner)
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project
    const projectOwnerId = project.postedBy.toString();
    const currentUserId = req.userId.toString();
    if (projectOwnerId !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized to update this project' });
    }

    const allowedUpdates = [
      'title', 'description', 'skills', 'minBudget', 'maxBudget', 
      'duration', 'deadline', 'status'
    ];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates!' });
    }

    updates.forEach(update => {
      project[update] = req.body[update];
    });

    await project.save();

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (only project owner)
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project
    const projectOwnerId = project.postedBy.toString();
    const currentUserId = req.userId.toString();
    if (projectOwnerId !== currentUserId) {
      return res.status(403).json({ message: 'Not authorized to delete this project' });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get projects by user
// @route   GET /api/projects/my-projects
// @access  Private
export const getMyProjects = async (req, res) => {
  try {
    // Validate the user ID
    if (!req.userId) {
      return res.status(401).json({ 
        message: 'Not authorized',
        success: false
      });
    }
    
    // Ensure the user ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.userId)) {
      return res.status(400).json({ 
        message: 'Invalid user ID',
        success: false 
      });
    }
    
    // Fetch projects posted by the authenticated user
    const projects = await Project.find({ postedBy: req.userId }).populate('postedBy', 'name email');
    
    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid user ID',
        success: false
      });
    }
    console.error('Error fetching my projects:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message,
      success: false
    });
  }
};