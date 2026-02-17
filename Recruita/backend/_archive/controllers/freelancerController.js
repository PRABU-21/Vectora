import Freelancer from '../models/Freelancer.js';
import User from '../models/User.js';

// @desc    Create or update freelancer profile
// @route   POST /api/freelancers/profile
// @access  Private
export const createFreelancerProfile = async (req, res) => {
  try {
    const { title, bio, skills, hourlyRate, portfolio, experience, languages, location } = req.body;

    // Check if user already has a freelancer profile
    let freelancer = await Freelancer.findOne({ userId: req.userId });

    if (freelancer) {
      // Update existing profile
      freelancer.title = title || freelancer.title;
      freelancer.bio = bio || freelancer.bio;
      freelancer.skills = skills || freelancer.skills;
      freelancer.hourlyRate = hourlyRate !== undefined ? hourlyRate : freelancer.hourlyRate;
      freelancer.portfolio = portfolio || freelancer.portfolio;
      freelancer.experience = experience || freelancer.experience;
      freelancer.languages = languages || freelancer.languages;
      freelancer.location = location || freelancer.location;

      await freelancer.save();
    } else {
      // Create new profile
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      freelancer = new Freelancer({
        userId: req.userId,
        name: user.name,
        email: user.email,
        title,
        bio: bio || '',
        skills: skills || [],
        hourlyRate: hourlyRate || 0,
        portfolio: portfolio || [],
        experience: experience || {},
        languages: languages || [],
        location: location || {}
      });

      await freelancer.save();
    }

    res.status(201).json({
      success: true,
      data: freelancer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get freelancer profile by user ID
// @route   GET /api/freelancers/profile
// @access  Private
export const getFreelancerProfile = async (req, res) => {
  try {
    const freelancer = await Freelancer.findOne({ userId: req.userId });
    
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer profile not found' });
    }

    res.status(200).json({
      success: true,
      data: freelancer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get freelancer profile by freelancer ID
// @route   GET /api/freelancers/:id
// @access  Public
export const getFreelancerById = async (req, res) => {
  try {
    const freelancer = await Freelancer.findById(req.params.id);
    
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }

    if (!freelancer.isActive) {
      return res.status(404).json({ message: 'Freelancer profile is not active' });
    }

    res.status(200).json({
      success: true,
      data: freelancer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all freelancers with filters
// @route   GET /api/freelancers
// @access  Public
export const getAllFreelancers = async (req, res) => {
  try {
    const { 
      skills, 
      minRate, 
      maxRate, 
      experienceLevel, 
      location, 
      availability, 
      search 
    } = req.query;

    let filter = { isActive: true };

    // Add filters
    if (skills) {
      filter.skills = { $in: skills.split(',') };
    }
    if (minRate) {
      filter.hourlyRate = { ...filter.hourlyRate, $gte: Number(minRate) };
    }
    if (maxRate) {
      filter.hourlyRate = { ...filter.hourlyRate, $lte: Number(maxRate) };
    }
    if (experienceLevel) {
      filter['experience.level'] = experienceLevel;
    }
    if (location) {
      filter['location.country'] = { $regex: location, $options: 'i' };
    }
    if (availability) {
      filter.availability = availability;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const freelancers = await Freelancer.find(filter);

    res.status(200).json({
      success: true,
      count: freelancers.length,
      data: freelancers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update freelancer profile
// @route   PUT /api/freelancers/profile
// @access  Private
export const updateFreelancerProfile = async (req, res) => {
  try {
    const freelancer = await Freelancer.findOne({ userId: req.userId });

    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer profile not found' });
    }

    const allowedUpdates = [
      'title', 'bio', 'skills', 'hourlyRate', 'portfolio', 
      'experience', 'languages', 'location', 'availability', 'profileImage'
    ];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates!' });
    }

    updates.forEach(update => {
      freelancer[update] = req.body[update];
    });

    await freelancer.save();

    res.status(200).json({
      success: true,
      data: freelancer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete freelancer profile
// @route   DELETE /api/freelancers/profile
// @access  Private
export const deleteFreelancerProfile = async (req, res) => {
  try {
    const freelancer = await Freelancer.findOne({ userId: req.userId });

    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer profile not found' });
    }

    // Instead of deleting, set isActive to false
    freelancer.isActive = false;
    await freelancer.save();

    res.status(200).json({
      success: true,
      message: 'Freelancer profile deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};