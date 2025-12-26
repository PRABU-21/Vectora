# 🚀 DEPLOYMENT & TESTING GUIDE

## 📋 Pre-Deployment Checklist

### ✅ Files Created/Modified

#### New Files (Created):
- [x] `backend/utils/cosineSimilarity.js` - Core similarity algorithm
- [x] `backend/testCosineSimilarity.js` - Unit tests for utility
- [x] `backend/testRecommendations.js` - API integration tests
- [x] `backend/RECOMMENDATION_SYSTEM.md` - Complete documentation
- [x] `backend/QUICK_START.js` - Quick start guide
- [x] `backend/IMPLEMENTATION_SUMMARY.md` - Implementation summary
- [x] `backend/ARCHITECTURE_DIAGRAM.js` - Visual architecture
- [x] `backend/DEPLOYMENT_GUIDE.md` - This file

#### Modified Files:
- [x] `backend/controllers/jobController.js` - Added getJobRecommendations()
- [x] `backend/routes/jobRoutes.js` - Added /recommendations route

#### Existing Files (Verified):
- [x] `backend/server.js` - Job routes configured
- [x] `backend/models/Embedding.js` - Schema ready
- [x] `backend/models/Job.js` - Embedding field present
- [x] `backend/middleware/authMiddleware.js` - JWT protection ready

---

## 🧪 STEP 1: Test Cosine Similarity Functions

### Run Unit Tests
```bash
cd d:\cursor\partner\backend
node testCosineSimilarity.js
```

### Expected Output:
```
🧪 Testing Cosine Similarity Utility Functions
================================================================================

📝 Test 1: Basic Cosine Similarity
--------------------------------------------------------------------------------
Vector A: [ 1, 2, 3, 4, 5 ]
Vector B (identical): [ 1, 2, 3, 4, 5 ]
Vector C (reverse): [ 5, 4, 3, 2, 1 ]
Vector D (2x scale): [ 2, 4, 6, 8, 10 ]

Results:
A vs B (identical): 1.0000 ✅ Expected: ~1.0000
A vs C (reverse): 0.6364 ✅ Expected: ~0.6364
A vs D (scaled): 1.0000 ✅ Expected: ~1.0000

...

✅ All tests completed successfully!
```

### What This Tests:
- ✅ Basic similarity calculations
- ✅ Vector normalization
- ✅ Edge case handling
- ✅ Performance benchmarking

---

## 🌐 STEP 2: Start Your Server

### Start the Backend Server
```bash
cd d:\cursor\partner\backend
npm start
```

Or with nodemon for development:
```bash
npx nodemon server.js
```

### Expected Output:
```
Server running on port 5000
MongoDB connected successfully
```

### Verify Server is Running:
```bash
# Test basic health check
curl http://localhost:5000/api/jobs/
```

---

## 🔐 STEP 3: Test Authentication

