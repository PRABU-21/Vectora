import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  freelancerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expectedCost: {
    type: Number,
    required: true
  },
  expectedDelivery: {
    type: Number, // in days
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Submitted', 'Viewed', 'Shortlisted', 'Accepted', 'Rejected', 'In Progress', 'Needs Updates', 'Submitted Work', 'Completed'],
    default: 'Submitted'
  },
  deliveryUrl: {
    type: String,
    default: ''
  },
  deliveryNote: {
    type: String,
    default: ''
  },
  deliverySubmittedAt: {
    type: Date
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Proposal', proposalSchema);