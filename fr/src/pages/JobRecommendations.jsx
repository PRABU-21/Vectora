import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJobs, getJobRecommendations } from "../data/api.js";

const JobRecommendations = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [recommendationMetadata, setRecommendationMetadata] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Fetch jobs from backend
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await getJobs();
        setJobs(response.jobs);
        setError(null);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load job recommendations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, [navigate]);

  const handleJobClick = (job) => {
    setSelectedJob(job);
  };

  const closeModal = () => {
    setSelectedJob(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Handle personalized recommendations
  const handleGetRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getJobRecommendations(20);
      
      if (response.success && response.recommendations) {
        setJobs(response.recommendations);
        setRecommendationMetadata(response.metadata);
        setIsPersonalized(true);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      
      // Handle specific error messages
      let errorMessage = '';
      if (err.response?.status === 404) {
        errorMessage = err.response.data.message || 'Please upload your resume first to get personalized recommendations.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else {
        errorMessage = 'Failed to load personalized recommendations. Please make sure you have uploaded your resume.';
      }
      
      setError(errorMessage);
      setIsPersonalized(false);
      
      // Try to fall back to showing all jobs
      try {
        const fallbackResponse = await getJobs();
        setJobs(fallbackResponse.jobs);
      } catch (fallbackErr) {
        console.error('Error fetching fallback jobs:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle showing all jobs
  const handleShowAllJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getJobs();
      setJobs(response.jobs);
      setIsPersonalized(false);
      setRecommendationMetadata(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <nav className="bg-black shadow-lg w-full h-16 flex-shrink-0">
        <div className="h-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Madathon</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-white font-medium">
                  Welcome, {user.name}
                </span>
              )}
              <button
                onClick={() => navigate("/dashboard")}
                className="text-white hover:text-red-400 font-medium transition"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="text-white hover:text-red-400 font-medium transition"
              >
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="bg-white text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex justify-center mb-6">
        <div className="flex gap-4">
          <button
            className="bg-red-700 text-white py-3 px-8 rounded-lg font-semibold hover:bg-red-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGetRecommendations}
            disabled={loading}
          >
            {loading && isPersonalized ? 'Loading...' : '🎯 Get Personalized Recommendations'}
          </button>
          
          {isPersonalized && (
            <button
              className="bg-gray-700 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleShowAllJobs}
              disabled={loading}
            >
              {loading && !isPersonalized ? 'Loading...' : '📋 Show All Jobs'}
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-red-700 mb-2">
              {isPersonalized ? '🎯 Your Personalized Job Recommendations' : 'Job Recommendations'}
            </h2>
            <p className="text-gray-600">
              {loading 
                ? "Loading opportunities..." 
                : isPersonalized
                  ? `Found ${jobs.length} jobs tailored to your resume ${recommendationMetadata ? `(analyzed ${recommendationMetadata.totalJobsAnalyzed} jobs)` : ''}`
                  : `Explore ${jobs.length} exciting opportunities`
              }
            </p>
            
            {isPersonalized && recommendationMetadata && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p>✨ <strong>AI-Powered Matching:</strong> Jobs ranked by similarity to your resume using advanced cosine similarity analysis ({recommendationMetadata.embeddingDimension}-dimensional embeddings)</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="font-semibold">{error}</p>
                  {error.includes('resume') && (
                    <p className="text-sm mt-1">Go to <button onClick={() => navigate('/add-embeddings')} className="underline font-semibold hover:text-red-900">Add Embeddings</button> to upload your resume.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-700"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job, index) => (
                <div
                  key={job.id || job.jobId}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-xl transition-shadow flex flex-col cursor-pointer relative"
                  onClick={() => handleJobClick(job)}
                >
                  {/* Match Score Badge for Personalized Recommendations */}
                  {isPersonalized && job.similarityScore !== undefined && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                        {(job.similarityScore * 100).toFixed(1)}% Match
                      </div>
                    </div>
                  )}
                  
                  {/* Rank Badge for Top Recommendations */}
                  {isPersonalized && index < 3 && (
                    <div className="absolute top-4 left-4">
                      <div className={`text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-4 mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {job.title || job.jobTitle}
                    </h3>
                    <p className="text-red-700 font-semibold mb-1">
                      {job.company}
                    </p>
                    <div className="flex items-center text-sm text-gray-600 mb-1">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {job.type}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {job.experience}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                      {job.description}
                    </p>
                    <p className="text-lg font-bold text-green-700">
                      {job.salary}
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Required Skills:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {job.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button className="w-full bg-red-700 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-800 transition">
                    Apply Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Detail Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedJob.title || selectedJob.jobTitle}
                    </h3>
                    <p className="text-red-700 font-semibold text-lg">
                      {selectedJob.company}
                    </p>
                    
                    {/* Match Score in Modal */}
                    {isPersonalized && selectedJob.similarityScore !== undefined && (
                      <div className="mt-3 inline-block">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                          🎯 {(selectedJob.similarityScore * 100).toFixed(1)}% Match with Your Resume
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 text-2xl ml-4"
                  >
                    &times;
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {selectedJob.location}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {selectedJob.type}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {selectedJob.experience}
                  </div>
                  <div className="flex items-center text-green-700 font-bold text-lg">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    {selectedJob.salary}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Job Description</h4>
                  <p className="text-gray-700">{selectedJob.description}</p>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Role Explanation</h4>
                  <p className="text-gray-700 whitespace-pre-line">{selectedJob.explanation}</p>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 bg-red-700 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-800 transition">
                    Apply Now
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobRecommendations;