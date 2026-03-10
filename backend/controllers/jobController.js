import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "@xenova/transformers";
import Job from "../models/Job.js";
import Embedding from "../models/Embedding.js";
import AppliedJob from "../models/AppliedJob.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";

const ADZUNA_API_URL = "https://api.adzuna.com/v1/api/jobs";
const JOB_API_URL = "https://www.arbeitnow.com/api/job-board-api";
const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";
const LEETCODE_STATS_URL = "https://leetcode-stats-api.herokuapp.com/";
const LEETCODE_STATS_ALT_URL = "https://alfa-leetcode-api.vercel.app";
const LEETCODE_TOPICS_FALLBACK = "https://alfa-leetcode-api.vercel.app";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "../data");
const jobsJsonPath = path.join(dataDir, "externalJobs.json");

// Embedding model instance (lazy load)
let embedModel = null;

async function loadEmbedModel() {
  if (!embedModel) {
    console.log("🔄 Loading embedding model...");
    embedModel = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("✅ Embedding model loaded successfully");
  }
  return embedModel;
}

const ensureDataDir = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Fetch jobs from Adzuna with automatic embedding generation
export const fetchAndEmbedAdzunaJobs = async (req, res) => {
  try {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      return res.status(500).json({
        success: false,
        message: "Adzuna API credentials not configured",
      });
    }

    console.log("🔍 Fetching jobs from Adzuna API...");

    // Fetch from Adzuna - example: UK jobs for software engineers
    const adzunaUrl = `${ADZUNA_API_URL}/gb/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=30&what=software+engineer`;

    const response = await axios.get(adzunaUrl, {
      headers: { "content-type": "application/json" },
    });

    const adzunaResults = response.data?.results || [];

    if (adzunaResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No jobs found from Adzuna API",
      });
    }

    console.log(`✅ Found ${adzunaResults.length} jobs from Adzuna`);

    // Load embedding model
    const model = await loadEmbedModel();

    // Transform and embed jobs
    console.log("🔄 Generating embeddings for Adzuna jobs...");
    const jobsWithEmbeddings = [];

    for (const job of adzunaResults) {
      try {
        const jobDescription = job.description || "";

        if (jobDescription.trim() === "") {
          console.warn(`⚠️ Skipping job with empty description: ${job.title}`);
          continue;
        }

        // Generate embedding from job description
        const embeddingResult = await model(jobDescription, {
          pooling: "mean",
          normalize: true,
        });
        const embedding = Array.from(embeddingResult.data);

        // Transform Adzuna job format to match our Job model
        const jobWithEmbedding = {
          companyName: job.company?.display_name || "Unknown Company",
          jobRoleName: job.title || "Untitled Position",
          description: jobDescription,
          location: job.location?.display_name || "Remote",
          type: job.contract_type || "Full-time",
          experience: "Not specified",
          salary: job.salary_is_predicted
            ? `~${job.salary_min} - ${job.salary_max}`
            : "Not specified",
          skills: extractSkillsFromDescription(jobDescription),
          explanation: `Job at ${job.company?.display_name || "company"}`,
          embedding: embedding,
        };

        jobsWithEmbeddings.push(jobWithEmbedding);

        console.log(
          `✅ Embedded: ${jobWithEmbedding.jobRoleName} at ${jobWithEmbedding.companyName}`
        );
      } catch (jobErr) {
        console.error(`Error processing job ${job.title}:`, jobErr.message);
        continue;
      }
    }

    if (jobsWithEmbeddings.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to process any jobs from Adzuna",
      });
    }

    // Clear existing jobs and insert new ones
    console.log("💾 Saving jobs to database...");
    await Job.deleteMany({});
    await Job.insertMany(jobsWithEmbeddings);

    console.log(`✅ Successfully stored ${jobsWithEmbeddings.length} jobs with embeddings`);

    res.json({
      success: true,
      message: "Jobs fetched and embedded from Adzuna",
      totalJobs: jobsWithEmbeddings.length,
      source: "adzuna",
    });
  } catch (error) {
    console.error("❌ Adzuna fetch/embed error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching jobs from Adzuna",
      error: error.message,
    });
  }
};

