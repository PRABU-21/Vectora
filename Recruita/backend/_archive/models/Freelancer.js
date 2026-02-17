import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ["beginner", "intermediate", "expert", ""],
    default: "",
  },
  years: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const locationSchema = new mongoose.Schema({
  country: { type: String, default: "" },
  city: { type: String, default: "" },
}, { _id: false });

const freelancerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  title: {
    type: String,
    default: "",
    trim: true,
  },
  bio: {
    type: String,
    default: "",
  },
  skills: {
    type: [String],
    default: [],
  },
  hourlyRate: {
    type: Number,
    default: 0,
  },
  portfolio: {
    type: [String],
    default: [],
  },
  experience: {
    type: experienceSchema,
    default: () => ({}),
  },
  languages: {
    type: [String],
    default: [],
  },
  location: {
    type: locationSchema,
    default: () => ({}),
  },
  availability: {
    type: String,
    default: "available",
  },
  profileImage: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.model("Freelancer", freelancerSchema);
