import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  jobRoleName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    default: "Remote",
    trim: true
  },
  type: {
    type: String,
    default: "Full-time"
  },
  experience: {
    type: String,
    default: "Not specified"
  },
  salary: {
    type: String,
    default: "Not specified"
  },
  skills: [{
    type: String,
    trim: true
  }],
  explanation: {
    type: String,
    default: ""
  },
  embedding: {
    type: [Number], // Array of numbers for the embedding vector
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Job = mongoose.model('Job', jobSchema);

export default Job;