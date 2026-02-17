import jwt from "jsonwebtoken";
import Candidate from "../models/Candidate.js";
import { pipeline } from "@xenova/transformers";
import fs from "fs";
import path from "path";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import { scoreCandidateForJob } from "../utils/scoring.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractResumeText, flattenResumeProfile, extractSection } from "../utils/resumeText.js";
import { extractYearsExperienceDetailed } from "../utils/experience.js";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

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

let geminiModel = null;

function getGeminiModel() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (geminiModel) return geminiModel;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
  return geminiModel;
}

function extractFirstJsonObject(str) {
  if (!str) return null;
  const match = str.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function parseResumeWithGemini(resumeText) {
  const model = getGeminiModel();
  if (!model) return null;

  const prompt = `You are a resume parsing engine.

Return ONLY valid JSON.
No markdown.
No explanation.

Schema:
{
  "skills": [],
  "yearsExperience": 0,
  "education": ""
}

Rules:
- All keys must exist
- yearsExperience must be a number (0 if unknown)
- skills must be an array of strings
- education can be a short string summary (empty if unknown)

Resume:
"""
${String(resumeText || "").slice(0, 12000)}
"""`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result?.response?.text?.() || "";
    return extractFirstJsonObject(text);
  } catch {
    return null;
  }
}

// POST /api/candidates/signup
export const signup = async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body || {};

    const normalizedEmail = (email || "").toLowerCase();
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Name, email, and password are required" 
      });
    }

    const exists = await Candidate.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ 
        success: false,
        message: "Candidate already exists" 
      });
    }

    const candidate = await Candidate.create({
      name,
      email: normalizedEmail,
      password,
      phone: phone || "",
      location: location || "",
    });

    return res.status(201).json({
      success: true,
      candidate: {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        resumeParsed: candidate.resumeParsed,
      },
      token: generateToken(candidate._id),
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message || "Failed to sign up" 
    });
  }
};

// POST /api/candidates/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalizedEmail = (email || "").toLowerCase();

    const candidate = await Candidate.findOne({ email: normalizedEmail }).select("+password");
    if (!candidate) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    const ok = await candidate.comparePassword(password || "");
    if (!ok) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    return res.json({
      success: true,
      candidate: {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        skills: candidate.skills,
        yearsExperience: candidate.yearsExperience,
        education: candidate.education,
        resumeParsed: candidate.resumeParsed,
      },
      token: generateToken(candidate._id),
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message || "Failed to login" 
    });
  }
};

// GET /api/candidates/profile
export const getProfile = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.user._id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found"
      });
    }

    return res.json({
      success: true,
      candidate: {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        skills: candidate.skills,
        yearsExperience: candidate.yearsExperience,
        education: candidate.education,
        resumeParsed: candidate.resumeParsed,
        resumeText: candidate.resumeText,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch profile"
    });
  }
};

// POST /api/candidates/parse-resume
export const parseResume = async (req, res) => {
  try {
    if (!req.resumeFile) {
      return res.status(400).json({
        success: false,
        message: "Resume file is required"
      });
    }

    const filePath = req.resumeFile.path;
    const resumeText = await extractResumeText(filePath, req.resumeFile.originalname);

    // Generate embedding
    const model = await loadEmbeddingModel();
    const embeddingResult = await model(resumeText, {
      pooling: "mean",
      normalize: true,
    });
    const embedding = Array.from(embeddingResult.data);

    // Parse resume (Gemini when available; otherwise regex fallback)
    const parsed = await parseResumeWithGemini(resumeText);
    const skills = Array.isArray(parsed?.skills)
      ? [...new Set(parsed.skills.map((s) => String(s).trim()).filter(Boolean))]
      : extractSkills(resumeText);
    const exp = extractYearsExperienceDetailed(
      resumeText,
      Number.isFinite(parsed?.yearsExperience) ? Number(parsed.yearsExperience) : undefined
    );
    const yearsExperience = exp.years;
    const education = typeof parsed?.education === "string" && parsed.education.trim()
      ? parsed.education.trim().slice(0, 200)
      : extractEducation(resumeText);

    const skillsText = Array.isArray(skills) && skills.length ? skills.join(" ") : "";
    const projectsText = extractSection(resumeText, ["projects"]);
    const experienceText = `${yearsExperience || 0} years experience`;

    const [skillsEmbeddingResult, projectsEmbeddingResult, experienceEmbeddingResult] = await Promise.all([
      skillsText
        ? model(skillsText, { pooling: "mean", normalize: true })
        : Promise.resolve(null),
      projectsText
        ? model(projectsText, { pooling: "mean", normalize: true })
        : Promise.resolve(null),
      model(experienceText, { pooling: "mean", normalize: true }),
    ]);

    const skillsEmbedding = skillsEmbeddingResult ? Array.from(skillsEmbeddingResult.data) : [];
    const projectsEmbedding = projectsEmbeddingResult ? Array.from(projectsEmbeddingResult.data) : [];
    const experienceEmbedding = experienceEmbeddingResult ? Array.from(experienceEmbeddingResult.data) : [];

    // Update candidate
    const candidate = await Candidate.findByIdAndUpdate(
      req.user._id,
      {
        resumeText,
        embedding,
        skillsEmbedding,
        projectsEmbedding,
        experienceEmbedding,
        skills,
        yearsExperience,
        yearsExperienceConfidence: exp.confidence,
        yearsExperienceSource: exp.method,
        education,
        resumeParsed: true,
        originalFile: req.resumeFile.filename,
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Resume parsed successfully",
      candidate: {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        skills: candidate.skills,
        yearsExperience: candidate.yearsExperience,
        education: candidate.education,
        resumeParsed: candidate.resumeParsed,
      },
    });
  } catch (error) {
    console.error("parseResume error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to parse resume"
    });
  }
};

