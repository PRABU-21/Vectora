import mongoose from "mongoose";

const appliedJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  jobRole: {
    type: String,
    required: true,
  },
  match_percentage: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "Applied",
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index to prevent duplicate applications
appliedJobSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export default mongoose.model("AppliedJob", appliedJobSchema);
