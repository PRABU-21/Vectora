import jwt from "jsonwebtoken";
import Recruiter from "../models/Recruiter.js";
import Candidate from "../models/Candidate.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try to find user as recruiter first, then as candidate
      let user = await Recruiter.findById(decoded.id).select("-password");
      if (!user) {
        user = await Candidate.findById(decoded.id).select("-password");
      }

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Optional auth: attaches req.userId if a valid bearer token is present, but does not block when missing/invalid
export const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
    } catch (error) {
      // ignore invalid tokens for optional auth
    }
  }

  next();
};