### Option A: Using cURL (Git Bash/Linux/Mac)
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"yourpassword"}'
```

### Option B: Using PowerShell (Windows)
```powershell
# Login and save token
$body = @{
    email = "test@example.com"
    password = "yourpassword"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$token = $response.token
Write-Host "Token: $token"
```

### Expected Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f191e810c19729de860ea",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### Save the Token:
```bash
# Save to environment variable
export TOKEN="your-token-here"

# Or in PowerShell
$env:TOKEN = "your-token-here"
```

---

## 🎯 STEP 4: Test Recommendations Endpoint

### Option A: Using cURL
```bash
# Get recommendations (using saved token)
curl -X GET "http://localhost:5000/api/jobs/recommendations?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### Option B: Using PowerShell
```powershell
# Get recommendations
$headers = @{
    "Authorization" = "Bearer $token"
}

$recommendations = Invoke-RestMethod -Uri "http://localhost:5000/api/jobs/recommendations?limit=10" `
    -Method GET `
    -Headers $headers

# Display results
$recommendations | ConvertTo-Json -Depth 10
```

### Option C: Using Postman

1. **Create new GET request**
   - URL: `http://localhost:5000/api/jobs/recommendations?limit=10`

2. **Add Authorization Header**
   - Go to "Headers" tab
   - Add header: `Authorization: Bearer YOUR_TOKEN`

3. **Send Request**
   - Click "Send"
   - Review response

### Expected Response:
```json
{
  "success": true,
  "count": 10,
  "totalJobsAnalyzed": 45,
  "recommendations": [
    {
      "jobId": "507f1f77bcf86cd799439011",
      "jobTitle": "Senior Full Stack Developer",
      "company": "Tech Corp",
      "location": "Remote",
      "type": "Full-time",
      "experience": "5+ years",
      "salary": "$120k - $160k",
      "skills": ["JavaScript", "React", "Node.js", "MongoDB"],
      "description": "We are looking for...",
      "explanation": "Great match based on your skills...",
      "similarityScore": 0.8734
    }
    // ... more recommendations
  ],
  "metadata": {
    "userId": "507f191e810c19729de860ea",
    "resumeEmbeddingId": "507f191e810c19729de860eb",
    "embeddingDimension": 384,
    "requestedLimit": 10,
    "timestamp": "2025-12-26T10:30:00.000Z"
  }
}
```

---

## 🔬 STEP 5: Run Full Test Suite

### Run API Integration Tests
```bash
cd d:\cursor\partner\backend
node testRecommendations.js
```

### What This Tests:
1. ✅ Authentication flow
2. ✅ Basic recommendation retrieval
3. ✅ Response structure validation
4. ✅ Recommendation sorting
5. ✅ Different limit values
6. ✅ Performance measurement

### Expected Output:
```
╔════════════════════════════════════════════════════════════════════════════╗
║                Job Recommendation System - Test Suite                      ║
╚════════════════════════════════════════════════════════════════════════════╝

📝 Step 1: Authenticating...
✅ Login successful

📋 Total Jobs Available: 45

🧪 Test 1: Basic Recommendation Retrieval
================================================================================
...
✅ All tests completed successfully!
```

---

## 🐛 STEP 6: Troubleshooting Common Issues

### Issue 1: "No resume embedding found"

**Cause**: User hasn't uploaded a resume yet

**Solution**:
```bash
# Upload a resume first
curl -X POST http://localhost:5000/api/embeddings/upload-embedding \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@path/to/your/resume.txt"
```

### Issue 2: "No jobs with embeddings found"

**Cause**: Jobs don't have embeddings in database

**Solution**:
```bash
# Check if jobs exist
curl http://localhost:5000/api/jobs/

# If jobs exist but no embeddings, run job seeder
node seeds/seedJobs.js
```

### Issue 3: All similarity scores are 0

**Cause**: Embeddings might be empty or incompatible

**Check**:
```javascript
// In MongoDB shell or Compass
db.embeddings.findOne({ userId: ObjectId("your-user-id") })
db.jobs.findOne({ embedding: { $exists: true } })
```

**Solution**: Re-generate embeddings with correct model

### Issue 4: 401 Unauthorized

**Cause**: Invalid or missing JWT token

**Solution**:
```bash
# Verify token is being sent correctly
curl -X GET "http://localhost:5000/api/jobs/recommendations" \
  -H "Authorization: Bearer $TOKEN" \
  -v  # Verbose mode to see headers
```

### Issue 5: Slow Performance (> 1 second)

**Cause**: Too many jobs or missing indexes

**Solution**:
```javascript
// Add MongoDB indexes
db.embeddings.createIndex({ userId: 1 })
db.embeddings.createIndex({ userId: 1, createdAt: -1 })
db.jobs.createIndex({ embedding: 1 })
```

---

## 📊 STEP 7: Monitor & Validate

### Check Logs
Monitor your server console for:
```
🔍 Fetching job recommendations for user: 507f191e810c19729de860ea
✅ Found resume embedding with 384 dimensions
✅ Found 45 jobs with embeddings
✅ Returning 10 recommendations
```

### Validate Response Data
```javascript
// Each recommendation should have:
{
  jobId: "string",         // ✅ MongoDB ObjectId
  jobTitle: "string",      // ✅ Job title
  company: "string",       // ✅ Company name
  similarityScore: 0.87    // ✅ Number between 0 and 1
}
```

### Check Similarity Score Distribution
```bash
# Good distribution example:
Top match:    0.89 (89%)
2nd match:    0.85 (85%)
3rd match:    0.78 (78%)
...
10th match:   0.62 (62%)
```

**Warning Signs**:
- ❌ All scores exactly 1.0 → Embeddings might be identical
- ❌ All scores around 0.5 → Embeddings might be random
- ❌ All scores below 0.3 → Resume/jobs might be incompatible

---

## 🚀 STEP 8: Frontend Integration

### React Example
```jsx
// src/pages/JobRecommendations.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

function JobRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(
          'http://localhost:5000/api/jobs/recommendations?limit=10',
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setRecommendations(response.data.recommendations);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <div>Loading recommendations...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="recommendations">
      <h1>Recommended Jobs for You</h1>
      {recommendations.map((job, index) => (
        <div key={job.jobId} className="job-card">
          <div className="rank">#{index + 1}</div>
          <h3>{job.jobTitle}</h3>
          <p className="company">{job.company}</p>
          <div className="match-score">
            {(job.similarityScore * 100).toFixed(1)}% Match
          </div>
          <p className="location">{job.location} • {job.type}</p>
          <div className="skills">
            {job.skills.map(skill => (
              <span key={skill} className="skill-tag">{skill}</span>
            ))}
          </div>
          <button>View Details</button>
        </div>
      ))}
    </div>
  );
}

export default JobRecommendations;
```

### Test Frontend Integration
1. Start frontend dev server: `npm run dev` (in fr directory)
2. Navigate to recommendations page
3. Verify jobs display correctly
4. Check browser console for errors
5. Verify match percentages display

---

## 🔒 STEP 9: Security Validation

### Test JWT Protection
```bash
# Should fail without token
curl -X GET "http://localhost:5000/api/jobs/recommendations"
# Expected: 401 Unauthorized

# Should succeed with token
curl -X GET "http://localhost:5000/api/jobs/recommendations" \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 with recommendations
```

### Test Invalid Token
```bash
# Should fail with invalid token
curl -X GET "http://localhost:5000/api/jobs/recommendations" \
  -H "Authorization: Bearer invalid-token-here"
# Expected: 401 Invalid Token
```

### Test User Data Isolation
- User A should only see recommendations based on User A's resume
- User B should only see recommendations based on User B's resume
- No cross-user data leakage

---

## 📈 STEP 10: Performance Testing

### Test Different Load Scenarios

```bash
# Small dataset (10 jobs)
time curl -X GET "http://localhost:5000/api/jobs/recommendations?limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Medium dataset (50 jobs)
time curl -X GET "http://localhost:5000/api/jobs/recommendations?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Performance Benchmarks
| Jobs | Expected Time | Acceptable |
|------|---------------|------------|
| 10   | < 100ms       | ✅         |
| 50   | < 300ms       | ✅         |
| 100  | < 500ms       | ✅         |
| 500  | < 2000ms      | ⚠️         |

### Optimize if Needed
```javascript
// Add indexes in MongoDB
db.embeddings.createIndex({ userId: 1, createdAt: -1 })
db.jobs.createIndex({ embedding: 1 })

// Implement caching (optional)
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 600 }); // 10 min cache
```

---

## ✅ Final Deployment Checklist

### Before Going to Production:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Frontend integration working
- [ ] Authentication tested thoroughly
- [ ] Performance acceptable (< 500ms)
- [ ] Error handling tested
- [ ] MongoDB indexes created
- [ ] Environment variables configured
- [ ] Logging configured
- [ ] CORS configured for production domain
- [ ] Rate limiting added (optional but recommended)
- [ ] SSL/HTTPS enabled
- [ ] Backup strategy in place
- [ ] Monitoring/analytics configured

### Environment Variables for Production:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your-very-secure-secret-key-here
PORT=5000
```

