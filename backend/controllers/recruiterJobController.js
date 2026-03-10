import { pipeline } from "@xenova/transformers";
import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import RecruiterJob from "../models/RecruiterJob.js";
import Application from "../models/Application.js";
import User from "../models/User.js";
import { scoreCandidateForJob, normalizeStringList } from "../utils/recruiterScoring.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";

// Cache embedding model locally
let embedModel = null;
async function loadEmbedModel() {
  if (!embedModel) {
    embedModel = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedModel;
}

const embedText = async (text) => {
  const model = await loadEmbedModel();
  const result = await model(text, { pooling: "mean", normalize: true });
  return Array.from(result.data);
};

const safeExtractText = async (filePath, originalName) => {
  const ext = (originalName || "").toLowerCase();
  if (ext.endsWith(".pdf")) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
  }
  // Default: treat as utf-8 text
  return fs.readFileSync(filePath, "utf8");
};

export const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      description,
      skills = [],
      minExperience = 0,
      durationMonths = 2,
    } = req.body || {};

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    const model = await loadEmbedModel();
    const embeddingResult = await model(description, { pooling: "mean", normalize: true });
    const embedding = Array.from(embeddingResult.data);

    const normalizedSkills = normalizeStringList(skills);
    const skillsText = normalizedSkills.length ? normalizedSkills.join(" ") : "";
    const experienceText = `${parseInt(minExperience, 10) || 0} years experience required`;

    const [skillsEmbeddingResult, experienceEmbeddingResult] = await Promise.all([
      skillsText ? model(skillsText, { pooling: "mean", normalize: true }) : Promise.resolve(null),
      model(experienceText, { pooling: "mean", normalize: true }),
    ]);

    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + parseInt(durationMonths, 10));

    const job = await RecruiterJob.create({
      recruiter: req.user._id,
      title,
      company: company || req.user.company?.name || "",
      location: location || "Remote",
      description,
      skills: normalizedSkills,
      minExperience: parseInt(minExperience, 10) || 0,
      durationMonths: parseInt(durationMonths, 10) || 2,
      deadline,
      embedding,
      skillsEmbedding: skillsEmbeddingResult ? Array.from(skillsEmbeddingResult.data) : [],
      experienceEmbedding: experienceEmbeddingResult ? Array.from(experienceEmbeddingResult.data) : [],
    });

    return res.status(201).json({
      success: true,
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
    console.error("createJob error", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to create job" });
  }
};

export const getMyJobs = async (req, res) => {
  try {
    const jobs = await RecruiterJob.find({ recruiter: req.user._id }).sort({ createdAt: -1 }).lean();

    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const totalApplications = await Application.countDocuments({ job: job._id });
        const pendingCount = await Application.countDocuments({ job: job._id, status: "pending" });
        const selectedCount = await Application.countDocuments({ job: job._id, status: "selected" });
        return { ...job, totalApplications, pendingCount, selectedCount };
      })
    );

    return res.status(200).json({ success: true, jobs: jobsWithCounts });
  } catch (error) {
    console.error("getMyJobs error", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch jobs" });
  }
};

export const getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await RecruiterJob.findOne({ _id: jobId, recruiter: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    const applications = await Application.find({ job: jobId })
      .populate("candidate", "name email skills yearsExperience resumeText embedding skillsEmbedding projectsEmbedding experienceEmbedding")
      .lean();

    const scored = applications.map((app) => {
      const candidate = app.candidate || {};
      const scoredResult = scoreCandidateForJob(candidate, job);
      return {
        applicationId: app._id,
        candidateId: candidate._id,
        candidate: candidate.name,
        email: candidate.email,
        skills: candidate.skills,
        yearsExperience: candidate.yearsExperience,
        score: scoredResult.score,
        breakdown: scoredResult.breakdown,
        matchedSkills: scoredResult.matchedSkills,
        missingSkills: scoredResult.missingSkills,
        skillMatch: scoredResult.skillMatch,
        experienceScore: scoredResult.experienceScore,
        projectScore: scoredResult.projectScore,
        similarity: scoredResult.similarity,
        status: app.status,
        appliedAt: app.appliedAt,
      };
    });

    scored.sort((a, b) => (b.score || 0) - (a.score || 0));

    return res.status(200).json({
      success: true,
      job: { id: job._id, title: job.title, company: job.company, deadline: job.deadline, status: job.status },
      totalApplications: scored.length,
      results: scored,
    });
  } catch (error) {
    console.error("getJobApplicants error", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch applicants" });
  }
};

export const bulkUpdateApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { topN, action } = req.body || {};

    const job = await RecruiterJob.findOne({ _id: jobId, recruiter: req.user._id });
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });

    if (action === "select" && topN) {
      const topApplications = await Application.find({ job: jobId }).sort({ score: -1 }).limit(parseInt(topN, 10)).select("_id");
      const topIds = topApplications.map((app) => app._id);
      await Application.updateMany({ _id: { $in: topIds } }, { status: "selected" });
      await Application.updateMany({ job: jobId, _id: { $nin: topIds } }, { status: "rejected" });
      return res.status(200).json({ success: true, message: `Top ${topN} candidates selected, rest rejected`, selectedCount: topIds.length });
    }

    if (action === "reject_rest") {
      const result = await Application.updateMany({ job: jobId, status: "pending" }, { status: "rejected" });
      return res.status(200).json({ success: true, message: "All pending applications rejected", rejectedCount: result.modifiedCount });
    }

    return res.status(400).json({ success: false, message: "Invalid action or missing topN" });
  } catch (error) {
    console.error("bulkUpdateApplications error", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update applications" });
  }
};