// POST /api/candidates/parse-resume-json
// Accepts either { resumeText: string } OR { profile: object }
export const parseResumeJson = async (req, res) => {
  try {
    const { resumeText: resumeTextRaw, profile } = req.body || {};

    const resumeText =
      typeof resumeTextRaw === "string" && resumeTextRaw.trim()
        ? resumeTextRaw.trim()
        : flattenResumeProfile(profile);

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: "Provide resumeText or profile",
      });
    }

    const model = await loadEmbeddingModel();
    const embeddingResult = await model(resumeText, {
      pooling: "mean",
      normalize: true,
    });
    const embedding = Array.from(embeddingResult.data);

    const parsed = await parseResumeWithGemini(resumeText);
    const skills = Array.isArray(profile?.skills)
      ? [...new Set(profile.skills.map((s) => String(s).trim()).filter(Boolean))]
      : Array.isArray(parsed?.skills)
        ? [...new Set(parsed.skills.map((s) => String(s).trim()).filter(Boolean))]
        : extractSkills(resumeText);

    const exp = extractYearsExperienceDetailed(
      resumeText,
      Number.isFinite(profile?.yearsExperience)
        ? Number(profile.yearsExperience)
        : Number.isFinite(parsed?.yearsExperience)
          ? Number(parsed.yearsExperience)
          : undefined
    );
    const yearsExperience = exp.years;

    const education = typeof profile?.education === "string" && profile.education.trim()
      ? profile.education.trim().slice(0, 200)
      : typeof parsed?.education === "string" && parsed.education.trim()
        ? parsed.education.trim().slice(0, 200)
        : extractEducation(resumeText);

    const skillsText = Array.isArray(skills) && skills.length ? skills.join(" ") : "";
    const projectsText = extractSection(resumeText, ["projects"]);
    const experienceText = `${yearsExperience || 0} years experience`;

    const [skillsEmbeddingResult, projectsEmbeddingResult, experienceEmbeddingResult] = await Promise.all([
      skillsText
        ? model(skillsText, { pooling: "mean", normalize: true })
        : Promise.resolve(null),
      projectsText
        ? model(projectsText, { pooling: "mean", normalize: true })
        : Promise.resolve(null),
      model(experienceText, { pooling: "mean", normalize: true }),
    ]);

    const skillsEmbedding = skillsEmbeddingResult ? Array.from(skillsEmbeddingResult.data) : [];
    const projectsEmbedding = projectsEmbeddingResult ? Array.from(projectsEmbeddingResult.data) : [];
    const experienceEmbedding = experienceEmbeddingResult ? Array.from(experienceEmbeddingResult.data) : [];

    const candidate = await Candidate.findByIdAndUpdate(
      req.user._id,
      {
        resumeText,
        embedding,
        skillsEmbedding,
        projectsEmbedding,
        experienceEmbedding,
        skills,
        yearsExperience,
        yearsExperienceConfidence: exp.confidence,
        yearsExperienceSource: exp.method,
        education,
        resumeParsed: true,
        originalFile: "json",
      },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Resume JSON parsed successfully",
      candidate: {
        _id: candidate._id,
        name: candidate.name,
        email: candidate.email,
        skills: candidate.skills,
        yearsExperience: candidate.yearsExperience,
        education: candidate.education,
        resumeParsed: candidate.resumeParsed,
      },
    });
  } catch (error) {
    console.error("parseResumeJson error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to parse resume JSON",
    });
  }
};

