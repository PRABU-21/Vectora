import mongoose from "mongoose";

const recruiterJobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    location: { type: String, default: "Remote", trim: true },
    description: { type: String, required: true },
    skills: { type: [String], default: [] },
    minExperience: { type: Number, default: 0 },
    durationMonths: { type: Number, default: 2, min: 1 },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ["open", "closed", "filled"], default: "open" },
    embedding: { type: [Number], required: true },
    skillsEmbedding: { type: [Number], default: [] },
    experienceEmbedding: { type: [Number], default: [] },
  },
  { timestamps: true }
);

recruiterJobSchema.index({ status: 1, deadline: 1 });
recruiterJobSchema.index({ recruiter: 1, createdAt: -1 });

recruiterJobSchema.pre("save", function (next) {
  if (this.status === "open" && this.deadline < new Date()) {
    this.status = "closed";
  }
  next();
});

const RecruiterJob = mongoose.model("RecruiterJob", recruiterJobSchema);

export default RecruiterJob;