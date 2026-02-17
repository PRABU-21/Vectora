import { pipeline } from "@xenova/transformers";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Candidate from "../models/Candidate.js";
import { normalizeStringList, scoreCandidateForJob } from "../utils/scoring.js";
import { extractResumeText, extractSection } from "../utils/resumeText.js";

// Cache the embedding model
let embeddingModel = null;

async function loadEmbeddingModel() {
  if (!embeddingModel) {
    embeddingModel = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
  return embeddingModel;
}

async function embedOptional(model, text) {
  const src = String(text || "").trim();
  if (!src) return [];
  const result = await model(src, { pooling: "mean", normalize: true });
  return Array.from(result.data);
}

async function ensureJobFacetEmbeddings(jobDoc) {
  const needsSkills = !Array.isArray(jobDoc.skillsEmbedding) || jobDoc.skillsEmbedding.length === 0;
  const needsExp = !Array.isArray(jobDoc.experienceEmbedding) || jobDoc.experienceEmbedding.length === 0;
  if (!needsSkills && !needsExp) return jobDoc;

  const model = await loadEmbeddingModel();
  const normalizedSkills = normalizeStringList(jobDoc.skills || []);
  const skillsText = normalizedSkills.length ? normalizedSkills.join(" ") : "";
  const experienceText = `${parseInt(jobDoc.minExperience) || 0} years experience required`;

  const [skillsEmbedding, experienceEmbedding] = await Promise.all([
    needsSkills ? embedOptional(model, skillsText) : Promise.resolve(jobDoc.skillsEmbedding || []),
    needsExp ? embedOptional(model, experienceText) : Promise.resolve(jobDoc.experienceEmbedding || []),
  ]);

  await Job.updateOne(
    { _id: jobDoc._id },
    {
      $set: {
        skillsEmbedding: skillsEmbedding,
        experienceEmbedding: experienceEmbedding,
      },
    }
  );

  return {
    ...jobDoc.toObject?.() || jobDoc,
    skillsEmbedding,
    experienceEmbedding,
  };
}

async function ensureCandidateFacetEmbeddings(candidateObj) {
  const needsSkills = !Array.isArray(candidateObj.skillsEmbedding) || candidateObj.skillsEmbedding.length === 0;
  const needsProjects = !Array.isArray(candidateObj.projectsEmbedding) || candidateObj.projectsEmbedding.length === 0;
  const needsExp = !Array.isArray(candidateObj.experienceEmbedding) || candidateObj.experienceEmbedding.length === 0;
  if (!needsSkills && !needsProjects && !needsExp) return candidateObj;

  const model = await loadEmbeddingModel();

  const skillsText = Array.isArray(candidateObj.skills) && candidateObj.skills.length
    ? candidateObj.skills.join(" ")
    : "";
  const projectsText = extractSection(candidateObj.resumeText || "", ["projects"]);
  const experienceText = `${parseInt(candidateObj.yearsExperience) || 0} years experience`;

  const [skillsEmbedding, projectsEmbedding, experienceEmbedding] = await Promise.all([
    needsSkills ? embedOptional(model, skillsText) : Promise.resolve(candidateObj.skillsEmbedding || []),
    needsProjects ? embedOptional(model, projectsText) : Promise.resolve(candidateObj.projectsEmbedding || []),
    needsExp ? embedOptional(model, experienceText) : Promise.resolve(candidateObj.experienceEmbedding || []),
  ]);

  await Candidate.updateOne(
    { _id: candidateObj._id },
    {
      $set: {
        skillsEmbedding,
        projectsEmbedding,
        experienceEmbedding,
      },
    }
  );

  return {
    ...candidateObj,
    skillsEmbedding,
    projectsEmbedding,
    experienceEmbedding,
  };
}



// Create a new job posting
export const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      description,
      skills = [],
      requiredSkills = [],
      minExperience = 0,
      durationMonths = 2,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // Generate embedding for job description
    const model = await loadEmbeddingModel();
    const embeddingResult = await model(description, {
      pooling: "mean",
      normalize: true,
    });
    const embedding = Array.from(embeddingResult.data);

    const normalizedSkills = normalizeStringList(
      Array.isArray(skills) && skills.length ? skills : requiredSkills
    );
    const skillsText = normalizedSkills.length ? normalizedSkills.join(" ") : "";
    const experienceText = `${parseInt(minExperience) || 0} years experience required`;

    const [skillsEmbeddingResult, experienceEmbeddingResult] = await Promise.all([
      skillsText
        ? model(skillsText, { pooling: "mean", normalize: true })
        : Promise.resolve(null),
      model(experienceText, { pooling: "mean", normalize: true }),
    ]);

    const skillsEmbedding = skillsEmbeddingResult ? Array.from(skillsEmbeddingResult.data) : [];
    const experienceEmbedding = experienceEmbeddingResult ? Array.from(experienceEmbeddingResult.data) : [];

    // Calculate deadline
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + parseInt(durationMonths));

    const job = await Job.create({
      recruiter: req.user._id,
      title,
      company: company || req.user.company,
      location: location || "Remote",
      description,
      skills: normalizedSkills,
      minExperience: parseInt(minExperience) || 0,
      durationMonths: parseInt(durationMonths),
      deadline,
      embedding,
      skillsEmbedding,
      experienceEmbedding,
    });

    return res.status(201).json({
      success: true,
      message: "Job posted successfully",
      job: {
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        deadline: job.deadline,
        status: job.status,
      },
    });
  } catch (error) {
    console.error("createJob error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create job",
    });
  }
};

