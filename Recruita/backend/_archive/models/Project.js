import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  skills: [{
    type: String
  }],
  minBudget: {
    type: Number,
    required: true
  },
  maxBudget: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // in weeks
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Closed', 'Completed'],
    default: 'Open'
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  applicants: {
    type: Number,
    default: 0
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  proposals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal'
  }]
}, {
  timestamps: true
});

export default mongoose.model('Project', projectSchema);