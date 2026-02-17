import { pipeline } from "@xenova/transformers";
import Candidate from "../models/Candidate.js";
import { cosineSimilarity } from "../utils/cosineSimilarity.js";

// Weighting for the composite score (must sum to 1)
const WEIGHTS = {
  experience: 0.4,
  skills: 0.2,
  projects: 0.2,
  semantic: 0.2,
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "have",
  "has",
  "had",
  "you",
  "your",
  "are",
  "our",
  "their",
  "his",
  "her",
  "was",
  "were",
  "will",
  "can",
  "could",
  "should",
  "would",
  "may",
  "might",
  "of",
  "in",
  "on",
  "at",
  "to",
  "as",
  "by",
  "an",
  "a",
  "be",
]);

// Cache the embedding model so we only load it once
let jdEmbeddingModel = null;

async function loadEmbeddingModel() {
  if (!jdEmbeddingModel) {
    jdEmbeddingModel = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
  return jdEmbeddingModel;
}

function clampTopN(value) {
  const n = Number.isFinite(Number(value)) ? Number(value) : 5;
  return Math.min(Math.max(Math.round(n), 1), 50);
}

function normalizeStringList(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter(Boolean);
}

function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function computeProjectRelevance(jobDescription = "", resumeText = "") {
  const jdTokens = new Set(tokenize(jobDescription));
  const resumeTokens = new Set(tokenize(resumeText));

  if (!jdTokens.size || !resumeTokens.size) return 0;

  let overlap = 0;
  jdTokens.forEach((token) => {
    if (resumeTokens.has(token)) overlap += 1;
  });

  // Jaccard-like overlap normalized by JD token count so weight favors JD coverage
  return overlap / jdTokens.size;
}

function computeSkillMatch(requiredSkills, candidateSkills) {
  if (!requiredSkills.length) {
    return {
      matchedSkills: [],
      missingSkills: [],
      score: 1,
    };
  }

  const candidateSet = new Set(candidateSkills.map((s) => s.toLowerCase()));
  const matchedSkills = requiredSkills.filter((s) => candidateSet.has(s));
  const missingSkills = requiredSkills.filter((s) => !candidateSet.has(s));
  const score = matchedSkills.length / requiredSkills.length;

  return { matchedSkills, missingSkills, score };
}

function computeExperienceScore(candidateExperience, experienceRange = {}) {
  if (candidateExperience === undefined || candidateExperience === null) return 0.5;

  const min = experienceRange.minYears ?? experienceRange.min ?? null;
  const max = experienceRange.maxYears ?? experienceRange.max ?? null;

  if (min === null && max === null) return 0.5;

  if (min !== null && max !== null) {
    if (candidateExperience >= min && candidateExperience <= max) return 1;
    if (candidateExperience >= min - 1 && candidateExperience <= max + 1) return 0.7;
    return 0.3;
  }

  if (min !== null) {
    if (candidateExperience >= min) return 1;
    if (candidateExperience >= min - 1) return 0.7;
    return 0.3;
  }

  if (max !== null) {
    if (candidateExperience <= max) return 1;
    if (candidateExperience <= max + 1) return 0.7;
    return 0.3;
  }

  return 0.5;
}

function experienceLabel(score) {
  if (score >= 0.95) return "Aligned";
  if (score >= 0.65) return "Close";
  return "Partial";
}

export const shortlistResumes = async (req, res) => {
  try {
    const {
      jobDescription,
      skills = [],
      topN = 5,
      experienceRange = {},
    } = req.body || {};

    if (!jobDescription || typeof jobDescription !== "string") {
      return res.status(400).json({
        success: false,
        message: "jobDescription is required",
      });
    }

    const normalizedSkills = normalizeStringList(skills);
    const shortlistCount = clampTopN(topN);

    // 1) Embed the job description
    const model = await loadEmbeddingModel();
    const jdEmbeddingResult = await model(jobDescription, {
      pooling: "mean",
      normalize: true,
    });
    const jdVector = Array.from(jdEmbeddingResult.data);

    // 2) Pull candidate embeddings
    const candidates = await Candidate.find({});
    if (!candidates.length) {
      return res.status(404).json({
        success: false,
        message: "No candidate embeddings found",
      });
    }

    // 3) Score candidates
    const scored = [];

    for (const candidate of candidates) {
      const candidateSkills = normalizeStringList(candidate.skills || []);
      const skillMatch = computeSkillMatch(normalizedSkills, candidateSkills);
      const expScore = computeExperienceScore(candidate.yearsExperience, experienceRange);

      // Semantic similarity (resume vs JD)
      let similarity = 0;
      try {
        similarity = cosineSimilarity(jdVector, candidate.embedding, true);
      } catch (err) {
        similarity = 0;
      }

      const projectScore = computeProjectRelevance(
        jobDescription,
        candidate.resumeText || ""
      );

      const breakdown = {
        experience: Number((expScore * WEIGHTS.experience).toFixed(4)),
        skills: Number((skillMatch.score * WEIGHTS.skills).toFixed(4)),
        projects: Number((projectScore * WEIGHTS.projects).toFixed(4)),
        semantic: Number((similarity * WEIGHTS.semantic).toFixed(4)),
      };

      const score = Number(
        (
          breakdown.experience +
          breakdown.skills +
          breakdown.projects +
          breakdown.semantic
        ).toFixed(4)
      );

      const pctSafeDenom = score > 0 ? score : 1;
      const breakdownPercent = {
        experience: Math.round((breakdown.experience / pctSafeDenom) * 100),
        skills: Math.round((breakdown.skills / pctSafeDenom) * 100),
        projects: Math.round((breakdown.projects / pctSafeDenom) * 100),
        semantic: Math.round((breakdown.semantic / pctSafeDenom) * 100),
      };

      scored.push({
        candidateId: candidate._id,
        candidate: candidate.name,
        email: candidate.email,
        similarity: Number(similarity.toFixed(4)),
        score,
        matchedSkills: skillMatch.matchedSkills,
        missingSkills: skillMatch.missingSkills,
        skillMatch: Number(skillMatch.score.toFixed(4)),
        experienceScore: Number(expScore.toFixed(4)),
        experienceLabel: experienceLabel(expScore),
        projectScore: Number(projectScore.toFixed(4)),
        breakdown,
        breakdownPercent,
        weights: { ...WEIGHTS },
        originalFile: candidate.originalFile,
        yearsExperience: candidate.yearsExperience,
        explanation:
          `Experience ${breakdownPercent.experience}% • Skills ${breakdownPercent.skills}% • Projects ${breakdownPercent.projects}% • Profile fit ${breakdownPercent.semantic}%`,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, shortlistCount);

    return res.status(200).json({
      success: true,
      requestedTopN: shortlistCount,
      totalEvaluated: scored.length,
      results: top,
    });
  } catch (error) {
    console.error("shortlistResumes error", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to shortlist resumes",
    });
  }
};

export default {
  shortlistResumes,
};