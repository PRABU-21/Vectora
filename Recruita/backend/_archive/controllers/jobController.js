import Job from "../models/Job.js";
import Embedding from "../models/Embedding.js";
import AppliedJob from "../models/AppliedJob.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";

// Get all jobs
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find({});

    // Transform the jobs to match frontend expectations
    const transformedJobs = jobs.map((job) => ({
      id: job._id,
      title: job.jobRoleName,
      company: job.companyName,
      description: job.description,
      location: job.location,
      type: job.type,
      experience: job.experience,
      salary: job.salary,
      skills: job.skills,
      explanation:
        job.explanation ||
        "Job description for " + job.jobRoleName + " at " + job.companyName,
      embedding: job.embedding, // Include embedding if needed for similarity matching
    }));

    res.json({
      jobs: transformedJobs,
      count: transformedJobs.length,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Server error while fetching jobs" });
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
        error: "Unauthorized",
        message: "Please log in to get personalized recommendations",
      });
    }

    const userId = req.userId;

    // Parse and validate limit parameter
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    console.log(`🔍 Fetching job recommendations for user: ${userId}`);

    // ----------------- Step 1: Fetch User's Resume Embedding -----------------
    // Get the most recent resume embedding for the user (field='resume' for consistency)
    const resumeEmbedding = await Embedding.findOne({
      userId: userId,
      field: "resume", // Consistent field name (combined resume embedding)
    }).sort({ createdAt: -1 }); // Get the latest embedding

    if (!resumeEmbedding) {
      return res.status(404).json({
        error: "No resume embedding found",
        message: "Please upload your resume first to get job recommendations",
      });
    }

    // Validate resume embedding
    if (!resumeEmbedding.embedding || resumeEmbedding.embedding.length === 0) {
      return res.status(400).json({
        error: "Invalid resume embedding",
        message: "Resume embedding is empty or corrupted",
      });
    }

    console.log(
      `✅ Found resume embedding with ${resumeEmbedding.embedding.length} dimensions`
    );

    // ----------------- Step 2: Fetch All Job Embeddings -----------------
    // Get all jobs that have embeddings
    const jobs = await Job.find({
      embedding: { $exists: true, $ne: null, $not: { $size: 0 } },
    });

    if (jobs.length === 0) {
      return res.status(404).json({
        error: "No jobs with embeddings found",
        message: "No jobs available for matching at this time",
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

        // Calculate cosine similarity (both vectors are already normalized)
        let similarity = cosineSimilarity(resumeVector, job.embedding);

        // Calculate skill match boost
        const resumeContent = resumeEmbedding.content.toLowerCase();
        const jobSkills = job.skills || [];

        // Count exact skill matches
        let exactSkillMatches = 0;
        jobSkills.forEach((skill) => {
          const skillLower = skill.toLowerCase().trim();
          // Check for exact skill match in resume content
          if (resumeContent.includes(skillLower)) {
            exactSkillMatches++;
          }
        });

        // Apply boost for exact skill matches
        if (exactSkillMatches > 0) {
          // Boost factor: add 0.05 per exact skill match, max boost of 0.25
          const skillBoost = Math.min(exactSkillMatches * 0.05, 0.25);
          similarity = Math.min(similarity + skillBoost, 1.0); // Cap at 1.0
        }

        // Only include jobs with meaningful similarity (> 0)
        if (similarity > 0) {
          // Convert to percentage (matches Python reference: score * 100)
          const matchPercentage = Math.round(similarity * 100 * 100) / 100; // e.g., 85.43%

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
            similarityScore: similarity, // Raw score (0-1) for backward compatibility
            matchPercentage: matchPercentage, // Percentage score (0-100) matches Python
            exactSkillMatches: exactSkillMatches, // Number of exact skill matches
          });
        }
      } catch (error) {
        console.error(`Error processing job ${job._id}:`, error.message);
        skippedCount++;
        continue;
      }
    }

    if (skippedCount > 0) {
      console.log(
        `⚠️ Skipped ${skippedCount} jobs due to errors or invalid embeddings`
      );
    }

    // ----------------- Step 4: Sort and Limit Results -----------------
    // Sort by similarity score in descending order
    recommendations.sort((a, b) => b.similarityScore - a.similarityScore);

    // Limit to top N recommendations
    const topRecommendations = recommendations.slice(0, limit);

    console.log(`✅ Returning ${topRecommendations.length} recommendations`);

    // ----------------- Step 5: Return Response -----------------
    // Return recommendations with all fields needed for frontend while maintaining the skill boost
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
        algorithm: "cosine_similarity",
        scoringMethod: "normalized_embeddings_with_skill_boost",
        matchScoreRange: "0-100%",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Error generating job recommendations:", error);
    res.status(500).json({
      error: "Server error while generating recommendations",
      message: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * Apply to a Job
 *
 * This endpoint handles job applications by:
 * 1. Validating the request body
 * 2. Checking for duplicate applications
 * 3. Creating a new AppliedJob record
 * 4. Returning the updated applied jobs list
 *
 * @route POST /api/jobs/apply
 * @access Protected (requires authentication)
 */
export const applyToJob = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Please log in to apply for jobs",
      });
    }

    const userId = req.userId;
    const { jobId, company, jobRole, match_percentage } = req.body;

    // Validate required fields
    if (!jobId || !company || !jobRole || match_percentage === undefined) {
      return res.status(400).json({
        error: "Invalid request",
        message: "jobId, company, jobRole, and match_percentage are required",
      });
    }

    console.log(`📝 User ${userId} applying to job ${jobId}`);

    // Check if already applied
    const existingApplication = await AppliedJob.findOne({ userId, jobId });

    if (existingApplication) {
      return res.status(409).json({
        error: "Already applied",
        message: "You have already applied to this job",
      });
    }

    // Create new application
    const appliedJob = new AppliedJob({
      userId,
      jobId,
      company,
      jobRole,
      match_percentage,
      status: "Applied",
    });

    await appliedJob.save();

    console.log(`✅ Successfully applied to job ${jobId}`);

    // Return all applied jobs for this user
    const appliedJobs = await AppliedJob.find({ userId })
      .sort({ appliedAt: -1 })
      .lean();

    // Transform for frontend
    const transformedAppliedJobs = appliedJobs.map((job) => ({
      jobId: job.jobId,
      company: job.company,
      jobRole: job.jobRole,
      match_percentage: job.match_percentage,
      status: job.status,
      appliedAt: job.appliedAt,
    }));

    res.status(201).json({
      success: true,
      message: "Successfully applied to job",
      appliedJobs: transformedAppliedJobs,
    });
  } catch (error) {
    console.error("Error applying to job:", error);

    // Handle duplicate key error (just in case)
    if (error.code === 11000) {
      return res.status(409).json({
        error: "Already applied",
        message: "You have already applied to this job",
      });
    }

    res.status(500).json({
      error: "Server error while applying to job",
      message: error.message,
    });
  }
};

/**
 * Get Applied Jobs for the User
 *
 * This endpoint retrieves all jobs the user has applied to.
 *
 * @route GET /api/jobs/applied
 * @access Protected (requires authentication)
 */
export const getAppliedJobs = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Please log in to view applied jobs",
      });
    }

    const userId = req.userId;

    console.log(`📋 Fetching applied jobs for user: ${userId}`);

    // Get all applied jobs for this user
    const appliedJobs = await AppliedJob.find({ userId })
      .sort({ appliedAt: -1 })
      .lean();

    // Transform for frontend
    const transformedAppliedJobs = appliedJobs.map((job) => ({
      jobId: job.jobId,
      company: job.company,
      jobRole: job.jobRole,
      match_percentage: job.match_percentage,
      status: job.status,
      appliedAt: job.appliedAt,
    }));

    res.json({
      success: true,
      appliedJobs: transformedAppliedJobs,
      count: transformedAppliedJobs.length,
    });
  } catch (error) {
    console.error("Error fetching applied jobs:", error);

    res.status(500).json({
      error: "Server error while fetching applied jobs",
      message: error.message,
    });
  }
};
