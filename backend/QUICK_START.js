/**
 * QUICK START GUIDE - Job Recommendation System
 * 
 * Follow these steps to start using the job recommendation system
 */

// ============================================================================
// STEP 1: VERIFY YOUR SERVER SETUP
// ============================================================================

/*
Make sure your server.js includes the job routes:

import jobRoutes from './routes/jobRoutes.js';
app.use('/api/jobs', jobRoutes);
*/

// ============================================================================
// STEP 2: START YOUR SERVER
// ============================================================================

/*
Terminal command:
cd backend
npm start

Or with nodemon:
nodemon server.js
*/

// ============================================================================
// STEP 3: TEST THE ENDPOINT
// ============================================================================

// Option A: Using cURL (Linux/Mac/Git Bash)
/*
# First, login to get a token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'

# Copy the token from the response, then:
curl -X GET "http://localhost:5000/api/jobs/recommendations?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
*/

// Option B: Using PowerShell (Windows)
/*
# First, login
$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"your-email@example.com","password":"your-password"}'

$token = $loginResponse.token

# Get recommendations
Invoke-RestMethod -Uri "http://localhost:5000/api/jobs/recommendations?limit=10" `
  -Method GET `
  -Headers @{"Authorization"="Bearer $token"}
*/

// Option C: Using JavaScript/Node.js
const axios = require('axios');

async function testRecommendations() {
  try {
    // 1. Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'your-email@example.com',
      password: 'your-password'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully');
    
    // 2. Get recommendations
    const recResponse = await axios.get(
      'http://localhost:5000/api/jobs/recommendations?limit=10',
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    
    console.log('\n📊 Job Recommendations:');
    console.log(JSON.stringify(recResponse.data, null, 2));
    
    // 3. Display top 5
    console.log('\n🏆 Top 5 Matches:');
    recResponse.data.recommendations.slice(0, 5).forEach((job, i) => {
      console.log(`${i + 1}. ${job.jobTitle} at ${job.company}`);
      console.log(`   Match: ${(job.similarityScore * 100).toFixed(2)}%\n`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
// testRecommendations();

// ============================================================================
// STEP 4: INTEGRATE INTO YOUR FRONTEND
// ============================================================================

// React Component Example:
/*
import { useState, useEffect } from 'react';

function JobRecommendations() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    fetch('http://localhost:5000/api/jobs/recommendations?limit=10', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setJobs(data.recommendations);
      setLoading(false);
    })
    .catch(err => console.error(err));
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Recommended Jobs</h2>
      {jobs.map((job, index) => (
        <div key={job.jobId} className="job-card">
          <h3>{job.jobTitle}</h3>
          <p>{job.company} • {job.location}</p>
          <div className="match-score">
            {(job.similarityScore * 100).toFixed(1)}% Match
          </div>
        </div>
      ))}
    </div>
  );
}
*/

// ============================================================================
// STEP 5: CUSTOMIZE (OPTIONAL)
// ============================================================================

/*
In backend/controllers/jobController.js, you can customize:

1. Default number of recommendations:
   const limit = Math.min(parseInt(req.query.limit) || 15, 50);
   
2. Minimum similarity threshold:
   if (similarity > 0.6) {  // Only show jobs with >60% match
     recommendations.push({...});
   }
   
3. Filter by location/type:
   const jobs = await Job.find({ 
     embedding: { $exists: true },
     location: req.query.location || { $exists: true }
   });
   
4. Add more fields to response:
   recommendations.push({
     ...existingFields,
     benefits: job.benefits,
     applicationDeadline: job.deadline
   });
*/

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*
❌ Problem: "No resume embedding found"
✅ Solution: Upload a resume first using the /api/embeddings/upload-embedding endpoint

❌ Problem: "No jobs with embeddings found"
✅ Solution: Make sure your jobs have embeddings. Check if jobs were seeded properly.

❌ Problem: "Vector dimension mismatch"
✅ Solution: Resume and job embeddings must use the same model (same dimensions)

❌ Problem: 401 Unauthorized
✅ Solution: Check that you're sending the correct JWT token in the Authorization header

❌ Problem: Recommendations all have score 0
✅ Solution: Verify embeddings are not empty arrays and have valid numerical values

❌ Problem: Slow response times
✅ Solution: 
   - Add MongoDB indexes on userId and embedding fields
   - Consider caching user resume embeddings
   - Implement pagination for large job datasets
*/

// ============================================================================
// API ENDPOINT SUMMARY
// ============================================================================

/*
Endpoint: GET /api/jobs/recommendations

Query Parameters:
  - limit (optional): Number of recommendations (default: 10, max: 50)

Headers:
  - Authorization: Bearer <jwt-token> (required)

Response:
  {
    "success": true,
    "count": 10,
    "totalJobsAnalyzed": 45,
    "recommendations": [
      {
        "jobId": "string",
        "jobTitle": "string",
        "company": "string",
        "location": "string",
        "type": "string",
        "experience": "string",
        "salary": "string",
        "skills": ["string"],
        "description": "string",
        "explanation": "string",
        "similarityScore": 0.8734
      }
    ],
    "metadata": {
      "userId": "string",
      "resumeEmbeddingId": "string",
      "embeddingDimension": 384,
      "requestedLimit": 10,
      "timestamp": "2025-12-26T10:30:00.000Z"
    }
  }
*/

// ============================================================================
// NEXT STEPS
// ============================================================================

/*
1. ✅ Test the endpoint with Postman or cURL
2. ✅ Integrate into your frontend component
3. ✅ Customize the UI to display match percentages
4. ✅ Add filters (location, job type, experience level)
5. ✅ Implement "Save Job" functionality
6. ✅ Add "Apply Now" buttons
7. ✅ Create analytics to track which recommendations users click
8. ✅ A/B test different similarity thresholds
9. ✅ Add user feedback ("Was this helpful?")
10. ✅ Monitor performance and optimize as needed
*/

module.exports = { testRecommendations };
