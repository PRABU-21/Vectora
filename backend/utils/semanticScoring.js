import { cosineSimilarity } from "./cosineSimilarity.js";

export function semanticScore(jobEmbedding = [], candidateEmbedding = []) {
  if (!jobEmbedding?.length || !candidateEmbedding?.length) return 0;
  const score = cosineSimilarity(jobEmbedding, candidateEmbedding);
  // Clamp to [0,1]
  return Math.max(0, Math.min(1, score));
}

export function buildBreakdownSemantic(score) {
  // For semantic-only mode we mirror the same score across facets
  return {
    experience: score,
    skills: score,
    projects: score,
    semantic: score,
  };
}
