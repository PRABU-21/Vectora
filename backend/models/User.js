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
  role: {
    type: String,
    enum: ["applicant", "recruiter"],
    default: "applicant",
  },
  company: {
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    industry: { type: String, trim: true },
    techStack: [{ type: String, trim: true }],
    teamMembers: [
      {
        name: { type: String, trim: true },
        role: { type: String, trim: true },
      },
    ],
  },
  phoneNumber: {
    type: String,
    required: false,
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
  // Recruiter/candidate facets for semantic scoring
  resumeText: {
    type: String,
    default: "",
  },
  embedding: {
    type: [Number],
    default: [],
  },
  skillsEmbedding: {
    type: [Number],
    default: [],
  },
  projectsEmbedding: {
    type: [Number],
    default: [],
  },
  experienceEmbedding: {
    type: [Number],
    default: [],
  },
  parsedProfile: {
    type: Object,
    default: {},
  },
  // GitHub OAuth Fields
  githubId: {
    type: String,
    unique: true,
    sparse: true,
  },
  githubUsername: {
    type: String,
    sparse: true,
  },
  githubProfileUrl: {
    type: String,
  },
  githubAccessToken: {
    type: String,
    select: false,
  },
  // GitHub Profile Data
  githubProfile: {
    name: String,
    bio: String,
    avatar_url: String,
    location: String,
    company: String,
    blog: String,
    public_repos: Number,
    followers: Number,
    following: Number,
    created_at: Date,
    updated_at: Date,
  },
  // GitHub Activity Stats
  githubStats: {
    commits: { type: Number, default: 0 },
    prs: { type: Number, default: 0 },
    issues: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
  },
  // GitHub Repository Data
  githubRepositories: {
    totalRepos: { type: Number, default: 0 },
    totalStars: { type: Number, default: 0 },
    totalForks: { type: Number, default: 0 },
    topRepos: [
      {
        name: String,
        url: String,
        stars: Number,
        forks: Number,
        language: String,
        description: String,
      },
    ],
    languages: mongoose.Schema.Types.Mixed,
  },
  // GitHub Contribution Calendar
  contributionCalendar: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // GitHub Commit Contributions by Repository
  commitContributionsByRepository: [
    {
      name: String,
      count: Number,
    },
  ],
  // GitHub Streaks
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  // Last sync timestamp
  lastGithubSync: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash if password is modified and not a GitHub OAuth user
  if (!this.isModified("password") || this.githubId) return next();

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
