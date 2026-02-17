import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    // Scoring details
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    breakdown: {
      experience: { type: Number, default: 0 },
      skills: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      semantic: { type: Number, default: 0 },
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    skillMatch: {
      type: Number,
      default: 0,
    },
    experienceScore: {
      type: Number,
      default: 0,
    },
    projectScore: {
      type: Number,
      default: 0,
    },
    similarity: {
      type: Number,
      default: 0,
    },
    // Application status
    status: {
      type: String,
      enum: ["pending", "selected", "rejected"],
      default: "pending",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
// Index for efficient querying
applicationSchema.index({ job: 1, score: -1 });
applicationSchema.index({ candidate: 1, appliedAt: -1 });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
