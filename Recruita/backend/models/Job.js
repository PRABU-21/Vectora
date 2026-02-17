import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      default: "Remote",
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    minExperience: {
      type: Number,
      default: 0,
    },
    durationMonths: {
      type: Number,
      default: 2,
      min: 1,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "closed", "filled"],
      default: "open",
    },
    embedding: {
      type: [Number],
      required: true,
    },
    // Facet embeddings for semantic sub-scores
    skillsEmbedding: {
      type: [Number],
      default: [],
    },
    experienceEmbedding: {
      type: [Number],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding active jobs
jobSchema.index({ status: 1, deadline: 1 });
jobSchema.index({ recruiter: 1, createdAt: -1 });

// Auto-close jobs past deadline
jobSchema.pre("save", function (next) {
  if (this.status === "open" && this.deadline < new Date()) {
    this.status = "closed";
  }
  next();
});

const Job = mongoose.model("Job", jobSchema);

export default Job;