---

## 📚 Documentation Files Reference

1. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - What was built
2. **[RECOMMENDATION_SYSTEM.md](./RECOMMENDATION_SYSTEM.md)** - Full technical docs
3. **[QUICK_START.js](./QUICK_START.js)** - Quick start guide
4. **[ARCHITECTURE_DIAGRAM.js](./ARCHITECTURE_DIAGRAM.js)** - Visual diagrams
5. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - This file

---

## 🎉 Success Criteria

Your system is ready when:

1. ✅ Unit tests pass: `node testCosineSimilarity.js`
2. ✅ API tests pass: `node testRecommendations.js`
3. ✅ Endpoint returns recommendations: `GET /api/jobs/recommendations`
4. ✅ Scores are reasonable: 0.6 - 0.9 for good matches
5. ✅ Performance acceptable: < 500ms response time
6. ✅ Frontend displays recommendations correctly
7. ✅ No errors in server logs
8. ✅ Users can only see their own recommendations

---

## 🆘 Need Help?

1. Check error messages - they're designed to be helpful
2. Review server logs for detailed information
3. Run test files to isolate issues
4. Check MongoDB data for embeddings
5. Verify authentication tokens
6. Review documentation files

---

**🚀 Ready to Deploy!**

Your job recommendation system is production-ready. Follow this guide step by step to ensure everything works correctly before deploying to production.
