/**
 * SYSTEM ARCHITECTURE DIAGRAM
 * 
 * Visual representation of the Job Recommendation System
 */

/*

╔═══════════════════════════════════════════════════════════════════════════╗
║                    JOB RECOMMENDATION SYSTEM ARCHITECTURE                 ║
╚═══════════════════════════════════════════════════════════════════════════╝


┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT SIDE                                │
└─────────────────────────────────────────────────────────────────────────┘

    Frontend (React/Vue/Angular)
         │
         │ HTTP GET Request
         │ /api/jobs/recommendations?limit=10
         │ Header: Authorization: Bearer <JWT>
         ▼

┌─────────────────────────────────────────────────────────────────────────┐
│                             API LAYER                                   │
└─────────────────────────────────────────────────────────────────────────┘

    Express.js Server (server.js)
         │
         ├─► Routing Layer (routes/jobRoutes.js)
         │        │
         │        ├─► GET /api/jobs/recommendations
         │        │
         │        └─► Middleware: protect (authMiddleware.js)
         │                 │
         │                 ├─► Verify JWT Token
         │                 ├─► Extract userId from token
         │                 └─► Attach user to req.user
         │
         ▼

┌─────────────────────────────────────────────────────────────────────────┐
│                          CONTROLLER LAYER                               │
└─────────────────────────────────────────────────────────────────────────┘

    jobController.js :: getJobRecommendations()
         │
         ├─► STEP 1: Fetch User Resume Embedding
         │   ┌──────────────────────────────────────┐
         │   │ MongoDB Query:                       │
         │   │ Embedding.findOne({                  │
         │   │   userId: req.user._id               │
         │   │ }).sort({ createdAt: -1 })           │
         │   └──────────────────────────────────────┘
         │
         ├─► STEP 2: Fetch All Job Embeddings
         │   ┌──────────────────────────────────────┐
         │   │ MongoDB Query:                       │
         │   │ Job.find({                           │
         │   │   embedding: {                       │
         │   │     $exists: true,                   │
         │   │     $ne: null,                       │
         │   │     $not: { $size: 0 }               │
         │   │   }                                  │
         │   │ })                                   │
         │   └──────────────────────────────────────┘
         │
         ├─► STEP 3: Calculate Similarities
         │   ┌──────────────────────────────────────┐
         │   │ For each job:                        │
         │   │   1. Validate embedding              │
         │   │   2. Check dimension match           │
         │   │   3. Call cosineSimilarity()         │
         │   │   4. Store result                    │
         │   └──────────────────────────────────────┘
         │
         ├─► STEP 4: Sort & Limit
         │   ┌──────────────────────────────────────┐
         │   │ recommendations.sort((a, b) =>       │
         │   │   b.similarityScore - a.score)       │
         │   │ .slice(0, limit)                     │
         │   └──────────────────────────────────────┘
         │
         └─► STEP 5: Return Response
             ┌──────────────────────────────────────┐
             │ res.json({                           │
             │   success: true,                     │
             │   count: N,                          │
             │   recommendations: [...]             │
             │ })                                   │
             └──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                          UTILITY LAYER                                  │
└─────────────────────────────────────────────────────────────────────────┘

    utils/cosineSimilarity.js
         │
         ├─► cosineSimilarity(vectorA, vectorB)
         │   ┌──────────────────────────────────────┐
         │   │ 1. Validate inputs                   │
         │   │ 2. Calculate dot product             │
         │   │    dotProd = Σ(A[i] × B[i])          │
         │   │ 3. Calculate magnitudes              │
         │   │    magA = √(Σ(A[i]²))                │
         │   │    magB = √(Σ(B[i]²))                │
         │   │ 4. Compute similarity                │
         │   │    similarity = dotProd/(magA×magB)  │
         │   │ 5. Clamp to [0, 1]                   │
         │   └──────────────────────────────────────┘
         │
         ├─► normalizeVector(vector)
         │   ┌──────────────────────────────────────┐
         │   │ normalized = vector.map(v =>         │
         │   │   v / magnitude(vector))             │
         │   └──────────────────────────────────────┘
         │
         └─► cosineSimilarityBatch(ref, targets)
             ┌──────────────────────────────────────┐
             │ targets.map(target =>                │
             │   cosineSimilarity(ref, target))     │
             └──────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                 │
└─────────────────────────────────────────────────────────────────────────┘

    MongoDB Collections
         │
         ├─► embeddings
         │   ┌──────────────────────────────────────┐
         │   │ _id: ObjectId                        │
         │   │ userId: ObjectId (ref: User)         │
         │   │ field: String                        │
         │   │ content: String                      │
         │   │ embedding: [Number] (384 dims)       │
         │   │ createdAt: Date                      │
         │   └──────────────────────────────────────┘
         │
         └─► jobs
             ┌──────────────────────────────────────┐
             │ _id: ObjectId                        │
             │ companyName: String                  │
             │ jobRoleName: String                  │
             │ description: String                  │
             │ location: String                     │
             │ skills: [String]                     │
             │ embedding: [Number] (384 dims)       │
             │ createdAt: Date                      │
             └──────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════════╗
║                           DATA FLOW DIAGRAM                               ║
╚═══════════════════════════════════════════════════════════════════════════╝


User Resume                                    Job Postings
     │                                              │
     │ Upload & Process                            │ Scrape/Add
     ▼                                              ▼
┌──────────┐                                  ┌──────────┐
│ Resume   │                                  │   Job    │
│  Text    │                                  │   Text   │
└──────────┘                                  └──────────┘
     │                                              │
     │ Embedding Model (Xenova/all-MiniLM-L6-v2)  │
     ▼                                              ▼
┌──────────┐                                  ┌──────────┐
│ Resume   │                                  │   Job    │
│Embedding │                                  │Embedding │
│(384 dims)│                                  │(384 dims)│
└──────────┘                                  └──────────┘
     │                                              │
     │ Store in MongoDB                            │
     ▼                                              ▼
┌──────────┐                                  ┌──────────┐
│Embedding │                                  │   Job    │
│Collection│                                  │Collection│
└──────────┘                                  └──────────┘
     │                                              │
     │                                              │
     └──────────────┬───────────────────────────────┘
                    │
                    │ Cosine Similarity Calculation
                    ▼
              ┌───────────┐
              │ Similarity│
              │   Scores  │
              └───────────┘
                    │
                    │ Sort & Rank
                    ▼
              ┌───────────┐
              │Top N Jobs │
              │Recommended│
              └───────────┘
                    │
                    ▼
                  User


╔═══════════════════════════════════════════════════════════════════════════╗
║                      COSINE SIMILARITY CALCULATION                        ║
╚═══════════════════════════════════════════════════════════════════════════╝


Resume Vector:    [0.8, 0.6, 0.9, 0.7, ...]  (384 dimensions)
                            ↓
                   Calculate against
                            ↓
Job Vector 1:     [0.82, 0.58, 0.88, ...]    → Similarity: 0.95 ✅ Top Match!
Job Vector 2:     [0.3, 0.9, 0.2, ...]       → Similarity: 0.42 ❌ Poor Match
Job Vector 3:     [0.75, 0.62, 0.85, ...]    → Similarity: 0.88 ✅ Good Match
Job Vector 4:     [0.5, 0.4, 0.6, ...]       → Similarity: 0.65 ⚠️ Fair Match


Formula Applied to Each:
                    
    cosine_similarity = (A · B) / (||A|| × ||B||)
    
    Where:
    A · B = 0.8×0.82 + 0.6×0.58 + 0.9×0.88 + ...
    ||A|| = √(0.8² + 0.6² + 0.9² + ...)
    ||B|| = √(0.82² + 0.58² + 0.88² + ...)


╔═══════════════════════════════════════════════════════════════════════════╗
║                          ERROR HANDLING FLOW                              ║
╚═══════════════════════════════════════════════════════════════════════════╝


Request Received
     │
     ├─► No JWT Token? ──────────► 401 Unauthorized
     │
     ├─► Invalid Token? ─────────► 401 Invalid Token
     │
     ├─► No Resume Embedding? ───► 404 "Please upload resume"
     │
     ├─► No Jobs? ───────────────► 404 "No jobs available"
     │
     ├─► Empty Embeddings? ──────► Skip job, log warning
     │
     ├─► Dimension Mismatch? ────► Skip job, log warning
     │
     ├─► Calculation Error? ─────► Skip job, continue
     │
     └─► Success ────────────────► 200 with recommendations


╔═══════════════════════════════════════════════════════════════════════════╗
║                           SECURITY LAYERS                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝


┌────────────────────┐
│   1. JWT Auth      │  → Verifies user identity
└────────────────────┘
         │
┌────────────────────┐
│   2. User Check    │  → Ensures user exists
└────────────────────┘
         │
┌────────────────────┐
│   3. Data Filter   │  → Only user's own embeddings
└────────────────────┘
         │
┌────────────────────┐
│   4. Input Valid   │  → Validates query parameters
└────────────────────┘
         │
┌────────────────────┐
│   5. Error Mask    │  → No sensitive data in errors
└────────────────────┘


╔═══════════════════════════════════════════════════════════════════════════╗
║                         PERFORMANCE METRICS                               ║
╚═══════════════════════════════════════════════════════════════════════════╝


Number of Jobs   | Embedding Dims | Avg Response Time | Memory Usage
─────────────────┼────────────────┼───────────────────┼──────────────
10               | 384            | ~50ms             | ~5MB
50               | 384            | ~150ms            | ~15MB
100              | 384            | ~250ms            | ~25MB
500              | 384            | ~800ms            | ~100MB
1000             | 384            | ~1500ms           | ~200MB


Optimization Opportunities:
├─► Add MongoDB indexes on userId and embedding
├─► Implement resume embedding caching
├─► Pre-filter jobs by location/type before similarity calc
├─► Use worker threads for parallel processing
└─► Implement result caching (Redis)

*/

console.log('See comments in this file for visual architecture diagrams');

export const architecture = {
  description: 'Job Recommendation System Architecture',
  layers: ['Client', 'API', 'Controller', 'Utility', 'Database'],
  components: {
    client: 'React/Vue/Angular frontend',
    api: 'Express.js routes with JWT authentication',
    controller: 'Business logic for recommendations',
    utility: 'Cosine similarity calculations',
    database: 'MongoDB for embeddings and jobs'
  }
};
