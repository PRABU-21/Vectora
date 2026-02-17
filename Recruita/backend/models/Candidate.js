import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    yearsExperience: {
      type: Number,
      default: 0,
    },
    yearsExperienceConfidence: {
      type: Number,
      default: 0,
    },
    yearsExperienceSource: {
      type: String,
      default: "",
    },
    education: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    resumeText: {
      type: String,
      default: "",
    },
    embedding: {
      type: [Number],
      default: [],
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
    projectsEmbedding: {
      type: [Number],
      default: [],
    },
    originalFile: {
      type: String,
      default: "",
    },
    resumeParsed: {
      type: Boolean,
      default: false,
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

// Hash password before saving
candidateSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
candidateSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index for skills - email index is already created by unique: true in schema
candidateSchema.index({ skills: 1 });

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;