// Get all jobs for a recruiter
export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Get application counts for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const totalApplications = await Application.countDocuments({ job: job._id });
        const pendingCount = await Application.countDocuments({
          job: job._id,
          status: "pending",
        });
        const selectedCount = await Application.countDocuments({
          job: job._id,
          status: "selected",
        });

        return {
          ...job,
          totalApplications,
          pendingCount,
          selectedCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      jobs: jobsWithCounts,
    });
  } catch (error) {
    console.error("getMyJobs error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch jobs",
    });
  }
};

// Get applicants for a specific job (sorted by score)
export const getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify job belongs to recruiter
    const job = await Job.findOne({ _id: jobId, recruiter: req.user._id });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Ensure job facet embeddings exist (older jobs may not have them)
    const scoringJob = await ensureJobFacetEmbeddings(job);

    // Get all applications and compute score live (keeps rankings correct after scoring changes)
    const applications = await Application.find({ job: jobId })
      .populate(
        "candidate",
        "name email skills yearsExperience originalFile resumeText embedding skillsEmbedding projectsEmbedding experienceEmbedding"
      )
      .lean();

    const ensuredCandidates = new Map();

    const results = applications
      .map((app) => {
        const candidate = app.candidate;
        const candidateId = candidate?._id ? String(candidate._id) : null;

        // Backfill candidate facet embeddings if missing (prevents 0% semantic sub-scores)
        const ensurePromise = candidateId && !ensuredCandidates.has(candidateId)
          ? ensureCandidateFacetEmbeddings(candidate).then((c) => {
              ensuredCandidates.set(candidateId, c);
              return c;
            })
          : Promise.resolve(candidateId ? ensuredCandidates.get(candidateId) : candidate);

        return { app, candidate, candidateId, ensurePromise };
      });

    const hydrated = await Promise.all(
      results.map(async ({ app, candidate, candidateId, ensurePromise }) => {
        const ensured = candidate ? await ensurePromise : null;
        const scored = ensured ? scoreCandidateForJob(ensured, scoringJob) : null;

        return {
          applicationId: app._id,
          candidateId: ensured?._id || candidate?._id,
          candidate: ensured?.name || candidate?.name,
          email: ensured?.email || candidate?.email,
          skills: ensured?.skills || candidate?.skills,
          yearsExperience: ensured?.yearsExperience ?? candidate?.yearsExperience,
          originalFile: ensured?.originalFile || candidate?.originalFile,
          score: scored ? scored.score : app.score,
          breakdown: scored ? scored.breakdown : app.breakdown,
          matchedSkills: scored ? scored.matchedSkills : app.matchedSkills,
          missingSkills: scored ? scored.missingSkills : app.missingSkills,
          skillMatch: scored ? scored.skillMatch : app.skillMatch,
          experienceScore: scored ? scored.experienceScore : app.experienceScore,
          projectScore: scored ? scored.projectScore : app.projectScore,
          similarity: scored ? scored.similarity : app.similarity,
          status: app.status,
          appliedAt: app.appliedAt,
        };
      })
    );

    const sorted = hydrated.sort((a, b) => (b.score || 0) - (a.score || 0));

    return res.status(200).json({
      success: true,
      job: {
        id: job._id,
        title: job.title,
        company: job.company,
        deadline: job.deadline,
        status: job.status,
      },
      totalApplications: results.length,
      results: sorted,
    });
  } catch (error) {
    console.error("getJobApplicants error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch applicants",
    });
  }
};

