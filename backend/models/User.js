import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 6,
    select: false,
  },
  phoneNumber: {
    type: String,
    required: [true, "Please provide a phone number"],
    trim: true,
  },
  location: {
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  primaryJobRole: {
    type: String,
    trim: true,
  },
  totalExperience: {
    type: Number,
  },
  highestEducation: {
    type: String,
    enum: ["Diploma", "UG", "PG", "PhD", ""],
    default: "",
  },
  currentStatus: {
    type: String,
    enum: ["Student", "Working Professional", "Job Seeker", ""],
    default: "",
  },
  primarySkills: [
    {
      skill: { type: String },
      level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced", ""],
        default: "",
      },
    },
  ],
  preferredJobRoles: [
    {
      type: String,
    },
  ],
  preferredLocations: [
    {
      type: String,
    },
  ],
  employmentType: {
    type: String,
    enum: ["Full-time", "Internship", "Remote", "Hybrid", ""],
    default: "",
  },
  resume: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
