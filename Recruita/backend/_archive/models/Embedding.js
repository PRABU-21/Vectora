import mongoose from "mongoose";

const embeddingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalFile: {
    type: String,
    required: true
  },
  field: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number], // Array of numbers for the embedding vector
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for better query performance
embeddingSchema.index({ userId: 1 });
embeddingSchema.index({ userId: 1, field: 1 });
embeddingSchema.index({ createdAt: 1 });

const Embedding = mongoose.model('Embedding', embeddingSchema);

export default Embedding;