// GET /api/candidates/jobs
export const getAllJobs = async (req, res) => {
  try {
    const candidateDoc = await Candidate.findById(req.user._id);
    const candidate = candidateDoc?.toObject ? candidateDoc.toObject() : candidateDoc;

    const jobs = await Job.find({ status: "open", deadline: { $gte: new Date() } })
      .populate("recruiter", "name company email")
      .sort({ createdAt: -1 })
      .lean();

    const canScore = Boolean(
      candidate?.resumeParsed &&
        Array.isArray(candidate?.embedding) &&
        candidate.embedding.length > 0
    );

    // Lazily compute facet embeddings so UI can show semantic sub-scores
    let model = null;
    if (canScore && candidateDoc) {
      const needsCandidateFacets =
        !Array.isArray(candidate.skillsEmbedding) ||
        candidate.skillsEmbedding.length === 0 ||
        !Array.isArray(candidate.experienceEmbedding) ||
        candidate.experienceEmbedding.length === 0 ||
        !Array.isArray(candidate.projectsEmbedding) ||
        candidate.projectsEmbedding.length === 0;

      if (needsCandidateFacets) {
        model = await loadEmbeddingModel();

        const skillsText = Array.isArray(candidate.skills) && candidate.skills.length ? candidate.skills.join(" ") : "";
        const projectsText = extractSection(candidate.resumeText || "", ["projects"]);
        const experienceText = `${candidate.yearsExperience || 0} years experience`;

        const [skillsRes, projectsRes, expRes] = await Promise.all([
          skillsText ? model(skillsText, { pooling: "mean", normalize: true }) : Promise.resolve(null),
          projectsText ? model(projectsText, { pooling: "mean", normalize: true }) : Promise.resolve(null),
          model(experienceText, { pooling: "mean", normalize: true }),
        ]);

        candidateDoc.skillsEmbedding = skillsRes ? Array.from(skillsRes.data) : candidateDoc.skillsEmbedding || [];
        candidateDoc.projectsEmbedding = projectsRes ? Array.from(projectsRes.data) : candidateDoc.projectsEmbedding || [];
        candidateDoc.experienceEmbedding = expRes ? Array.from(expRes.data) : candidateDoc.experienceEmbedding || [];
        await candidateDoc.save();

        candidate.skillsEmbedding = candidateDoc.skillsEmbedding;
        candidate.projectsEmbedding = candidateDoc.projectsEmbedding;
        candidate.experienceEmbedding = candidateDoc.experienceEmbedding;
      }
    }

    const jobsWithMatch = canScore
      ? await (async () => {
          // Lazily compute facet embeddings for jobs (skills/experience)
          const anyJobNeedsFacets = jobs.some(
            (j) =>
              !Array.isArray(j.skillsEmbedding) ||
              j.skillsEmbedding.length === 0 ||
              !Array.isArray(j.experienceEmbedding) ||
              j.experienceEmbedding.length === 0
          );

          if (anyJobNeedsFacets) {
            model = model || (await loadEmbeddingModel());
            await Promise.all(
              jobs.map(async (j) => {
                const needs =
                  !Array.isArray(j.skillsEmbedding) ||
                  j.skillsEmbedding.length === 0 ||
                  !Array.isArray(j.experienceEmbedding) ||
                  j.experienceEmbedding.length === 0;
                if (!needs) return;

                const jobDoc = await Job.findById(j._id);
                if (!jobDoc) return;

                const skillsText = Array.isArray(jobDoc.skills) && jobDoc.skills.length ? jobDoc.skills.join(" ") : "";
                const experienceText = `${jobDoc.minExperience || 0} years experience required`;

                const [skillsRes, expRes] = await Promise.all([
                  skillsText ? model(skillsText, { pooling: "mean", normalize: true }) : Promise.resolve(null),
                  model(experienceText, { pooling: "mean", normalize: true }),
                ]);

                jobDoc.skillsEmbedding = skillsRes ? Array.from(skillsRes.data) : jobDoc.skillsEmbedding || [];
                jobDoc.experienceEmbedding = expRes ? Array.from(expRes.data) : jobDoc.experienceEmbedding || [];
                await jobDoc.save();

                // update lean object in-place for scoring
                j.skillsEmbedding = jobDoc.skillsEmbedding;
                j.experienceEmbedding = jobDoc.experienceEmbedding;
              })
            );
          }

          return jobs
            .map((job) => {
              const match = scoreCandidateForJob(candidate, job);
              return { job, match };
            })
            .sort((a, b) => b.match.score - a.match.score);
        })()
      : jobs.map((job) => ({ job, match: null }));

    return res.json({
      success: true,
      jobs: jobsWithMatch.map(({ job, match }) => ({
        _id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        skills: job.skills,
        minExperience: job.minExperience,
        deadline: job.deadline,
        recruiter: job.recruiter,
        createdAt: job.createdAt,
        match: match
          ? {
              score: match.score,
              breakdown: match.breakdown,
              matchedSkills: match.matchedSkills,
              missingSkills: match.missingSkills,
            }
          : null,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch jobs"
    });
  }
};

// POST /api/candidates/apply/:jobId
export const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const candidateId = req.user._id;

    // Check if candidate has parsed resume
    const candidate = await Candidate.findById(candidateId);
    if (!candidate.resumeParsed || !candidate.embedding.length) {
      return res.status(400).json({
        success: false,
        message: "Please parse your resume before applying to jobs"
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    if (job.status !== "open") {
      return res.status(400).json({
        success: false,
        message: "This job is no longer accepting applications"
      });
    }

    // Deadline check (consistent with public apply flow)
    if (job.deadline && job.deadline < new Date()) {
      return res.status(400).json({
        success: false,
        message: "This job is no longer accepting applications",
      });
    }

    // Experience threshold gate (safe): only reject when we are confident candidate is below requirement.
    const minExp = Number(job.minExperience) || 0;
    const candidateExp = Number(candidate.yearsExperience) || 0;
    const expConfidence = Number(candidate.yearsExperienceConfidence) || 0;
    const CONFIDENT_THRESHOLD = 0.8;

    if (minExp > 0 && expConfidence >= CONFIDENT_THRESHOLD && candidateExp < minExp) {
      return res.status(400).json({
        success: false,
        message: `Minimum experience required is ${minExp} years. Your resume indicates ${candidateExp} years.`,
        details: {
          minExperience: minExp,
          candidateYearsExperience: candidateExp,
          confidence: expConfidence,
          source: candidate.yearsExperienceSource || "",
        },
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      candidate: candidateId,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this job"
      });
    }

    // Calculate score (shared algorithm, 0..1)
    const score = scoreCandidateForJob(candidate, job);

    // Create application
    const application = await Application.create({
      job: jobId,
      candidate: candidateId,
      score: score.score,
      breakdown: score.breakdown,
      matchedSkills: score.matchedSkills,
      missingSkills: score.missingSkills,
      skillMatch: score.skillMatch,
      experienceScore: score.experienceScore,
      projectScore: score.projectScore,
      similarity: score.similarity,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      application: {
        _id: application._id,
        job: application.job,
        status: application.status,
        score: application.score,
        appliedAt: application.appliedAt,
      },
    });
  } catch (error) {
    console.error("applyToJob error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to apply to job"
    });
  }
};

// GET /api/candidates/applications
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate({
        path: "job",
        populate: {
          path: "recruiter",
          select: "name company email"
        }
      })
      .sort({ appliedAt: -1 })
      .lean();

    return res.json({
      success: true,
      applications: applications.map(app => ({
        _id: app._id,
        job: app.job,
        status: app.status,
        score: app.score,
        matchedSkills: app.matchedSkills,
        missingSkills: app.missingSkills,
        appliedAt: app.appliedAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch applications"
    });
  }
};

// Helper functions
function extractSkills(resumeText) {
  const commonSkills = [
    "javascript", "python", "java", "react", "node", "nodejs", "express",
    "mongodb", "sql", "html", "css", "typescript", "angular", "vue",
    "django", "flask", "spring", "springboot", "docker", "kubernetes",
    "aws", "azure", "gcp", "git", "rest", "api", "graphql", "redis",
    "postgresql", "mysql", "agile", "scrum", "ci/cd", "jenkins",
    "terraform", "ansible", "linux", "microservices", "machine learning",
    "deep learning", "nlp", "data science", "pandas", "numpy", "tensorflow",
    "pytorch", "scikit-learn", "c++", "c#", "go", "rust", "kotlin", "swift"
  ];

  const text = resumeText.toLowerCase();
  const skills = commonSkills.filter(skill => {
    const regex = new RegExp(`\\b${skill.replace('+', '\\+')}\\b`, 'i');
    return regex.test(text);
  });

  return [...new Set(skills)];
}

function extractExperience(resumeText) {
  // Look for patterns like "X years of experience" or "X+ years"
  const patterns = [
    /(\d+)\+?\s*years?\s*(of)?\s*experience/i,
    /experience[:\s]*(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*yrs/i,
  ];

  for (const pattern of patterns) {
    const match = resumeText.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }

  // Fallback: count job experiences (very basic)
  const jobCount = (resumeText.match(/\d{4}\s*-\s*(present|\d{4})/gi) || []).length;
  return jobCount > 0 ? jobCount * 2 : 0; // Rough estimate
}

function extractEducation(resumeText) {
  const educationKeywords = [
    "bachelor", "master", "phd", "b.tech", "m.tech", "bsc", "msc",
    "b.e", "m.e", "mba", "degree", "diploma", "university", "college"
  ];

  const lines = resumeText.toLowerCase().split('\n');
  for (const line of lines) {
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      return line.trim().substring(0, 200); // Return first matching education line
    }
  }

  return "";
}

