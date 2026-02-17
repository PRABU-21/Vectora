import jwt from "jsonwebtoken";
import User from "../models/User.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      role,
      companyName,
      companyDescription,
      companyIndustry,
      companyTechStack = [],
      teamMembers = [],
      city,
      state,
      country,
      primaryJobRole,
      totalExperience,
      highestEducation,
      currentStatus,
      primarySkills,
      preferredJobRoles,
      preferredLocations,
      employmentType,
    } = req.body;

    // Normalize for consistent lookups
    const normalizedEmail = (email || "").toLowerCase();
    const normalizedRole = (role || "applicant").toLowerCase();

    if (!["applicant", "recruiter"].includes(normalizedRole)) {
      return res
        .status(400)
        .json({ message: "Role must be applicant or recruiter" });
    }

    // Note: recruiter company fields are now optional to allow quicker onboarding.

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: normalizedRole,
      phoneNumber,
      company:
        normalizedRole === "recruiter"
          ? {
              name: companyName,
              description: companyDescription,
              industry: companyIndustry,
              techStack: companyTechStack,
              teamMembers,
            }
          : undefined,
      location: {
        city,
        state,
        country,
      },
      primaryJobRole,
      totalExperience,
      highestEducation,
      currentStatus,
      primarySkills,
      preferredJobRoles,
      preferredLocations,
      employmentType,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        location: user.location,
        primaryJobRole: user.primaryJobRole,
        totalExperience: user.totalExperience,
        highestEducation: user.highestEducation,
        currentStatus: user.currentStatus,
        primarySkills: user.primarySkills,
        preferredJobRoles: user.preferredJobRoles,
        preferredLocations: user.preferredLocations,
        employmentType: user.employmentType,
        role: user.role,
        company: user.company,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = (email || "").toLowerCase();

    // Check for user email
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      location: user.location,
      primaryJobRole: user.primaryJobRole,
      totalExperience: user.totalExperience,
      highestEducation: user.highestEducation,
      currentStatus: user.currentStatus,
      primarySkills: user.primarySkills,
      preferredJobRoles: user.preferredJobRoles,
      preferredLocations: user.preferredLocations,
      employmentType: user.employmentType,
      resume: user.resume,
      role: user.role,
      company: user.company,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload resume
// @route   POST /api/auth/upload-resume
// @access  Private
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old resume if exists
    if (user.resume) {
      const oldPath = path.join(__dirname, "..", user.resume);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Save new resume path
    user.resume = `uploads/${req.file.filename}`;
    await user.save();

    res.json({
      message: "Resume uploaded successfully",
      resume: user.resume,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
