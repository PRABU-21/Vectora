import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { shortlist } from "../data/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState(() => {
    const now = Date.now();
    const makeDate = (months) => new Date(now + months * 30 * 24 * 60 * 60 * 1000).toISOString();
    return [
      {
        id: "job-1",
        title: "Senior Full Stack Developer",
        location: "Remote",
        status: "open",
        closeDate: makeDate(3),
        createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
        shortlists: [],
      },
      {
        id: "job-2",
        title: "DevOps Engineer",
        location: "San Francisco, CA",
        status: "open",
        closeDate: makeDate(2),
        createdAt: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
        shortlists: [],
      },
    ];
  });
  const [newJob, setNewJob] = useState({ title: "", location: "", jobDescription: "", skills: "", experience: "", duration: 3 });
  const [showProfile, setShowProfile] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalView, setModalView] = useState("form"); // "form" | "results"
  const [shortlistForm, setShortlistForm] = useState({ jobDescription: "", skills: "", topN: 5 });
  const [shortlistResults, setShortlistResults] = useState([]);
  const [loadingShortlist, setLoadingShortlist] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token) {
      navigate("/login");
      return;
    }

    if (userData) setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const stats = {
    openRoles: jobs.filter((j) => j.status === "open").length,
    totalShortlists: jobs.reduce((sum, j) => sum + (j.shortlists?.length || 0), 0),
    avgMatch: jobs.flatMap(j => j.shortlists || []).length > 0
      ? Math.round(jobs.flatMap(j => j.shortlists || []).reduce((sum, s) => sum + (s.score || 0), 0) / jobs.flatMap(j => j.shortlists || []).length * 100)
      : 0,
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString();

  const addJob = (e) => {
    e.preventDefault();
    if (!newJob.title.trim() || !newJob.jobDescription.trim()) return;
    const now = Date.now();
    const closeDate = new Date(now + Number(newJob.duration || 3) * 30 * 24 * 60 * 60 * 1000).toISOString();
    const job = {
      id: `job-${Date.now()}`,
      title: newJob.title.trim(),
      location: newJob.location.trim() || "Remote",
      jobDescription: newJob.jobDescription.trim(),
      skills: newJob.skills.trim(),
      experience: newJob.experience.trim(),
      status: "open",
      closeDate,
      createdAt: new Date(now).toISOString(),
      shortlists: [],
    };
    setJobs((prev) => [job, ...prev]);
    setNewJob({ title: "", location: "", jobDescription: "", skills: "", experience: "", duration: 3 });
  };

  const extendJob = (id, months = 1) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === id
          ? {
              ...job,
              closeDate: new Date(new Date(job.closeDate).getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString(),
            }
          : job
      )
    );
  };

  const updateStatus = (id, status) => {
    setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, status } : job)));
  };

  const openShortlistModal = (job) => {
    setSelectedJob(job);
    if (job.shortlists && job.shortlists.length > 0) {
      setShortlistResults(job.shortlists);
      setModalView("results");
    } else {
      setShortlistForm({ 
        jobDescription: job.jobDescription || "", 
        skills: job.skills || "", 
        topN: 5 
      });
      setShortlistResults([]);
      setModalView("form");
    }
  };

  const closeModal = () => {
    setSelectedJob(null);
    setShortlistResults([]);
    setModalView("form");
  };

  const runShortlist = async (e) => {
    e.preventDefault();
    if (!shortlistForm.jobDescription.trim()) return;

    setLoadingShortlist(true);
    try {
      const response = await shortlist({
        jobDescription: shortlistForm.jobDescription,
        skills: shortlistForm.skills.split(",").map(s => s.trim()).filter(Boolean),
        topN: parseInt(shortlistForm.topN) || 5,
      });

      if (response.success) {
        const results = response.results || [];
        setShortlistResults(results);
        setJobs((prev) =>
          prev.map((job) =>
            job.id === selectedJob.id
              ? { ...job, shortlists: results }
              : job
          )
        );
        setModalView("results");
      }
    } catch (error) {
      console.error("Shortlist error:", error);
    } finally {
      setLoadingShortlist(false);
    }
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
              <p className="text-xs uppercase tracking-[0.3em] text-green-300 font-semibold">Recruita</p>
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
                  <div className="text-slate-400 text-xs">{user.company || "Recruiter"}</div>
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
              <div><span className="text-slate-400">Name:</span> <span className="text-white font-medium">{user.name}</span></div>
              <div><span className="text-slate-400">Email:</span> <span className="text-white font-medium">{user.email}</span></div>
              <div><span className="text-slate-400">Company:</span> <span className="text-white font-medium">{user.company || "—"}</span></div>
              <div className="ml-auto text-green-300 font-semibold">Recruiter</div>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Hero Section */}
        <section className="p-8 rounded-2xl border border-pink-200/20 bg-zinc-900/60 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-green-300 font-semibold uppercase tracking-widest">Talent Hub</p>
              <h1 className="text-5xl font-bold text-pink-200 mt-2">
                Welcome, {user?.name?.split(" ")[0] || "Recruiter"}
              </h1>
              <p className="text-slate-300 mt-3 max-w-2xl text-lg">
                AI-powered candidate matching at your fingertips. Post roles, run smart shortlists, discover perfect fits.
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
            <p className="text-sm text-slate-400 font-medium">Shortlists Run</p>
            <p className="text-5xl font-bold text-green-300 mt-3">
              {stats.totalShortlists}
            </p>
            <p className="text-xs text-slate-500 mt-2">Candidates evaluated</p>
          </div>
          <div className="p-6 rounded-xl border border-pink-300/20 bg-zinc-900/60 shadow-lg hover:border-pink-300/40 transition-colors">
            <p className="text-sm text-slate-400 font-medium">Avg. Match Score</p>
            <p className="text-5xl font-bold text-pink-300 mt-3">
              {stats.avgMatch}%
            </p>
            <p className="text-xs text-slate-500 mt-2">Quality indicator</p>
          </div>
        </section>

        {/* Job Management Section */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Posted Roles */}
          <div className="p-6 rounded-xl border border-pink-200/20 bg-zinc-900/60 shadow-lg lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-green-300 font-semibold uppercase tracking-widest">Posted Roles</p>
                <h3 className="text-2xl font-bold text-white mt-1">Your Active Openings</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-200/20 text-pink-200 border border-pink-200/40">
                {jobs.length} Total
              </span>
            </div>

            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 rounded-xl border border-zinc-800 bg-black/40 hover:bg-zinc-900/60 hover:border-pink-200/30 transition-colors cursor-pointer group"
                  onClick={() => openShortlistModal(job)}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500">{job.location}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-slate-500">Posted {formatDate(job.createdAt)}</span>
                      </div>
                      <h4 className="text-xl font-bold text-white group-hover:text-pink-200 transition-colors">
                        {job.title}
                      </h4>
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
                      <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-slate-300">Closes: {formatDate(job.closeDate)}</span>
                    </div>
                    <span className="text-slate-600">•</span>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-pink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-slate-300">{job.shortlists?.length || 0} candidates shortlisted</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                    {job.status === "open" ? (
                      <>
                        <button
                          onClick={() => extendJob(job.id, 1)}
                          className="px-4 py-2 rounded-lg border border-green-300/50 text-green-300 text-sm font-semibold hover:bg-green-300/10 transition-colors"
                        >
                          +1 Month
                        </button>
                        <button
                          onClick={() => updateStatus(job.id, "closed")}
                          className="px-4 py-2 rounded-lg border border-zinc-600/50 text-zinc-400 text-sm font-semibold hover:bg-zinc-600/10 transition-colors"
                        >
                          Close Role
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => updateStatus(job.id, "open")}
                        className="px-4 py-2 rounded-lg border border-pink-200/50 text-pink-200 text-sm font-semibold hover:bg-pink-200/10 transition-colors"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {jobs.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-lg">No jobs posted yet</p>
                  <p className="text-sm mt-2">Use the form to create your first job posting</p>
                </div>
              )}
            </div>
          </div>

          {/* Post New Job Form */}
          <div className="p-6 rounded-xl border border-green-300/20 bg-zinc-900/60 shadow-lg overflow-y-auto max-h-[calc(100vh-12rem)]">
            <div className="mb-6">
              <p className="text-sm text-green-300 font-semibold uppercase tracking-widest">New Opening</p>
              <h3 className="text-2xl font-bold text-white mt-1">Post a Role</h3>
            </div>
            <form className="space-y-4" onSubmit={addJob}>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-2">Job Title</label>
                <input
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                  placeholder="e.g., Senior Data Scientist"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-2">Location</label>
                <input
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                  placeholder="Remote / City"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-2">Job Description</label>
                <textarea
                  value={newJob.jobDescription}
                  onChange={(e) => setNewJob({ ...newJob, jobDescription: e.target.value })}
                  rows={5}
                  className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none resize-none"
                  placeholder="Describe the role, responsibilities, and requirements..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-2">Required Skills (comma-separated)</label>
                <input
                  value={newJob.skills}
                  onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                  className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                  placeholder="e.g., Python, React, AWS, Machine Learning"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-2">Experience Required</label>
                <input
                  value={newJob.experience}
                  onChange={(e) => setNewJob({ ...newJob, experience: e.target.value })}
                  className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                  placeholder="e.g., 5+ years, 3-5 years, Entry level"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 font-medium mb-2">Open Duration (months)</label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={newJob.duration}
                  onChange={(e) => setNewJob({ ...newJob, duration: Number(e.target.value) })}
                  className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-linear-to-r from-green-300 to-emerald-400 text-black font-bold hover:from-green-400 hover:to-emerald-500 transition-colors"
              >
                Post Job
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Shortlist Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-emerald-900/30 bg-slate-950/80 shadow-2xl shadow-emerald-950/30">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-950/80 p-6 border-b border-emerald-900/20 flex items-center justify-between z-10 backdrop-blur-xl">
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-200 font-semibold">Shortlist Workspace</p>
                <h2 className="text-3xl font-bold text-white mt-1">{selectedJob.title}</h2>
                <p className="text-sm text-slate-400 mt-1">{selectedJob.location}</p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {modalView === "form" && (
                <form onSubmit={runShortlist} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Job Description</label>
                    <textarea
                      value={shortlistForm.jobDescription}
                      onChange={(e) => setShortlistForm({ ...shortlistForm, jobDescription: e.target.value })}
                      rows={8}
                      className="w-full rounded-lg bg-slate-950 border border-emerald-900/30 text-white px-4 py-3 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20 placeholder-slate-500 transition-colors outline-none resize-none"
                      placeholder="Paste the complete job description here..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Required Skills (comma-separated)</label>
                      <input
                        value={shortlistForm.skills}
                        onChange={(e) => setShortlistForm({ ...shortlistForm, skills: e.target.value })}
                        className="w-full rounded-lg bg-slate-950 border border-emerald-900/30 text-white px-4 py-3 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20 placeholder-slate-500 transition-colors outline-none"
                        placeholder="react, node, python, aws"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Top N Candidates</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={shortlistForm.topN}
                        onChange={(e) => setShortlistForm({ ...shortlistForm, topN: e.target.value })}
                        className="w-full rounded-lg bg-slate-950 border border-emerald-900/30 text-white px-4 py-3 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20 placeholder-slate-500 transition-colors outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingShortlist}
                    className="w-full py-4 rounded-lg bg-emerald-500 text-emerald-950 font-bold text-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingShortlist ? "Running AI Matching..." : "Run Shortlist"}
                  </button>
                </form>
              )}

              {modalView === "results" && shortlistResults.length > 0 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      Top {shortlistResults.length} Candidates
                    </h3>
                    <button
                      onClick={() => {
                        setModalView("form");
                        setShortlistForm({ jobDescription: "", skills: "", topN: 5 });
                        setShortlistResults([]);
                      }}
                      className="px-4 py-2 rounded-lg border border-emerald-900/30 text-emerald-200 text-sm font-semibold hover:bg-emerald-500/10 transition-colors"
                    >
                      Run New Shortlist
                    </button>
                  </div>

                  {shortlistResults.map((candidate, idx) => (
                    <div
                      key={candidate.candidateId}
                      className="p-6 rounded-xl border border-emerald-900/20 bg-slate-950/50 hover:bg-slate-950/70 hover:border-emerald-900/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-pink-200 to-green-300 text-black font-bold text-xl shadow-lg">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-2xl font-bold text-white">{candidate.candidate}</h4>
                            <p className="text-sm text-slate-400 mt-1">{candidate.email}</p>
                            {candidate.yearsExperience && (
                              <p className="text-sm text-green-300 mt-1">{candidate.yearsExperience} years experience</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Match Score</p>
                          <p className="text-4xl font-bold text-emerald-200">
                            {Math.round((candidate.score || 0) * 100)}%
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/10 text-pink-200 border border-pink-500/20">
                          Experience: {candidate.breakdownPercent?.experience || 0}%
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                          Skills: {candidate.breakdownPercent?.skills || 0}%
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-500/10 text-pink-200 border border-pink-500/20">
                          Projects: {candidate.breakdownPercent?.projects || 0}%
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-200 border border-slate-500/20">
                          Profile Fit: {candidate.breakdownPercent?.semantic || 0}%
                        </span>
                      </div>

                      {candidate.explanation && (
                        <p className="text-sm text-slate-300 leading-relaxed mb-4 bg-slate-950/30 p-3 rounded-lg border border-white/5">
                          {candidate.explanation}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {candidate.matchedSkills?.length > 0 && (
                          <div>
                            <p className="text-slate-500 font-medium mb-1">Matched Skills:</p>
                            <p className="text-green-300 font-semibold">{candidate.matchedSkills.join(", ")}</p>
                          </div>
                        )}
                        {candidate.missingSkills?.length > 0 && (
                          <div>
                            <p className="text-slate-500 font-medium mb-1">Missing Skills:</p>
                            <p className="text-pink-300 font-semibold">{candidate.missingSkills.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {modalView === "results" && shortlistResults.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-slate-400 text-lg">No results to display</p>
                  <button
                    onClick={() => setModalView("form")}
                    className="mt-4 px-6 py-3 rounded-lg bg-linear-to-r from-pink-200 to-pink-300 text-black font-bold hover:from-pink-300 hover:to-pink-400 transition-colors"
                  >
                    Run Shortlist
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
