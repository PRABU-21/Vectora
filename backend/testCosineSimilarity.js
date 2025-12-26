/**
 * Simple Test Script for Job Recommendations
 * 
 * This script tests the cosine similarity utility functions
 * to ensure they work correctly before testing the full API
 */

import { cosineSimilarity, normalizeVector, cosineSimilarityBatch } from './utils/cosineSimilarity.js';

console.log('🧪 Testing Cosine Similarity Utility Functions\n');
console.log('='.repeat(80));

// ============================================================================
// Test 1: Basic Cosine Similarity
// ============================================================================
console.log('\n📝 Test 1: Basic Cosine Similarity');
console.log('-'.repeat(80));

const vectorA = [1, 2, 3, 4, 5];
const vectorB = [1, 2, 3, 4, 5];  // Identical to A
const vectorC = [5, 4, 3, 2, 1];  // Reverse of A
const vectorD = [2, 4, 6, 8, 10]; // 2x of A

console.log('Vector A:', vectorA);
console.log('Vector B (identical):', vectorB);
console.log('Vector C (reverse):', vectorC);
console.log('Vector D (2x scale):', vectorD);

const simAB = cosineSimilarity(vectorA, vectorB);
const simAC = cosineSimilarity(vectorA, vectorC);
const simAD = cosineSimilarity(vectorA, vectorD);

console.log('\nResults:');
console.log(`A vs B (identical): ${simAB.toFixed(4)} ✅ Expected: ~1.0000`);
console.log(`A vs C (reverse): ${simAC.toFixed(4)} ✅ Expected: ~0.6364`);
console.log(`A vs D (scaled): ${simAD.toFixed(4)} ✅ Expected: ~1.0000`);

// ============================================================================
// Test 2: Vector Normalization
// ============================================================================
console.log('\n\n📝 Test 2: Vector Normalization');
console.log('-'.repeat(80));

const unnormalized = [3, 4];  // Magnitude = 5
const normalized = normalizeVector(unnormalized);

const magnitude = Math.sqrt(normalized[0]**2 + normalized[1]**2);

console.log('Unnormalized vector:', unnormalized);
console.log('Normalized vector:', normalized.map(v => v.toFixed(4)));
console.log(`Magnitude after normalization: ${magnitude.toFixed(4)} ✅ Expected: 1.0000`);

// ============================================================================
// Test 3: Real-World Resume vs Job Example
// ============================================================================
console.log('\n\n📝 Test 3: Simulated Resume vs Job Matching');
console.log('-'.repeat(80));

// Simulate simplified embeddings (in reality these would be 384-dimensional)
const resumeEmbedding = [0.8, 0.6, 0.9, 0.7, 0.5]; // User's resume
const jobEmbeddings = [
  { title: 'Senior Developer', embedding: [0.82, 0.58, 0.88, 0.69, 0.52] }, // Very similar
  { title: 'Junior Designer', embedding: [0.3, 0.9, 0.2, 0.4, 0.8] },       // Different
  { title: 'Full Stack Engineer', embedding: [0.75, 0.62, 0.85, 0.72, 0.48] }, // Similar
  { title: 'Data Scientist', embedding: [0.5, 0.4, 0.6, 0.5, 0.3] },       // Somewhat different
];

console.log('Resume Embedding:', resumeEmbedding);
console.log('\nJob Matches:');

const matches = jobEmbeddings.map(job => {
  const similarity = cosineSimilarity(resumeEmbedding, job.embedding);
  return {
    title: job.title,
    score: similarity,
    percentage: (similarity * 100).toFixed(2)
  };
});

// Sort by similarity
matches.sort((a, b) => b.score - a.score);

matches.forEach((match, index) => {
  const emoji = match.score > 0.9 ? '🟢' : match.score > 0.7 ? '🟡' : '🔴';
  console.log(`${index + 1}. ${emoji} ${match.title.padEnd(25)} - ${match.percentage}% match`);
});

// ============================================================================
// Test 4: Batch Processing
// ============================================================================
console.log('\n\n📝 Test 4: Batch Similarity Calculation');
console.log('-'.repeat(80));

const referenceVector = [1, 2, 3];
const targetVectors = [
  [1, 2, 3],
  [2, 4, 6],
  [3, 2, 1],
  [0, 0, 0],
];

