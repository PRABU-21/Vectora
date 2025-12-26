/**
 * Cosine Similarity Utility
 * 
 * This module provides functions to calculate cosine similarity between vector embeddings.
 * Cosine similarity measures the cosine of the angle between two vectors,
 * returning a value between -1 (opposite) and 1 (identical).
 * 
 * For normalized vectors, cosine similarity is simply the dot product.
 */

/**
 * Calculate the dot product of two vectors
 * @param {number[]} vectorA - First vector
 * @param {number[]} vectorB - Second vector
 * @returns {number} Dot product value
 */
function dotProduct(vectorA, vectorB) {
  if (!vectorA || !vectorB || vectorA.length !== vectorB.length) {
    throw new Error('Vectors must be non-null and of equal length');
  }
  
  let product = 0;
  for (let i = 0; i < vectorA.length; i++) {
    product += vectorA[i] * vectorB[i];
  }
  return product;
}

/**
 * Calculate the magnitude (Euclidean norm) of a vector
 * @param {number[]} vector - Input vector
 * @returns {number} Magnitude of the vector
 */
function magnitude(vector) {
  if (!vector || vector.length === 0) {
    throw new Error('Vector must be non-null and non-empty');
  }
  
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    sum += vector[i] * vector[i];
  }
  return Math.sqrt(sum);
}

/**
 * Normalize a vector to unit length
 * @param {number[]} vector - Input vector
 * @returns {number[]} Normalized vector
 */
export function normalizeVector(vector) {
  if (!vector || vector.length === 0) {
    throw new Error('Vector must be non-null and non-empty');
  }
  
  const mag = magnitude(vector);
  
  // Handle zero vector edge case
  if (mag === 0) {
    console.warn('Warning: Attempting to normalize a zero vector');
    return vector.map(() => 0);
  }
  
  return vector.map(val => val / mag);
}

/**
 * Calculate cosine similarity between two vectors
 * 
 * Formula: cosine_similarity = (A · B) / (||A|| * ||B||)
 * Where:
 * - A · B is the dot product
 * - ||A|| and ||B|| are the magnitudes
 * 
 * @param {number[]} vectorA - First embedding vector
 * @param {number[]} vectorB - Second embedding vector
 * @param {boolean} normalize - Whether to normalize vectors before calculation (default: false)
 * @returns {number} Similarity score between 0 and 1 (after clamping)
 */
export function cosineSimilarity(vectorA, vectorB, normalize = false) {
  // Input validation
  if (!vectorA || !vectorB) {
    throw new Error('Both vectors must be provided');
  }
  
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
    throw new Error('Vectors must be arrays');
  }
  
  if (vectorA.length === 0 || vectorB.length === 0) {
    throw new Error('Vectors cannot be empty');
  }
  
  if (vectorA.length !== vectorB.length) {
    throw new Error(`Vector dimension mismatch: ${vectorA.length} vs ${vectorB.length}`);
  }
  
  // Optionally normalize vectors
  let vecA = vectorA;
  let vecB = vectorB;
  
  if (normalize) {
    vecA = normalizeVector(vectorA);
    vecB = normalizeVector(vectorB);
  }
  
  // Calculate dot product
  const dotProd = dotProduct(vecA, vecB);
  
  // Calculate magnitudes
  const magA = magnitude(vecA);
  const magB = magnitude(vecB);
  
  // Handle edge case where either vector has zero magnitude
  if (magA === 0 || magB === 0) {
    console.warn('Warning: One or both vectors have zero magnitude');
    return 0;
  }
  
  // Calculate cosine similarity
  const similarity = dotProd / (magA * magB);
  
  // Clamp the result to [0, 1] range
  // (theoretical range is [-1, 1], but for embeddings it's typically [0, 1])
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Calculate cosine similarities between one vector and multiple vectors
 * This is optimized for comparing a single resume against multiple jobs
 * 
 * @param {number[]} referenceVector - The reference vector (e.g., resume embedding)
 * @param {number[][]} targetVectors - Array of target vectors (e.g., job embeddings)
 * @param {boolean} normalize - Whether to normalize vectors (default: false)
 * @returns {number[]} Array of similarity scores
 */
export function cosineSimilarityBatch(referenceVector, targetVectors, normalize = false) {
  if (!referenceVector || !targetVectors) {
    throw new Error('Reference vector and target vectors must be provided');
  }
  
  if (!Array.isArray(targetVectors)) {
    throw new Error('Target vectors must be an array');
  }
  
  return targetVectors.map(targetVector => {
    try {
      return cosineSimilarity(referenceVector, targetVector, normalize);
    } catch (error) {
      console.error('Error calculating similarity:', error.message);
      return 0; // Return 0 similarity for failed comparisons
    }
  });
}

/**
 * Sort items by similarity scores in descending order
 * @param {Array} items - Array of items with similarity scores
 * @param {string} scoreField - Field name containing the similarity score (default: 'similarityScore')
 * @returns {Array} Sorted array
 */
export function sortBySimilarity(items, scoreField = 'similarityScore') {
  return items.sort((a, b) => b[scoreField] - a[scoreField]);
}

export default {
  cosineSimilarity,
  cosineSimilarityBatch,
  normalizeVector,
  sortBySimilarity
};
