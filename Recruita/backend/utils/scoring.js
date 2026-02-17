import { cosineSimilarity } from "./cosineSimilarity.js";

// Weighting for the composite score (must sum to 1)
export const WEIGHTS = {
  experience: 0.4,
  skills: 0.2,
  projects: 0.2,
  semantic: 0.2,
};

// Scoring mode:
// - "composite" (default): experience + skills + projects(keyword overlap) + semantic
// - "semantic": semantic similarity only (matches job_recommendation intent)
export const SCORING_MODE = (process.env.SCORING_MODE || "semantic").toLowerCase();

function dotProduct(vectorA, vectorB) {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) return 0;
  if (vectorA.length === 0 || vectorB.length === 0) return 0;
  if (vectorA.length !== vectorB.length) return 0;

  let product = 0;
  for (let i = 0; i < vectorA.length; i++) {
    product += vectorA[i] * vectorB[i];
  }
  return product;
}

// job_recommendation semantic behavior:
// - embeddings are normalized
// - similarity is dot product, clamped to [0..1]
function semanticSimilarityClamp(jobEmbedding, candidateEmbedding) {
  const dot = dotProduct(jobEmbedding, candidateEmbedding);
  return Math.max(0, Math.min(1, dot));
}

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

export function normalizeStringList(list = []) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter(Boolean);
}

export function tokenize(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

export function computeProjectRelevance(jobDescription = "", resumeText = "") {
  const jdTokens = new Set(tokenize(jobDescription));
  const resumeTokens = new Set(tokenize(resumeText));

  if (!jdTokens.size || !resumeTokens.size) return 0;

  let overlap = 0;
  jdTokens.forEach((token) => {
    if (resumeTokens.has(token)) overlap += 1;
  });

  return overlap / jdTokens.size;
}

export function computeSkillMatch(requiredSkills, candidateSkills) {
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

export function computeExperienceScore(candidateExperience, minExperience = 0) {
  if (candidateExperience === undefined || candidateExperience === null) return 0.5;

  if (!minExperience || minExperience === 0) return 0.5;

  if (candidateExperience >= minExperience) return 1;
  if (candidateExperience >= minExperience - 1) return 0.7;
  return 0.3;
}

export function scoreCandidateForJob(candidate, job) {
  // Semantic-only mode (Vectora/job_recommendation style)
  if (SCORING_MODE === "semantic") {
    const similarity = semanticSimilarityClamp(job?.embedding, candidate?.embedding);
    const skillsSimilarity = semanticSimilarityClamp(job?.skillsEmbedding, candidate?.skillsEmbedding);
    const experienceSimilarity = semanticSimilarityClamp(job?.experienceEmbedding, candidate?.experienceEmbedding);
    const projectsSimilarity = semanticSimilarityClamp(job?.embedding, candidate?.projectsEmbedding);

    const semanticOnly = Number(similarity.toFixed(4));
    const semanticSkills = Number(skillsSimilarity.toFixed(4));
    const semanticExperience = Number(experienceSimilarity.toFixed(4));
    const semanticProjects = Number(projectsSimilarity.toFixed(4));
    return {
      // Keep ranking score purely as overall semantic similarity
      score: semanticOnly,
      breakdown: {
        // Semantic sub-scores (0..1) for UI display
        experience: semanticExperience,
        skills: semanticSkills,
        projects: semanticProjects,
        semantic: semanticOnly,
      },
      matchedSkills: [],
      missingSkills: [],
      // Reuse existing field name so UI can show a skills bar
      skillMatch: semanticSkills,
      experienceScore: semanticExperience,
      projectScore: semanticProjects,
      similarity: semanticOnly,
    };
  }

  const normalizedJobSkills = normalizeStringList(job.skills);
  const candidateSkills = normalizeStringList(candidate.skills);
  const skillMatch = computeSkillMatch(normalizedJobSkills, candidateSkills);
  const expScore = computeExperienceScore(candidate.yearsExperience, job.minExperience);

  let similarity = 0;
  try {
    if (
      job.embedding &&
      candidate.embedding &&
      job.embedding.length > 0 &&
      candidate.embedding.length > 0
    ) {
      similarity = cosineSimilarity(job.embedding, candidate.embedding, true);
    }
  } catch {
    similarity = 0;
  }

  const projectScore = computeProjectRelevance(job.description, candidate.resumeText || "");

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

  return {
    score,
    breakdown,
    matchedSkills: skillMatch.matchedSkills,
    missingSkills: skillMatch.missingSkills,
    skillMatch: Number(skillMatch.score.toFixed(4)),
    experienceScore: Number(expScore.toFixed(4)),
    projectScore: Number(projectScore.toFixed(4)),
    similarity: Number(similarity.toFixed(4)),
  };
}