// Helper: Extract skills from job description
function extractSkillsFromDescription(description) {
  const commonSkills = [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C++",
    "C#",
    "React",
    "Vue",
    "Angular",
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "AWS",
    "Azure",
    "GCP",
    "Docker",
    "Kubernetes",
    "Git",
    "REST API",
    "GraphQL",
    "HTML",
    "CSS",
    "SASS",
    "Webpack",
  ];

  const foundSkills = [];
  const lowerDesc = description.toLowerCase();

  for (const skill of commonSkills) {
    if (lowerDesc.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  }

  return foundSkills.length > 0 ? foundSkills : ["General Programming"];
}


// Fetch jobs from Arbeitnow and persist to JSON for downstream recommendations/seeding
export const fetchExternalJobs = async (req, res) => {
  try {
    ensureDataDir();
    const response = await axios.get(JOB_API_URL);
    const jobs = response.data?.data || [];

    fs.writeFileSync(jobsJsonPath, JSON.stringify(jobs, null, 2), "utf-8");

    res.json({
      success: true,
      message: "Jobs fetched and saved successfully",
      totalJobs: jobs.length,
      source: "arbeitnow",
      file: "data/externalJobs.json",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};

// Read jobs from the persisted JSON file
export const getExternalJobs = (req, res) => {
  try {
    if (!fs.existsSync(jobsJsonPath)) {
      return res.status(404).json({
        success: false,
        message: "No jobs found. Fetch first via /api/jobs/fetch-external.",
      });
    }

    const data = fs.readFileSync(jobsJsonPath, "utf-8");
    const jobs = JSON.parse(data);

    res.json({
      success: true,
      totalJobs: jobs.length,
      jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error reading jobs file",
      error: error.message,
    });
  }
};

// Fetch a user's LeetCode profile and problem stats via GraphQL
export const getLeetCodeProfile = async (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.status(400).json({ success: false, message: "Username is required" });
  }

  const normalizeFallbackStats = (payload) => {
    const data = payload?.data ?? payload;

    if (!data) return null;

    const totalSolved =
      data.totalSolved ??
      data.totalSolvedCount ??
      data.total_solved ??
      data.solved ??
      data.solvedCount;

    const totalQuestions =
      data.totalQuestions ??
      data.total_questions ??
      data.totalCount ??
      data.total ??
      data.totalProblem;

    const easySolved = data.easySolved ?? data.easy?.solved ?? data.solvedEasy;
    const mediumSolved =
      data.mediumSolved ?? data.medium?.solved ?? data.solvedMedium;
    const hardSolved = data.hardSolved ?? data.hard?.solved ?? data.solvedHard;

    const hasCounts =
      totalSolved != null ||
      easySolved != null ||
      mediumSolved != null ||
      hardSolved != null;

    const okStatus =
      data.status === "success" ||
      payload?.status === "success" ||
      payload?.success === true ||
      data.success === true;

    if (!okStatus && !hasCounts) return null;

    const fallbackSolvedSum = [easySolved, mediumSolved, hardSolved]
      .filter((v) => typeof v === "number" && !Number.isNaN(v))
      .reduce((sum, v) => sum + v, 0);

    const solvedStats = [
      { difficulty: "Easy", count: easySolved ?? 0 },
      { difficulty: "Medium", count: mediumSolved ?? 0 },
      { difficulty: "Hard", count: hardSolved ?? 0 },
    ];

    return {
      success: true,
      source: payload?.source || payload?.provider || "fallback",
      username,
      ranking: data.ranking ?? data.profile?.ranking ?? null,
      reputation: data.reputation ?? data.profile?.reputation ?? null,
      starRating: data.starRating ?? data.profile?.starRating ?? null,
      solvedStats,
      overall: {
        solvedCount: totalSolved ?? fallbackSolvedSum ?? 0,
        totalCount: totalQuestions ?? 0,
        progress: data.progress || [],
      },
      topics: [],
    };
  };

  const fetchFallbackStats = async () => {
    // Try multiple community mirrors because they differ in paths/fields.
    const uname = encodeURIComponent(username);
    const endpoints = [
      `${LEETCODE_STATS_ALT_URL}/user/${uname}`,
      `${LEETCODE_STATS_ALT_URL}/${uname}`,
      `${LEETCODE_STATS_URL}${uname}`,
    ];

    for (const url of endpoints) {
      try {
        const resp = await axios.get(url, {
          validateStatus: () => true, // some mirrors return 404/500 with useful bodies
        });

        const normalized = normalizeFallbackStats(resp.data);
        if (normalized) {
          normalized.source = normalized.source || new URL(url).hostname;
          return normalized;
        }
      } catch (err) {
      }
    }

    return null;
  };

  const fetchTopicsFallback = async () => {
    try {
      const resp = await axios.get(
        `${LEETCODE_TOPICS_FALLBACK}/${encodeURIComponent(username)}/tags`,
        { validateStatus: (s) => s >= 200 && s < 500 }
      );
      if (resp.status === 200 && resp.data) {
        const topics = resp.data.topTags || resp.data.tags || resp.data.data || resp.data || [];
        if (Array.isArray(topics)) {
          return topics
            .filter((t) => t?.name && (t.count || t.solved))
            .map((t) => ({ name: t.name, solved: t.count || t.solved }));
        }
      }
    } catch (err) {
      // ignore
    }
    return [];
  };

  try {
    const response = await axios.post(
      LEETCODE_GRAPHQL,
      {
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
              profile {
                ranking
                reputation
                starRating
              }
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
              languageProblemCount {
                languageName
                problemsSolved
              }
              tagProblemCounts {
                advanced {
                  tagName
                  problemsSolved
                }
                intermediate {
                  tagName
                  problemsSolved
                }
                fundamental {
                  tagName
                  problemsSolved
                }
              }
            }
          }
        `,
        variables: { username },
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Referer: "https://leetcode.com",
          Origin: "https://leetcode.com",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        withCredentials: false,
        validateStatus: (status) => status >= 200 && status < 500,
      }
    );

    const payload = response?.data;

    if (payload?.data?.matchedUser) {
      // Normal success path even if status is not 200 (LeetCode sometimes returns 4xx with data)
    } else if (payload?.errors?.length) {
      const msg = payload.errors[0]?.message || "LeetCode returned an error";
      const fallback = await fetchFallbackStats();
      if (fallback) {
        fallback.topics = await fetchTopicsFallback();
        return res.json(fallback);
      }
      return res
        .status(200)
        .json({ success: false, message: msg, errors: payload.errors, status: response?.status });
    } else if (!payload || response?.status >= 400) {
      const fallback = await fetchFallbackStats();
      if (fallback) {
        fallback.topics = await fetchTopicsFallback();
        return res.json(fallback);
      }

      return res.status(200).json({
        success: false,
        message: "LeetCode API did not return a valid response",
        status: response?.status,
        body: payload,
      });
    }

    const data = payload?.data;

    if (!data?.matchedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const acSubmissionNum = data.matchedUser?.submitStats?.acSubmissionNum || [];
    const solvedCountFromSubmissions = acSubmissionNum.reduce(
      (sum, s) => sum + (s.count || 0),
      0
    );

    // Build topics list from tagProblemCounts; fallback to API if empty
    const tagCounts = data.matchedUser?.tagProblemCounts || {};
    let topics = [
      ...(tagCounts.fundamental || []),
      ...(tagCounts.intermediate || []),
      ...(tagCounts.advanced || []),
    ]
      .filter((t) => t?.tagName && t?.problemsSolved != null)
      .map((t) => ({ name: t.tagName, solved: t.problemsSolved }));

    if (!topics.length) {
      topics = await fetchTopicsFallback();
    }

    return res.json({
      success: true,
      username: data.matchedUser.username,
      ranking: data.matchedUser.profile?.ranking,
      reputation: data.matchedUser.profile?.reputation,
      starRating: data.matchedUser.profile?.starRating,
      solvedStats: acSubmissionNum,
      overall: {
        solvedCount: solvedCountFromSubmissions,
        totalCount: null,
        progress: [],
      },
      topics,
      languages: data.matchedUser.languageProblemCount || [],
    });
  } catch (error) {
    console.error("LeetCode fetch error:", error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || "Failed to fetch LeetCode data";

    const fallback = await fetchFallbackStats();
    if (fallback) {
      fallback.topics = await fetchTopicsFallback();
      return res.json(fallback);
    }

    return res.status(200).json({
      success: false,
      message,
      error: error.message,
      status,
    });
  }
};

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

    const asGenericRecommendations = async (reason) => {
      const genericJobs = await Job.find({}).limit(limit);
      const recommendations = genericJobs.map((job) => ({
        jobId: job._id.toString(),
        jobTitle: job.jobRoleName,
        company: job.companyName,
        location: job.location,
        type: job.type,
        experience: job.experience,
        salary: job.salary,
        skills: job.skills,
        description: job.description,
        explanation:
          job.explanation ||
          "Job description for " + job.jobRoleName + " at " + job.companyName,
        similarityScore: null,
        matchPercentage: null,
        exactSkillMatches: 0,
      }));

      return res.status(200).json({
        success: true,
        mode: "generic",
        count: recommendations.length,
        recommendations,
        metadata: {
          mode: "generic",
          reason,
          requestedLimit: limit,
          algorithm: "fallback_no_embeddings",
          timestamp: new Date().toISOString(),
        },
      });
    };

    console.log(`🔍 Fetching job recommendations for user: ${userId}`);

    // ----------------- Step 1: Fetch User's Resume Embedding -----------------
    // Get the most recent resume embedding for the user (field='resume' for consistency)
    const resumeEmbedding = await Embedding.findOne({
      userId: userId,
      field: "resume", // Consistent field name (combined resume embedding)
    }).sort({ createdAt: -1 }); // Get the latest embedding

    if (!resumeEmbedding) {
      return asGenericRecommendations("no_resume_embedding");
    }

    // Validate resume embedding
    if (!resumeEmbedding.embedding || resumeEmbedding.embedding.length === 0) {
      return asGenericRecommendations("invalid_resume_embedding");
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
      return asGenericRecommendations("no_job_embeddings");
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

    // If no recommendations were produced, fall back to a generic list
    if (recommendations.length === 0) {
      return asGenericRecommendations("no_similarity_hits");
    }

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
