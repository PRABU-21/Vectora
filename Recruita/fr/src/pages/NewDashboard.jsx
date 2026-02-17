import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJob, getMyJobs } from "../data/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newJob, setNewJob] = useState({
    title: "",
    location: "",
    description: "",
    skills: "",
    minExperience: "",
    durationMonths: 2,
  });
  const [showProfile, setShowProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (userData) setUser(JSON.parse(userData));
    fetchJobs();
  }, [navigate]);

  const fetchJobs = async () => {
    try {
      const response = await getMyJobs();
      if (response.success) {
        setJobs(response.jobs || []);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const stats = {
    openRoles: jobs.filter((j) => j.status === "open").length,
    totalApplications: jobs.reduce((sum, j) => sum + (j.totalApplications || 0), 0),
    pendingReview: jobs.reduce((sum, j) => sum + (j.pendingCount || 0), 0),
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const addJob = async (e) => {
    e.preventDefault();
    if (!newJob.title.trim() || !newJob.description.trim()) return;

    setSubmitting(true);
    try {
      const jobData = {
        title: newJob.title.trim(),
        location: newJob.location.trim() || "Remote",
        description: newJob.description.trim(),
        skills: newJob.skills
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean),
        minExperience: newJob.minExperience ? parseInt(newJob.minExperience) : 0,
        durationMonths: parseInt(newJob.durationMonths) || 2,
      };

      const response = await createJob(jobData);
      if (response.success) {
        setNewJob({
          title: "",
          location: "",
          description: "",
          skills: "",
          minExperience: "",
          durationMonths: 2,
        });
        fetchJobs(); // Refresh the job list
      }
    } catch (error) {
      console.error("Failed to create job:", error);
      alert(error.response?.data?.message || "Failed to post job");
    } finally {
      setSubmitting(false);
    }
  };

  const viewJobApplicants = (jobId) => {
    navigate(`/job/${jobId}`);
  };

  return (
    <div className="min-h-screen bg-black text-slate-100">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-pink-200 to-green-300 flex items-center justify-center font-bold text-xl shadow-lg">
              <span className="text-black">R</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-green-300 font-semibold">
                Recruita
              </p>
              <p className="text-xl font-bold text-pink-200">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-pink-200/20">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-pink-200 to-green-300 flex items-center justify-center font-bold text-sm text-black">
                  {user.name?.charAt(0)?.toUpperCase() || "R"}
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-white">{user.name}</div>
                  <div className="text-slate-400 text-xs">
                    {user.company || "Recruiter"}
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowProfile((v) => !v)}
              className="px-4 py-2 rounded-lg border border-green-300/30 text-green-300 hover:bg-green-300/10 hover:border-green-300 transition-colors"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-2 rounded-lg bg-linear-to-r from-pink-200 to-pink-300 text-black font-bold hover:from-pink-300 hover:to-pink-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
        {showProfile && user && (
          <div className="max-w-7xl mx-auto px-6 pb-4">
            <div className="rounded-lg border border-pink-200/20 bg-zinc-900/40 p-4 flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-slate-400">Name:</span>{" "}
                <span className="text-white font-medium">{user.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Email:</span>{" "}
                <span className="text-white font-medium">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-400">Company:</span>{" "}
                <span className="text-white font-medium">
                  {user.company || "—"}
                </span>
              </div>
              <div className="ml-auto text-green-300 font-semibold">
                Recruiter
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Hero Section */}
        <section className="p-8 rounded-2xl border border-pink-200/20 bg-zinc-900/60 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-green-300 font-semibold uppercase tracking-widest">
                Talent Hub
              </p>
              <h1 className="text-5xl font-bold text-pink-200 mt-2">
                Welcome, {user?.name?.split(" ")[0] || "Recruiter"}
              </h1>
              <p className="text-slate-300 mt-3 max-w-2xl text-lg">
                AI-powered candidate matching at your fingertips. Post roles, get automatic scoring, discover perfect fits.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 rounded-xl border border-pink-200/20 bg-zinc-900/60 shadow-lg hover:border-pink-200/40 transition-colors">
            <p className="text-sm text-slate-400 font-medium">Open Roles</p>
            <p className="text-5xl font-bold text-pink-200 mt-3">
              {stats.openRoles}
            </p>
            <p className="text-xs text-slate-500 mt-2">Active job postings</p>
          </div>
          <div className="p-6 rounded-xl border border-green-300/20 bg-zinc-900/60 shadow-lg hover:border-green-300/40 transition-colors">
            <p className="text-sm text-slate-400 font-medium">
              Total Applications
            </p>
            <p className="text-5xl font-bold text-green-300 mt-3">
              {stats.totalApplications}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Candidates applied
            </p>
          </div>
          <div className="p-6 rounded-xl border border-pink-300/20 bg-zinc-900/60 shadow-lg hover:border-pink-300/40 transition-colors">
            <p className="text-sm text-slate-400 font-medium">
              Pending Review
            </p>
            <p className="text-5xl font-bold text-pink-300 mt-3">
              {stats.pendingReview}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Awaiting selection
            </p>
          </div>
        </section>

        {/* Job Management Section */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Posted Roles */}
          <div className="p-6 rounded-xl border border-pink-200/20 bg-zinc-900/60 shadow-lg lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-green-300 font-semibold uppercase tracking-widest">
                  Posted Roles
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  Your Active Openings
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-200/20 text-pink-200 border border-pink-200/40">
                {jobs.length} Total
              </span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400">
                <p>Loading jobs...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job._id}
                    className="p-5 rounded-xl border border-zinc-800 bg-black/40 hover:bg-zinc-900/60 hover:border-pink-200/30 transition-colors cursor-pointer group"
                    onClick={() => viewJobApplicants(job._id)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500">
                            {job.location}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-500">
                            Posted {formatDate(job.createdAt)}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-white group-hover:text-pink-200 transition-colors">
                          {job.title}
                        </h4>
                        {job.company && (
                          <p className="text-sm text-slate-400 mt-1">
                            {job.company}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          job.status === "open"
                            ? "bg-pink-200/20 text-pink-200 border border-pink-200/40"
                            : "bg-zinc-700/20 text-zinc-400 border border-zinc-700/40"
                        }`}
                      >
                        {job.status === "open" ? "Open" : "Closed"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-green-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-slate-300">
                          Closes: {formatDate(job.deadline)}
                        </span>
                      </div>
                      <span className="text-slate-600">•</span>
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-pink-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <span className="text-slate-300">
                          {job.totalApplications || 0} applications
                        </span>
                      </div>
                      {job.pendingCount > 0 && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-pink-300 font-semibold">
                            {job.pendingCount} pending
                          </span>
                        </>
                      )}
                      {job.selectedCount > 0 && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-emerald-400 font-semibold">
                            {job.selectedCount} selected
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-sm text-slate-400 line-clamp-2">
                      {job.description}
                    </div>
                  </div>
                ))}

                {jobs.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-lg">No jobs posted yet</p>
                    <p className="text-sm mt-2">
                      Use the form to create your first job posting
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Post New Job Form */}
          <div className="p-6 rounded-xl border border-green-300/20 bg-zinc-900/60 shadow-lg overflow-y-auto max-h-[calc(100vh-12rem)]">
            <div className="mb-6">
              <p className="text-sm text-green-300 font-semibold uppercase tracking-widest">
                New Opening
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                Post a Role
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Applications will be automatically scored against this JD
              </p>
            </div>
            <form className="space-y-4" onSubmit={addJob}>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-2">
                  Job Title *
                </label>
                <input
                  value={newJob.title}
                  onChange={(e) =>
                    setNewJob({ ...newJob, title: e.target.value })
                  }
                  className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                  placeholder="e.g., Senior Data Scientist"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-2">
                  Location
                </label>
                <input
                  value={newJob.location}
                  onChange={(e) =>
                    setNewJob({ ...newJob, location: e.target.value })
                  }
                  className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                  placeholder="Remote / City"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-2">
                  Job Description *
                </label>
                <textarea
                  value={newJob.description}
                  onChange={(e) =>
                    setNewJob({ ...newJob, description: e.target.value })
                  }
                  rows={5}
                  className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none resize-none"
                  placeholder="Describe the role, responsibilities, and requirements..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-2">
                  Required Skills (comma-separated)
                </label>
                <input
                  value={newJob.skills}
                  onChange={(e) =>
                    setNewJob({ ...newJob, skills: e.target.value })
                  }
                  className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                  placeholder="e.g., Python, React, AWS"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-2">
                    Minimum Years Experience
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newJob.minExperience}
                    onChange={(e) =>
                      setNewJob({ ...newJob, minExperience: e.target.value })
                    }
                    className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                    placeholder="e.g., 3 (for 3+ years)"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Candidates with this or more years will score higher
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 font-medium mb-2">
                    Open Duration (months)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newJob.durationMonths}
                    onChange={(e) =>
                      setNewJob({
                        ...newJob,
                        durationMonths: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Job will auto-close after this period
                  </p>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg bg-linear-to-r from-green-300 to-emerald-400 text-black font-bold hover:from-green-400 hover:to-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Posting..." : "Post Job"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