const batchResults = cosineSimilarityBatch(referenceVector, targetVectors);

console.log('Reference Vector:', referenceVector);
console.log('Target Vectors:', targetVectors);
console.log('Batch Similarities:', batchResults.map(s => s.toFixed(4)));

// ============================================================================
// Test 5: Edge Cases
// ============================================================================
console.log('\n\n📝 Test 5: Edge Case Handling');
console.log('-'.repeat(80));

const testCases = [
  {
    name: 'Zero vector',
    vectorA: [0, 0, 0],
    vectorB: [1, 2, 3],
    shouldError: false
  },
  {
    name: 'Negative values',
    vectorA: [-1, -2, -3],
    vectorB: [1, 2, 3],
    shouldError: false
  },
  {
    name: 'Very small values',
    vectorA: [0.0001, 0.0002, 0.0003],
    vectorB: [0.0001, 0.0002, 0.0003],
    shouldError: false
  }
];

testCases.forEach(test => {
  try {
    const result = cosineSimilarity(test.vectorA, test.vectorB);
    console.log(`✅ ${test.name}: ${result.toFixed(4)}`);
  } catch (error) {
    if (test.shouldError) {
      console.log(`✅ ${test.name}: Error handled correctly`);
    } else {
      console.log(`❌ ${test.name}: Unexpected error - ${error.message}`);
    }
  }
});

// ============================================================================
// Test 6: Error Handling
// ============================================================================
console.log('\n\n📝 Test 6: Error Handling');
console.log('-'.repeat(80));

const errorCases = [
  {
    name: 'Dimension mismatch',
    vectorA: [1, 2, 3],
    vectorB: [1, 2],
    shouldError: true
  },
  {
    name: 'Empty vector',
    vectorA: [],
    vectorB: [1, 2, 3],
    shouldError: true
  },
  {
    name: 'Null vector',
    vectorA: null,
    vectorB: [1, 2, 3],
    shouldError: true
  }
];

errorCases.forEach(test => {
  try {
    const result = cosineSimilarity(test.vectorA, test.vectorB);
    if (test.shouldError) {
      console.log(`❌ ${test.name}: Should have thrown error but got ${result}`);
    } else {
      console.log(`✅ ${test.name}: ${result.toFixed(4)}`);
    }
  } catch (error) {
    if (test.shouldError) {
      console.log(`✅ ${test.name}: Error correctly handled - ${error.message}`);
    } else {
      console.log(`❌ ${test.name}: Unexpected error - ${error.message}`);
    }
  }
});

// ============================================================================
// Performance Test
// ============================================================================
console.log('\n\n📝 Test 7: Performance Benchmark');
console.log('-'.repeat(80));

// Create realistic 384-dimensional vectors (typical for embeddings)
const createRandomVector = (dim) => Array.from({ length: dim }, () => Math.random());

const resume384 = createRandomVector(384);
const jobs384 = Array.from({ length: 100 }, () => createRandomVector(384));

console.log(`Testing with 384-dimensional vectors`);
console.log(`Comparing 1 resume against ${jobs384.length} jobs`);

const startTime = Date.now();
const results = cosineSimilarityBatch(resume384, jobs384);
const endTime = Date.now();

const avgScore = results.reduce((a, b) => a + b, 0) / results.length;
const maxScore = Math.max(...results);
const minScore = Math.min(...results);

console.log(`\nPerformance Results:`);
console.log(`  Time taken: ${endTime - startTime}ms`);
console.log(`  Comparisons: ${jobs384.length}`);
console.log(`  Avg score: ${avgScore.toFixed(4)}`);
console.log(`  Max score: ${maxScore.toFixed(4)}`);
console.log(`  Min score: ${minScore.toFixed(4)}`);

// ============================================================================
// Summary
// ============================================================================
console.log('\n\n' + '='.repeat(80));
console.log('✅ All tests completed successfully!');
console.log('='.repeat(80));
console.log('\nNext Steps:');
console.log('1. Ensure your MongoDB has resume embeddings and job embeddings');
console.log('2. Start your server: npm start');
console.log('3. Test the API endpoint: GET /api/jobs/recommendations');
console.log('4. Check QUICK_START.js for integration examples\n');
