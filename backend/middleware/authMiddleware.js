import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Attach req.user and req.userId when a valid Bearer token is provided
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      req.userId = decoded.id;
      req.user = user;
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

// Optional auth: attaches req.user/req.userId if a valid bearer token is present, but does not block when missing/invalid
export const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
      const user = await User.findById(decoded.id).select("-password");
      if (user) req.user = user;
    } catch (error) {
      // ignore invalid tokens for optional auth
    }
  }

  return next();
};

// Require a specific role (e.g., recruiter, applicant)
export const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }
  if (req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden for this role" });
  }
  return next();
};
