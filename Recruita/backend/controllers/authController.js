import jwt from "jsonwebtoken";
import Recruiter from "../models/Recruiter.js";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// POST /api/auth/signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, company } = req.body || {};

    const normalizedEmail = (email || "").toLowerCase();
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "name, email, password required" });
    }

    const exists = await Recruiter.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "Recruiter already exists" });
    }

    const recruiter = await Recruiter.create({
      name,
      email: normalizedEmail,
      password,
      company: company || "",
    });

    return res.status(201).json({
      _id: recruiter._id,
      name: recruiter.name,
      email: recruiter.email,
      company: recruiter.company,
      token: generateToken(recruiter._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to sign up" });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = (email || "").toLowerCase();

    const recruiter = await Recruiter.findOne({ email: normalizedEmail }).select("+password");
    if (!recruiter) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await recruiter.comparePassword(password || "");
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      _id: recruiter._id,
      name: recruiter.name,
      email: recruiter.email,
      company: recruiter.company,
      token: generateToken(recruiter._id),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to login" });
  }
};
