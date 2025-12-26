/**
 * Job Recommendation System - Test & Usage Guide
 * 
 * This file demonstrates how to test the job recommendation endpoint
 * and explains the cosine similarity algorithm implementation.
 */

import axios from 'axios';

// ----------------- Configuration -----------------
const BASE_URL = 'http://localhost:5000/api';  // Adjust to your server URL
let authToken = '';  // Will be set after login

// ----------------- Helper Functions -----------------

/**
 * Login and get authentication token
 */
async function login(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log('Token:', authToken.substring(0, 20) + '...');
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get job recommendations for the logged-in user
 */
async function getRecommendations(limit = 10) {
  try {
    const response = await axios.get(`${BASE_URL}/jobs/recommendations`, {
      params: { limit },
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('\n📊 Job Recommendations Response:');
    console.log('━'.repeat(80));
    console.log(`Total Recommendations: ${response.data.count}`);
    console.log(`Total Jobs Analyzed: ${response.data.totalJobsAnalyzed}`);
    console.log(`Embedding Dimension: ${response.data.metadata.embeddingDimension}`);
    console.log('━'.repeat(80));
    
    // Display top recommendations
    response.data.recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.jobTitle} at ${rec.company}`);
      console.log(`   Similarity Score: ${rec.similarityScore} (${(rec.similarityScore * 100).toFixed(2)}%)`);
      console.log(`   Location: ${rec.location} | Type: ${rec.type}`);
      console.log(`   Experience: ${rec.experience}`);
      console.log(`   Skills: ${rec.skills.join(', ')}`);
      console.log(`   Job ID: ${rec.jobId}`);
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get recommendations:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get all jobs (for comparison)
 */
async function getAllJobs() {
  try {
    const response = await axios.get(`${BASE_URL}/jobs/`);
    console.log(`\n📋 Total Jobs Available: ${response.data.count}`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get jobs:', error.response?.data || error.message);
    throw error;
  }
}

// ----------------- Test Scenarios -----------------

/**
 * Test 1: Basic Recommendation Retrieval
 */
async function testBasicRecommendations() {
  console.log('\n🧪 Test 1: Basic Recommendation Retrieval');
  console.log('='.repeat(80));
  
  try {
    // Get top 5 recommendations
    const recommendations = await getRecommendations(5);
    
    // Verify response structure
    console.log('\n✅ Response Structure Validation:');
    console.log(`- Has 'success' field: ${recommendations.success !== undefined}`);
    console.log(`- Has 'count' field: ${recommendations.count !== undefined}`);
    console.log(`- Has 'recommendations' array: ${Array.isArray(recommendations.recommendations)}`);
    console.log(`- Has 'metadata' object: ${recommendations.metadata !== undefined}`);
    
    // Verify recommendation fields
    if (recommendations.recommendations.length > 0) {
      const firstRec = recommendations.recommendations[0];
      console.log('\n✅ Recommendation Object Fields:');
      console.log(`- jobId: ${firstRec.jobId !== undefined}`);
      console.log(`- jobTitle: ${firstRec.jobTitle !== undefined}`);
      console.log(`- company: ${firstRec.company !== undefined}`);
      console.log(`- similarityScore: ${firstRec.similarityScore !== undefined}`);
      console.log(`- Score in range [0,1]: ${firstRec.similarityScore >= 0 && firstRec.similarityScore <= 1}`);
    }
    
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message);
  }
}

/**
 * Test 2: Recommendation Sorting Validation
 */
async function testRecommendationSorting() {
  console.log('\n🧪 Test 2: Recommendation Sorting Validation');
  console.log('='.repeat(80));
  
  try {
    const recommendations = await getRecommendations(20);
    
    // Verify recommendations are sorted by similarity (descending)
    let isSorted = true;
    for (let i = 0; i < recommendations.recommendations.length - 1; i++) {
      if (recommendations.recommendations[i].similarityScore < 
          recommendations.recommendations[i + 1].similarityScore) {
        isSorted = false;
        break;
      }
    }
    
    console.log(`\n✅ Recommendations properly sorted: ${isSorted}`);
    
    // Display score distribution
    const scores = recommendations.recommendations.map(r => r.similarityScore);
    console.log('\n📊 Similarity Score Distribution:');
    console.log(`   Highest: ${Math.max(...scores).toFixed(4)}`);
    console.log(`   Lowest: ${Math.min(...scores).toFixed(4)}`);
    console.log(`   Average: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(4)}`);
    
  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message);
  }
}

/**
 * Test 3: Different Limit Values
 */
async function testDifferentLimits() {
  console.log('\n🧪 Test 3: Testing Different Limit Values');
  console.log('='.repeat(80));
  
  try {
    const limits = [5, 10, 20];
    
    for (const limit of limits) {
      const result = await getRecommendations(limit);
      console.log(`\nLimit ${limit}: Received ${result.count} recommendations`);
      console.log(`   Expected: ${Math.min(limit, result.totalJobsAnalyzed)}`);
      console.log(`   Match: ${result.count <= limit && result.count <= result.totalJobsAnalyzed}`);
    }
    
  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message);
  }
}

/**
 * Test 4: Performance Measurement
 */
async function testPerformance() {
  console.log('\n🧪 Test 4: Performance Measurement');
  console.log('='.repeat(80));
  
  try {
    const iterations = 5;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await getRecommendations(10);
      const endTime = Date.now();
      times.push(endTime - startTime);
      console.log(`   Iteration ${i + 1}: ${endTime - startTime}ms`);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`\n📊 Performance Results:`);
    console.log(`   Average Response Time: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min: ${Math.min(...times)}ms`);
    console.log(`   Max: ${Math.max(...times)}ms`);
    
  } catch (error) {
    console.error('❌ Test 4 Failed:', error.message);
  }
}

// ----------------- Main Test Runner -----------------

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                Job Recommendation System - Test Suite                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  
  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Authenticating...');
    await login('test@example.com', 'password123');  // Replace with actual credentials
    
    // Step 2: Get all jobs for context
    await getAllJobs();
    
    // Step 3: Run tests
    await testBasicRecommendations();
    await testRecommendationSorting();
    await testDifferentLimits();
    await testPerformance();
    
    console.log('\n\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// ----------------- Usage Examples -----------------

/**
 * Example 1: Simple Usage
 */
async function exampleSimpleUsage() {
  // Login
  await login('user@example.com', 'password');
  
  // Get top 10 recommendations
  const recommendations = await getRecommendations(10);
  
  // Use the recommendations
  recommendations.recommendations.forEach(job => {
    console.log(`${job.jobTitle} - Score: ${job.similarityScore}`);
  });
}

/**
 * Example 2: Frontend Integration
 */
async function exampleFrontendIntegration() {
  /*
  // In your React/Vue/Angular component:
  
  const fetchRecommendations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/jobs/recommendations?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update your state with recommendations
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    }
  };
  */
}

// ----------------- Run Tests -----------------

// Uncomment to run all tests
// runAllTests();

// Or run individual tests
// exampleSimpleUsage();

export {
  login,
  getRecommendations,
  getAllJobs,
  runAllTests,
  testBasicRecommendations,
  testRecommendationSorting,
  testDifferentLimits,
  testPerformance
};
