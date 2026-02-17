import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    yearsExperience: { type: Number, default: 0 },
    education: { type: String, trim: true },
    resumeText: { type: String, default: "" },
    resumeEmbedding: { type: [Number], default: [] },
    skillsEmbedding: { type: [Number], default: [] },
    projectsEmbedding: { type: [Number], default: [] },
    experienceEmbedding: { type: [Number], default: [] },
    resumeParsed: { type: Boolean, default: false },
    originalFile: { type: String, trim: true },
    yearsExperienceConfidence: { type: Number, default: null },
    yearsExperienceSource: { type: String, trim: true },
  },
  { timestamps: true }
);

candidateSchema.index({ email: 1 });

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