// Bulk update application status (select top N or reject rest)
export const bulkUpdateApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { topN, action } = req.body; // action: "select" | "reject_rest"

    // Verify job belongs to recruiter
    const job = await Job.findOne({ _id: jobId, recruiter: req.user._id });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (action === "select" && topN) {
      // Get top N applications by score
      const topApplications = await Application.find({ job: jobId })
        .sort({ score: -1 })
        .limit(parseInt(topN))
        .select("_id");

      const topIds = topApplications.map((app) => app._id);

      // Mark top N as selected
      await Application.updateMany(
        { _id: { $in: topIds } },
        { status: "selected" }
      );

      // Mark rest as rejected
      await Application.updateMany(
        { job: jobId, _id: { $nin: topIds } },
        { status: "rejected" }
      );

      return res.status(200).json({
        success: true,
        message: `Top ${topN} candidates selected, rest rejected`,
        selectedCount: topIds.length,
      });
    } else if (action === "reject_rest") {
      // Reject all pending applications
      const result = await Application.updateMany(
        { job: jobId, status: "pending" },
        { status: "rejected" }
      );

      return res.status(200).json({
        success: true,
        message: "All pending applications rejected",
        rejectedCount: result.modifiedCount,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action or missing topN parameter",
      });
    }
  } catch (error) {
    console.error("bulkUpdateApplications error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update applications",
    });
  }
};

// Apply to a job (automatically score the candidate)
export const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { resumeFile } = req; // Multer adds this
    const { name, email } = req.body;

    if (!resumeFile) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required",
      });
    }

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    // Get the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check if job is still open and not past deadline
    if (job.status !== "open" || job.deadline < new Date()) {
      return res.status(400).json({
        success: false,
        message: "This job is no longer accepting applications",
      });
    }

    // Extract resume text (supports txt/pdf/doc/docx)
    let resumeText = "";
    try {
      resumeText = await extractResumeText(resumeFile.path, resumeFile.originalname);
    } catch {
      resumeText = "";
    }

    // Generate embedding for resume
    const model = await loadEmbeddingModel();
    const resumeEmbeddingResult = await model(resumeText, {
      pooling: "mean",
      normalize: true,
    });
    const resumeEmbedding = Array.from(resumeEmbeddingResult.data);

    // Extract basic info (you can enhance this with better parsing)
    const skills = []; // TODO: Extract from resume
    const yearsExperience = 0; // TODO: Extract from resume

    // Create or update candidate
    let candidate = await Candidate.findOne({ email });
    if (!candidate) {
      candidate = await Candidate.create({
        name,
        email,
        skills,
        yearsExperience,
        resumeText,
        embedding: resumeEmbedding,
        originalFile: resumeFile.filename,
      });
    } else {
      // Update candidate with latest resume
      candidate.resumeText = resumeText;
      candidate.embedding = resumeEmbedding;
      candidate.originalFile = resumeFile.filename;
      await candidate.save();
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      candidate: candidate._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this job",
      });
    }

    // Score the candidate against the job (shared algorithm)
    const scored = scoreCandidateForJob(candidate, job);

    // Create application
    const application = await Application.create({
      job: jobId,
      candidate: candidate._id,
      score: scored.score,
      breakdown: scored.breakdown,
      matchedSkills: scored.matchedSkills,
      missingSkills: scored.missingSkills,
      skillMatch: scored.skillMatch,
      experienceScore: scored.experienceScore,
      projectScore: scored.projectScore,
      similarity: scored.similarity,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      applicationId: application._id,
      score: scored.score,
    });
  } catch (error) {
    console.error("applyToJob error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit application",
    });
  }
};

// Get public job details (for applicants)
export const getPublicJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOne({ _id: jobId, status: "open" })
      .select("-embedding")
      .populate("recruiter", "name company")
      .lean();

    if (!job || job.deadline < new Date()) {
      return res.status(404).json({
        success: false,
        message: "Job not found or no longer accepting applications",
      });
    }

    return res.status(200).json({
      success: true,
      job: {
        id: job._id,
        title: job.title,
        company: job.company || job.recruiter.company,
        location: job.location,
        description: job.description,
        skills: job.skills,
        experienceRange: job.experienceRange,
        deadline: job.deadline,
      },
    });
  } catch (error) {
    console.error("getPublicJob error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch job",
    });
  }
};

// Close a job manually
export const closeJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findOneAndUpdate(
      { _id: jobId, recruiter: req.user._id },
      { status: "closed" },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job closed successfully",
      job: {
        id: job._id,
        title: job.title,
        status: job.status,
      },
    });
  } catch (error) {
    console.error("closeJob error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to close job",
    });
  }
};

export default {
  createJob,
  getMyJobs,
  getJobApplicants,
  bulkUpdateApplications,
  applyToJob,
  getPublicJob,
  closeJob,
};
