import { cosineSimilarity } from "./cosineSimilarity.js";

export const WEIGHTS = {
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

export const SCORING_MODE = (process.env.SCORING_MODE || "semantic").toLowerCase();

const semanticClamp = (jobVec, candVec) => {
  if (!Array.isArray(jobVec) || !Array.isArray(candVec) || !jobVec.length || !candVec.length) return 0;
  const dot = cosineSimilarity(jobVec, candVec, true);
  return Math.max(0, Math.min(1, dot));
};

export const normalizeStringList = (list = []) =>
  Array.isArray(list)
    ? list
        .map((v) => (typeof v === "string" ? v.trim().toLowerCase() : ""))
        .filter(Boolean)
    : [];

const tokenize = (text = "") =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

const computeProjectRelevance = (jobDescription = "", resumeText = "") => {
  const jdTokens = new Set(tokenize(jobDescription));
  const resumeTokens = new Set(tokenize(resumeText));
  if (!jdTokens.size || !resumeTokens.size) return 0;
  let overlap = 0;
  jdTokens.forEach((t) => {
    if (resumeTokens.has(t)) overlap += 1;
  });
  return overlap / jdTokens.size;
};

const computeSkillMatch = (requiredSkills, candidateSkills) => {
  if (!requiredSkills.length) return { matchedSkills: [], missingSkills: [], score: 1 };
  const candidateSet = new Set(candidateSkills.map((s) => s.toLowerCase()));
  const matchedSkills = requiredSkills.filter((s) => candidateSet.has(s));
  const missingSkills = requiredSkills.filter((s) => !candidateSet.has(s));
  return { matchedSkills, missingSkills, score: matchedSkills.length / requiredSkills.length };
};

const computeExperienceScore = (candidateExperience, minExperience = 0) => {
  if (candidateExperience === undefined || candidateExperience === null) return 0.5;
  if (!minExperience || minExperience === 0) return 0.5;
  if (candidateExperience >= minExperience) return 1;
  if (candidateExperience >= minExperience - 1) return 0.7;
  return 0.3;
};

export const scoreCandidateForJob = (candidate, job) => {
  if (SCORING_MODE === "semantic") {
    const semanticOnly = semanticClamp(job?.embedding, candidate?.embedding);
    const semanticSkills = semanticClamp(job?.skillsEmbedding, candidate?.skillsEmbedding);
    const semanticExperience = semanticClamp(job?.experienceEmbedding, candidate?.experienceEmbedding);
    const semanticProjects = semanticClamp(job?.embedding, candidate?.projectsEmbedding);

    return {
      score: Number(semanticOnly.toFixed(4)),
      breakdown: {
        experience: Number(semanticExperience.toFixed(4)),
        skills: Number(semanticSkills.toFixed(4)),
        projects: Number(semanticProjects.toFixed(4)),
        semantic: Number(semanticOnly.toFixed(4)),
      },
      matchedSkills: [],
      missingSkills: [],
      skillMatch: Number(semanticSkills.toFixed(4)),
      experienceScore: Number(semanticExperience.toFixed(4)),
      projectScore: Number(semanticProjects.toFixed(4)),
      similarity: Number(semanticOnly.toFixed(4)),
    };
  }

  const normalizedJobSkills = normalizeStringList(job.skills);
  const candidateSkills = normalizeStringList(candidate.skills);
  const skillMatch = computeSkillMatch(normalizedJobSkills, candidateSkills);
  const expScore = computeExperienceScore(candidate.yearsExperience, job.minExperience);

  let similarity = 0;
  try {
    similarity = cosineSimilarity(job.embedding, candidate.embedding, true);
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

  const score = Number((breakdown.experience + breakdown.skills + breakdown.projects + breakdown.semantic).toFixed(4));

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
};