import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getJobs,
  getJobRecommendations,
  applyToJob,
  getAppliedJobs,
} from "../data/api.js";
import ParticlesBackground from "../components/ParticlesBackground";
import GoogleTranslate from "../components/GoogleTranslate";

const JobRecommendations = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [recommendationMetadata, setRecommendationMetadata] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    ``
    if (!token) {
      navigate("/login");
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await getJobs();
        setJobs(response.jobs);
        setError(null);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("Failed to load job recommendations. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    const fetchAppliedJobs = async () => {
      try {
        const response = await getAppliedJobs();
        if (response.success) {
          setAppliedJobs(response.appliedJobs);
        }
      } catch (err) {
        console.error("Error fetching applied jobs:", err);
      }
    };

    fetchJobs();
    fetchAppliedJobs();
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
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);

      let errorMessage = "";
      if (err.response && err.response.status === 404) {
        errorMessage =
          err.response.data.message ||
          "Please upload your resume first to get personalized recommendations.";
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        errorMessage = err.response.data.message;
      } else if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      } else {
        errorMessage =
          "Failed to load personalized recommendations. Please make sure you have uploaded your resume.";
      }

      setError(errorMessage);
      setIsPersonalized(false);

      try {
        const fallbackResponse = await getJobs();
        setJobs(fallbackResponse.jobs);
      } catch (fallbackErr) {
        console.error("Error fetching fallback jobs:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowAllJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getJobs();
      setJobs(response.jobs);
      setIsPersonalized(false);
      setRecommendationMetadata(null);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load jobs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApplyToJob = async (e, job) => {
    e.stopPropagation(); // Prevent modal from opening

    // Get job ID (handle both formats)
    const jobId = job.id || job._id || job.jobId;
    const jobTitle = job.title || job.jobTitle || job.jobRoleName;
    const companyName = job.company || job.companyName;

    if (!jobId || !jobTitle || !companyName) {
      showToast("Invalid job data", "error");
      return;
    }

    // Check if already applied
    const alreadyApplied = appliedJobs.some(
      (appliedJob) => appliedJob.jobId?.toString() === jobId.toString()
    );

    if (alreadyApplied) {
      showToast("You have already applied to this job", "error");
      return;
    }

    // Optimistic UI update
    const matchPercentage = job.similarityScore
      ? parseFloat((job.similarityScore * 100).toFixed(1))
      : 0;

    const newAppliedJob = {
      jobId: jobId,
      company: companyName,
      jobRole: jobTitle,
      match_percentage: matchPercentage,
      status: "Applied",
      appliedAt: new Date(),
    };

    setAppliedJobs([newAppliedJob, ...appliedJobs]);
    showToast(`Successfully applied to ${companyName}!`, "success");

    try {
      const response = await applyToJob({
        jobId: jobId,
        company: companyName,
        jobRole: jobTitle,
        match_percentage: matchPercentage,
      });

      if (response.success) {
        setAppliedJobs(response.appliedJobs);
      }
    } catch (err) {
      console.error("Error applying to job:", err);

      // Rollback on error
      setAppliedJobs(
        appliedJobs.filter((j) => j.jobId?.toString() !== jobId.toString())
      );

      if (err.response && err.response.status === 409) {
        showToast("You have already applied to this job", "error");
      } else {
        const errorMsg =
          err.response?.data?.message || "Failed to apply. Please try again.";
        showToast(errorMsg, "error");
      }
    }
  };

  const isJobApplied = (jobId) => {
    if (!jobId) return false;
    return appliedJobs.some(
      (appliedJob) => appliedJob.jobId?.toString() === jobId.toString()
    );
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
      <nav className="bg-white bg-opacity-80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-700 bg-clip-text text-transparent">
                Vectora
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <GoogleTranslate />
              {user && (
                <div className="hidden md:flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full">
                  <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user.name && user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 font-medium text-sm">
                    {user.name}
                  </span>
                </div>
              )}
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-700 hover:text-sky-600 font-medium transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="text-gray-700 hover:text-sky-600 font-medium transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="hidden sm:inline">Profile</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-sky-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-sky-700 via-blue-700 to-indigo-800 relative overflow-hidden">
        <ParticlesBackground id="jobs-hero-particles" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <div className="text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-white border-opacity-30">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="#ffffff"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isPersonalized
                ? "Your Personalized Matches"
                : "Job Recommendations"}
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
              {loading
                ? "Loading opportunities..."
                : isPersonalized
                  ? `${jobs.length} AI-matched jobs tailored to your unique profile`
                  : `Explore ${jobs.length} exciting career opportunities`}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {!isPersonalized && (
                <button
                  className="group bg-white text-sky-700 py-4 px-10 rounded-2xl font-bold text-lg hover:bg-sky-50 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:-translate-y-1 hover:scale-105 min-w-[280px]"
                  onClick={handleGetRecommendations}
                  disabled={loading}
                >
                  <svg
                    className="w-7 h-7 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="#0284c7"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  {loading ? "Loading..." : "Get AI Recommendations"}
                </button>
              )}

              {isPersonalized && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    className="group bg-white text-sky-700 py-3 px-8 rounded-xl font-semibold hover:bg-sky-50 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                    onClick={handleGetRecommendations}
                    disabled={loading}
                  >
                    <svg
                      className="w-5 h-5 group-hover:rotate-180 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Refresh Matches
                  </button>
                  <button
                    className="group bg-white/20 backdrop-blur-lg text-white border-2 border-white/30 py-3 px-8 rounded-xl font-semibold hover:bg-white/30 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                    onClick={handleShowAllJobs}
                    disabled={loading}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    View All Jobs
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isPersonalized && recommendationMetadata && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur-lg rounded-xl flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="#ffffff"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">
                  AI-Powered Smart Matching
                </h3>
                <p className="text-blue-100 text-sm">
                  Jobs ranked by similarity to your resume using advanced cosine
                  similarity analysis with{" "}
                  {recommendationMetadata.embeddingDimension}-dimensional
                  embeddings. Analyzed{" "}
                  {recommendationMetadata.totalJobsAnalyzed} jobs to find your
                  best matches.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex gap-6">
          {/* Left side - Job Recommendations (70%) */}
          <div className="flex-1" style={{ width: "70%" }}>
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {isPersonalized && (
                      <svg
                        className="w-7 h-7 text-sky-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                    )}
                    {isPersonalized
                      ? "Your Top Matches"
                      : "Available Opportunities"}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {isPersonalized
                      ? "Sorted by relevance to your profile"
                      : "Browse all available positions"}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-sky-200 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 text-sky-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sky-900 text-lg mb-1">
                      Unable to Load Recommendations
                    </h3>
                    <p className="text-sky-800 mb-3">{error}</p>
                    {error.includes("resume") && (
                      <button
                        onClick={() => navigate("/add-embeddings")}
                        className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-sky-700 hover:to-indigo-800 transition-all shadow-md inline-flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        Upload Resume
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col justify-center items-center h-64">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-sky-600 absolute top-0"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">
                  Finding perfect matches...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {jobs.map((job, index) => (
                  <div
                    key={job.id || job.jobId}
                    className="group bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-2xl hover:border-sky-300 transition-all duration-300 flex flex-col cursor-pointer overflow-hidden transform hover:-translate-y-1"
                    onClick={() => handleJobClick(job)}
                  >
                    <div
                      className={`h-1.5 ${isPersonalized && index < 3
                        ? index === 0
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                          : index === 1
                            ? "bg-gradient-to-r from-gray-400 to-gray-600"
                            : "bg-gradient-to-r from-orange-400 to-orange-600"
                        : "bg-gradient-to-r from-sky-400 to-indigo-600"
                        }`}
                    ></div>

                    <div className="p-6 flex flex-col flex-1">
                      {isPersonalized && job.similarityScore !== undefined && (
                        <div className="mb-4">
                          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {(job.similarityScore * 100).toFixed(1)}% Match
                          </div>
                        </div>
                      )}

                      {isPersonalized && index < 3 && (
                        <div className="mb-2">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white shadow-md ${index === 0
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                              : index === 1
                                ? "bg-gradient-to-r from-gray-400 to-gray-600"
                                : "bg-gradient-to-r from-orange-400 to-orange-600"
                              }`}
                          >
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Top #{index + 1}
                          </span>
                        </div>
                      )}

                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-sky-700 transition-colors">
                          {job.title || job.jobTitle}
                        </h3>
                        <p className="text-sky-700 font-semibold mb-2 flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          {job.company}
                        </p>
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <svg
                            className="w-4 h-4 mr-1.5"
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
                        <div className="flex items-center gap-2 text-sm">
                          <span className="bg-sky-50 text-sky-700 px-3 py-1 rounded-full font-medium">
                            {job.type}
                          </span>
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                            {job.experience}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4 flex-1">
                        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                          {job.description}
                        </p>
                      </div>

                      <div className="mb-4">
                        <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {job.salary}
                        </p>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                          Required Skills:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {job.skills && job.skills.length > 0 ? (
                            job.skills.slice(0, 5).map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="bg-gradient-to-r from-sky-50 to-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-lg font-medium border border-indigo-200"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500 px-2 py-1 italic">
                              No skills listed
                            </span>
                          )}
                          {job.skills && job.skills.length > 5 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{job.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleApplyToJob(e, job)}
                        disabled={isJobApplied(job.id || job._id || job.jobId)}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all shadow-md group-hover:shadow-lg flex items-center justify-center gap-2 ${isJobApplied(job.id || job._id || job.jobId)
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-gradient-to-r from-sky-600 to-indigo-700 text-white hover:from-sky-700 hover:to-indigo-800"
                          }`}
                      >
                        {isJobApplied(job.id) ? (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Applied
                          </>
                        ) : (
                          <>
                            Apply Now
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                              />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right side - Applied Jobs Panel (30%) */}
          <div className="w-full lg:w-[30%] lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Applied Jobs
                  </h3>
                  <span className="bg-white bg-opacity-20 backdrop-blur-lg text-white px-3 py-1 rounded-full text-sm font-bold">
                    {appliedJobs.length}
                  </span>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {appliedJobs.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
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
                    </div>
                    <p className="text-gray-600 font-medium mb-1">
                      No applications yet
                    </p>
                    <p className="text-sm text-gray-500">
                      Start applying to jobs to see them here
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {appliedJobs.map((appliedJob, index) => (
                      <div
                        key={index}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">
                              {appliedJob.jobRole}
                            </h4>
                            <p className="text-sm text-sky-700 font-semibold flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              {appliedJob.company}
                            </p>
                          </div>
                          {appliedJob.match_percentage > 0 && (
                            <div className="ml-2">
                              <span className="inline-flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                                <svg
                                  className="w-3 h-3 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {appliedJob.match_percentage}%
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {appliedJob.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(appliedJob.appliedAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
          <div
            className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${toast.type === "success"
              ? "bg-gradient-to-r from-green-600 to-emerald-600"
              : "bg-gradient-to-r from-sky-600 to-indigo-700"
              } text-white`}
          >
            {toast.type === "success" ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <p className="font-semibold">{toast.message}</p>
          </div>
        </div>
      )}

      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-screen overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-sky-600 to-indigo-800 px-8 py-6 relative">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl"></div>
              </div>
              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {selectedJob.title || selectedJob.jobTitle}
                    </h3>
                    <p className="text-blue-100 font-semibold text-lg flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {selectedJob.company}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-lg rounded-xl flex items-center justify-center transition-all ml-4"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {isPersonalized &&
                  selectedJob.similarityScore !== undefined && (
                    <div className="inline-block">
                      <div className="bg-white bg-opacity-20 backdrop-blur-lg text-white px-5 py-2.5 rounded-full font-bold shadow-lg border-2 border-white border-opacity-30 flex items-center gap-2">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {(selectedJob.similarityScore * 100).toFixed(1)}% Match
                        with Your Resume
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div
              className="overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 200px)" }}
            >
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-sky-700"
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
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">
                        Location
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {selectedJob.location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-blue-600"
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
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">
                        Job Type
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {selectedJob.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-orange-600"
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
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">
                        Experience
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {selectedJob.experience}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-green-700 font-medium">
                        Salary
                      </p>
                      <p className="text-green-700 font-bold text-lg">
                        {selectedJob.salary}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-sky-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">
                      Job Description
                    </h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-5">
                    {selectedJob.description}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-sky-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">
                      Required Skills
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills && selectedJob.skills.length > 0 ? (
                      selectedJob.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-sky-50 to-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-medium border border-indigo-200"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">
                        No skills listed for this position
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={(e) => {
                      handleApplyToJob(e, selectedJob);
                      closeModal();
                    }}
                    disabled={isJobApplied(
                      selectedJob.id || selectedJob._id || selectedJob.jobId
                    )}
                    className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${isJobApplied(
                      selectedJob.id || selectedJob._id || selectedJob.jobId
                    )
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-sky-600 to-indigo-700 text-white hover:from-sky-700 hover:to-indigo-800"
                      }`}
                  >
                    {isJobApplied(selectedJob.id) ? (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Applied
                      </>
                    ) : (
                      <>
                        Apply Now
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-gray-100 text-gray-800 py-4 px-6 rounded-xl font-bold hover:bg-gray-200 transition-all border-2 border-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobRecommendations;
