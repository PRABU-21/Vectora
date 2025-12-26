import Job from '../models/Job.js';
import Embedding from '../models/Embedding.js';
import { cosineSimilarity } from '../utils/cosineSimilarity.js';

// Get all jobs
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({});
    
    // Transform the jobs to match frontend expectations
    const transformedJobs = jobs.map(job => ({
      id: job._id,
      title: job.jobRoleName,
      company: job.companyName,
      description: job.description,
      location: job.location,
      type: job.type,
      experience: job.experience,
      salary: job.salary,
      skills: job.skills,
      explanation: job.explanation || "Job description for " + job.jobRoleName + " at " + job.companyName,
      embedding: job.embedding // Include embedding if needed for similarity matching
    }));
    
    res.json({
      jobs: transformedJobs,
      count: transformedJobs.length
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Server error while fetching jobs' });
  }
};

/**
 * Get Job Recommendations Based on Resume Similarity
 * 
 * This endpoint calculates job recommendations by:
 * 1. Fetching the user's resume embedding
 * 2. Fetching all job embeddings from the database
 * 3. Computing cosine similarity between resume and each job
 * 4. Returning top N jobs sorted by similarity score
 * 
 * Query Parameters:
 * - limit: Number of recommendations to return (default: 10, max: 50)
 * 
 * @route GET /api/jobs/recommendations
 * @access Protected (requires authentication)
 */
export const getJobRecommendations = async (req, res) => {
  try {
    // Check if user is authenticated (authMiddleware sets req.userId)
    if (!req.userId) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Please log in to get personalized recommendations'
      });
    }
    
    const userId = req.userId;
    
    // Parse and validate limit parameter
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    
    console.log(`🔍 Fetching job recommendations for user: ${userId}`);
    
    // ----------------- Step 1: Fetch User's Resume Embedding -----------------
    // Get the most recent resume embedding for the user
    const resumeEmbedding = await Embedding.findOne({ 
      userId: userId 
    }).sort({ createdAt: -1 }); // Get the latest embedding
    
    if (!resumeEmbedding) {
      return res.status(404).json({ 
        error: 'No resume embedding found',
        message: 'Please upload your resume first to get job recommendations'
      });
    }
    
    // Validate resume embedding
    if (!resumeEmbedding.embedding || resumeEmbedding.embedding.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid resume embedding',
        message: 'Resume embedding is empty or corrupted'
      });
    }
    
    console.log(`✅ Found resume embedding with ${resumeEmbedding.embedding.length} dimensions`);
    
    // ----------------- Step 2: Fetch All Job Embeddings -----------------
    // Get all jobs that have embeddings
    const jobs = await Job.find({ 
      embedding: { $exists: true, $ne: null, $not: { $size: 0 } }
    });
    
    if (jobs.length === 0) {
      return res.status(404).json({ 
        error: 'No jobs with embeddings found',
        message: 'No jobs available for matching at this time'
      });
    }
    
    console.log(`✅ Found ${jobs.length} jobs with embeddings`);
    
    // ----------------- Step 3: Calculate Cosine Similarity -----------------
    const recommendations = [];
    const resumeVector = resumeEmbedding.embedding;
    let skippedCount = 0;
    
    for (const job of jobs) {
      try {
        // Validate job embedding
        if (!job.embedding || job.embedding.length === 0) {
          skippedCount++;
          continue;
        }
        
        // Check vector dimension match
        if (job.embedding.length !== resumeVector.length) {
          console.warn(
            `⚠️ Dimension mismatch for job ${job._id}: ` +
            `expected ${resumeVector.length}, got ${job.embedding.length}`
          );
          skippedCount++;
          continue;
        }
        
        // Calculate cosine similarity
        const similarity = cosineSimilarity(resumeVector, job.embedding);
        
        // Only include jobs with meaningful similarity (> 0)
        if (similarity > 0) {
          recommendations.push({
            jobId: job._id.toString(),
            jobTitle: job.jobRoleName,
            company: job.companyName,
            location: job.location,
            type: job.type,
            experience: job.experience,
            salary: job.salary,
            skills: job.skills,
            description: job.description,
            explanation: job.explanation,
            similarityScore: Math.round(similarity * 10000) / 10000 // Round to 4 decimal places
          });
        }
      } catch (error) {
        console.error(`Error processing job ${job._id}:`, error.message);
        skippedCount++;
        continue;
      }
    }
    
    if (skippedCount > 0) {
      console.log(`⚠️ Skipped ${skippedCount} jobs due to errors or invalid embeddings`);
    }
    
    // ----------------- Step 4: Sort and Limit Results -----------------
    // Sort by similarity score in descending order
    recommendations.sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Limit to top N recommendations
    const topRecommendations = recommendations.slice(0, limit);
    
    console.log(`✅ Returning ${topRecommendations.length} recommendations`);
    
    // ----------------- Step 5: Return Response -----------------
    res.json({
      success: true,
      count: topRecommendations.length,
      totalJobsAnalyzed: jobs.length,
      recommendations: topRecommendations,
      metadata: {
        userId: userId.toString(),
        resumeEmbeddingId: resumeEmbedding._id.toString(),
        embeddingDimension: resumeVector.length,
        requestedLimit: limit,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating job recommendations:', error);
    res.status(500).json({ 
      error: 'Server error while generating recommendations',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};