export const closeJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await RecruiterJob.findOneAndUpdate({ _id: jobId, recruiter: req.user._id }, { status: "closed" }, { new: true });
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    return res.status(200).json({ success: true, message: "Job closed", job: { id: job._id, title: job.title, status: job.status } });
  } catch (error) {
    console.error("closeJob error", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to close job" });
  }
};

export const getPublicJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await RecruiterJob.findOne({ _id: jobId, status: "open" })
      .select("-embedding")
      .populate("recruiter", "name company.name")
      .lean();

    if (!job || job.deadline < new Date()) {
      return res.status(404).json({ success: false, message: "Job not found or closed" });
    }

    return res.status(200).json({
      success: true,
      job: {
        id: job._id,
        title: job.title,
        company: job.company || job.recruiter?.company?.name,
        location: job.location,
        description: job.description,
        skills: job.skills,
        experienceRange: job.minExperience,
        deadline: job.deadline,
      },
    });
  } catch (error) {
    console.error("getPublicJob error", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch job" });
  }
};

export const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await RecruiterJob.findById(jobId);
    if (!job) return res.status(404).json({ success: false, message: "Job not found" });
    if (job.status !== "open" || job.deadline < new Date()) {
      return res.status(400).json({ success: false, message: "Job is closed" });
    }

    const resumeFile = req.file;
    if (!resumeFile) return res.status(400).json({ success: false, message: "Resume file is required" });

    const resumeText = await safeExtractText(resumeFile.path, resumeFile.originalname);
    const embedding = await embedText(resumeText || "");
    const experienceEmbedding = await embedText(`${req.user.totalExperience || 0} years experience`);
    const skillsEmbedding = Array.isArray(req.user.primarySkills)
      ? await embedText(req.user.primarySkills.map((s) => s.skill).filter(Boolean).join(" "))
      : [];

    // Update user with latest resume facets
    await User.updateOne(
      { _id: req.user._id },
      {
        resume: resumeFile.filename,
        resumeText,
        embedding,
        experienceEmbedding,
        skillsEmbedding,
      }
    );

    const existing = await Application.findOne({ job: jobId, candidate: req.user._id });
    if (existing) return res.status(400).json({ success: false, message: "Already applied" });

    const scored = scoreCandidateForJob({
      ...req.user.toObject(),
      resumeText,
      embedding,
      experienceEmbedding,
      skillsEmbedding,
      projectsEmbedding: req.user.projectsEmbedding || [],
    }, job.toObject());

    const application = await Application.create({
      job: jobId,
      candidate: req.user._id,
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

    return res.status(201).json({ success: true, message: "Application submitted", applicationId: application._id, score: scored.score });
  } catch (error) {
    console.error("applyToJob error", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to apply" });
  }
};

export const shortlistResumes = async (req, res) => {
  try {
    const { jobDescription, skills = [], topN = 5, experienceRange = {} } = req.body || {};
    if (!jobDescription || typeof jobDescription !== "string") {
      return res.status(400).json({ success: false, message: "jobDescription is required" });
    }

    const model = await loadEmbedModel();
    const jdEmbeddingResult = await model(jobDescription, { pooling: "mean", normalize: true });
    const jdVector = Array.from(jdEmbeddingResult.data);

    const candidates = await User.find({ role: "applicant", embedding: { $exists: true, $ne: [] } }).lean();
    if (!candidates.length) {
      return res.status(404).json({ success: false, message: "No candidate embeddings found" });
    }

    const normalizedSkills = normalizeStringList(skills);
    const shortlistCount = Math.max(1, Math.min(50, Math.round(topN)));

    const scored = candidates.map((candidate) => {
      let similarity = 0;
      try {
        similarity = cosineSimilarity(jdVector, candidate.embedding, true);
      } catch {
        similarity = 0;
      }

      const candidateSkills = normalizeStringList(candidate.skills || []);
      const matchedSkills = normalizedSkills.filter((s) => candidateSkills.includes(s));
      const missingSkills = normalizedSkills.filter((s) => !candidateSkills.includes(s));
      const skillScore = normalizedSkills.length ? matchedSkills.length / normalizedSkills.length : 1;

      const experienceScore = (() => {
        const min = experienceRange.minYears ?? experienceRange.min ?? null;
        const max = experienceRange.maxYears ?? experienceRange.max ?? null;
        const years = candidate.totalExperience ?? candidate.yearsExperience ?? 0;
        if (min === null && max === null) return 0.5;
        if (min !== null && years >= min && (max === null || years <= max)) return 1;
        return 0.3;
      })();

      const projectScore = 0; // simple shortlist baseline
      const breakdown = {
        experience: Number((experienceScore * 0.4).toFixed(4)),
        skills: Number((skillScore * 0.2).toFixed(4)),
        projects: Number((projectScore * 0.2).toFixed(4)),
        semantic: Number((similarity * 0.2).toFixed(4)),
      };
      const score = Number((breakdown.experience + breakdown.skills + breakdown.projects + breakdown.semantic).toFixed(4));

      return {
        candidateId: candidate._id,
        candidate: candidate.name,
        email: candidate.email,
        score,
        similarity,
        matchedSkills,
        missingSkills,
        breakdown,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return res.status(200).json({ success: true, requestedTopN: shortlistCount, totalEvaluated: scored.length, results: scored.slice(0, shortlistCount) });
  } catch (error) {
    console.error("shortlistResumes error", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to shortlist" });
  }
};

export default {
  createJob,
  getMyJobs,
  getJobApplicants,
  bulkUpdateApplications,
  closeJob,
  getPublicJob,
  applyToJob,
  shortlistResumes,
};