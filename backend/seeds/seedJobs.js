import mongoose from 'mongoose';
import { pipeline } from '@xenova/transformers';
import Job from '../models/Job.js';
import jobsSeedData from './jobsSeedData.js';

// ----------------- Model Setup -----------------
let embedModel = null;

async function loadEmbedModel() {
  if (!embedModel) {
    console.log('🔄 Loading embedding model...');
    embedModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Embedding model loaded successfully');
  }
  return embedModel;
}

// ----------------- Helper: Flatten content -----------------
function flatten(value) {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v)))
      .join(" ");
  }

  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
}

const seedJobs = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madathon');

    console.log('Connected to MongoDB');

    // Clear existing jobs
    await Job.deleteMany({});
    console.log('Cleared existing jobs');

    // Load the embedding model
    console.log('🔄 Loading embedding model for job descriptions...');
    const model = await loadEmbedModel();
    
    // Process each job to generate embeddings
    console.log('🔄 Generating embeddings for job descriptions...');
    const jobsWithEmbeddings = [];
    
    for (const jobData of jobsSeedData) {
      console.log(`📝 Processing job: ${jobData.jobRoleName} at ${jobData.companyName}`);
      
      // Generate embedding for the job description
      const content = flatten(jobData.description);
      const embeddingResult = await model(content, {
        pooling: 'mean',
        normalize: true,
      });
      const embedding = Array.from(embeddingResult.data);
      
      console.log(`🧮 Embedding vector created with ${embedding.length} dimensions for: ${jobData.jobRoleName}`);
      
      // Create job object with embedding
      const jobWithEmbedding = {
        ...jobData,
        embedding: embedding
      };
      
      jobsWithEmbeddings.push(jobWithEmbedding);
    }

    // Insert seed data with embeddings
    await Job.insertMany(jobsWithEmbeddings);
    console.log(`Inserted ${jobsWithEmbeddings.length} jobs with embeddings`);

    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding jobs:', error);
    process.exit(1);
  }
};

// Run the seeding function
if (process.argv[1] && process.argv[1].includes('seedJobs.js')) {
  seedJobs();
}

export default seedJobs;