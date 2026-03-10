import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { recruiterGetJobs, recruiterCloseJob, recruiterGetMatches } from "../data/api";
import ParticlesBackground from "../components/ParticlesBackground";
import GoogleTranslate from "../components/GoogleTranslate";

const PostedJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [matches, setMatches] = useState({});
  const [expandedJob, setExpandedJob] = useState(null);
  const [filters, setFilters] = useState({ location: "", minExp: "", maxExp: "", education: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user || JSON.parse(user)?.role !== "recruiter") {
      navigate("/login");
      return;
    }
    loadJobs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadJobs = async () => {
    try {
      setLoading(true);
      const resp = await recruiterGetJobs();
      setJobs(resp?.jobs || resp || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load posted jobs");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleClose = async (jobId) => {
    try {
      await recruiterCloseJob(jobId);
      showToast("Job closed");
      loadJobs();
    } catch (err) {
      console.error(err);
      showToast(err?.response?.data?.message || "Failed to close job", "error");
    }
  };

  const handleViewMatches = async (jobId) => {
    const existing = matches[jobId];
    if (expandedJob === jobId) {
      setExpandedJob(null);
      return;
    }
    setExpandedJob(jobId);
    if (existing && existing.data?.length) return;
    setMatches((prev) => ({ ...prev, [jobId]: { ...(prev[jobId] || {}), loading: true, error: null } }));
    try {
      const resp = await recruiterGetMatches(jobId);
      setMatches((prev) => ({ ...prev, [jobId]: { data: resp?.results || [], job: resp?.job, loading: false, error: null } }));
    } catch (err) {
      console.error(err);
      setMatches((prev) => ({ ...prev, [jobId]: { data: [], loading: false, error: err?.response?.data?.message || "Failed to load matches" } }));
    }
  };

  const parsedJobs = useMemo(() => {
    return (jobs || []).map((j) => {
      const base = j.job ? { ...j.job, ...j } : { ...j };
      const counts = {
        total: base.totalApplications ?? base.counts?.total ?? 0,
        pending: base.pendingCount ?? base.counts?.pending ?? 0,
        selected: base.selectedCount ?? base.counts?.selected ?? 0,
      };
      return {
        ...base,
        title: base.title || base.jobRoleName,
        companyName: base.company || base.companyName,
        counts,
      };
    });
  }, [jobs]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const applyFilters = (candidates) => {
    const locTerm = filters.location.trim().toLowerCase();
    const minExp = filters.minExp === "" ? null : Number(filters.minExp);
    const maxExp = filters.maxExp === "" ? null : Number(filters.maxExp);
    return (candidates || []).filter((c) => {
      const exp = c.totalExperience ?? c.yearsExperience ?? 0;
      if (minExp !== null && exp < minExp) return false;
      if (maxExp !== null && exp > maxExp) return false;
      if (filters.education && c.highestEducation && c.highestEducation !== filters.education) return false;
      if (locTerm) {
        const locParts = [c.location?.city, c.location?.state, c.location?.country].filter(Boolean).join(" ").toLowerCase();
        if (!locParts.includes(locTerm)) return false;
      }
      return true;
    });
  };

  const renderMatches = (jobId) => {
    const entry = matches[jobId] || {};
    if (entry.loading) {
      return <div className="text-sm text-gray-600">Loading matches...</div>;
    }
    if (entry.error) {
      return <div className="text-sm text-red-600">{entry.error}</div>;
    }
    const filtered = applyFilters(entry.data).sort((a, b) => (b.score || 0) - (a.score || 0));
    if (!filtered.length) {
      return <div className="text-sm text-gray-600">No matches found with current filters.</div>;
    }
    return (
      <div className="space-y-3">
        {filtered.map((c, idx) => {
          const locationText = [c.location?.city, c.location?.state, c.location?.country].filter(Boolean).join(", ") || "-";
          const exp = c.totalExperience ?? c.yearsExperience ?? 0;
          const matchPercent = Math.min(100, Math.max(0, (c.score || 0) * 100));
          return (
            <div key={c.applicationId} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-semibold flex items-center justify-center">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.candidate}</p>
                    <p className="text-xs text-gray-600">{c.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Match</p>
                  <p className="text-lg font-semibold text-indigo-700">{matchPercent.toFixed(1)}%</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-800">{exp} yrs exp</span>
                  {c.highestEducation && <span className="px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-800">{c.highestEducation}</span>}
                </div>
                <div className="text-right text-gray-600">{locationText}</div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {(c.skills || []).slice(0, 6).map((s) => (
                  <span key={s} className="px-2 py-1 rounded-full bg-white border border-sky-100 text-sky-700">{s}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-700 bg-clip-text text-transparent">
                Posted Jobs
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <GoogleTranslate />
              <button
                onClick={() => navigate("/recruiter/jobs")}
                className="text-gray-700 hover:text-sky-700 font-medium transition-colors"
              >
                Recruiter Home
              </button>
              <button
                onClick={() => navigate("/recruiter/profile")}
                className="text-gray-700 hover:text-sky-700 font-medium transition-colors"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-sky-500 via-indigo-600 to-blue-700 relative overflow-hidden">
        <ParticlesBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-3">Your posted roles</h2>
            <p className="text-blue-100 text-lg">Overview of every job you have published, with quick actions.</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Location</label>
            <input
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="City, state, or country"
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Min experience (yrs)</label>
            <input
              type="number"
              min="0"
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-32"
              value={filters.minExp}
              onChange={(e) => setFilters((f) => ({ ...f, minExp: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Max experience (yrs)</label>
            <input
              type="number"
              min="0"
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-32"
              value={filters.maxExp}
              onChange={(e) => setFilters((f) => ({ ...f, maxExp: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Education</label>
            <select
              className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-36"
              value={filters.education}
              onChange={(e) => setFilters((f) => ({ ...f, education: e.target.value }))}
            >
              <option value="">Any</option>
              <option value="Diploma">Diploma</option>
              <option value="UG">UG</option>
              <option value="PG">PG</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
        </div>

        {toast && (
          <div
            className={`rounded-xl px-4 py-3 shadow-md text-sm ${toast.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
          >
            {toast.message}
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

        {loading ? (
          <div className="flex items-center gap-3 text-gray-700">
            <div className="animate-spin h-5 w-5 border-2 border-sky-200 border-t-sky-600 rounded-full" />
            Loading posted jobs...
          </div>
        ) : parsedJobs.length === 0 ? (
          <div className="text-gray-600">No posted jobs yet. Create one from Recruiter Home.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {parsedJobs.map((job) => (
              <div key={job._id || job.id} className="border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition bg-white p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{job.companyName || "Company"}</p>
                    <h4 className="text-lg font-semibold text-gray-900 leading-tight">{job.title}</h4>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1 1 0 01-1.414 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.location || "Remote"}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                    job.status === "open"
                      ? "bg-green-50 text-green-700 border-green-100"
                      : job.status === "closed"
                        ? "bg-gray-100 text-gray-700 border-gray-200"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                  }`}>
                    {job.status || "open"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(job.deadline)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 17l-4 4m0 0l-4-4m4 4V3" />
                    </svg>
                    <span>{job.counts.total || 0} apps</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                  {(job.skills || []).slice(0, 4).map((skill) => (
                    <span key={skill} className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 text-xs border border-sky-100">
                      {skill}
                    </span>
                  ))}
                  {Array.isArray(job.skills) && job.skills.length > 4 && (
                    <span className="text-xs text-gray-500">+{job.skills.length - 4} more</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  <button
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100"
                    onClick={() => navigate(`/recruiter/jobs/${job._id || job.id}/applicants`)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Applicants
                  </button>
                  <button
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100"
                    onClick={() => handleViewMatches(job._id || job.id)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m4 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {expandedJob === (job._id || job.id) ? "Hide matches" : "View matches"}
                  </button>
                  {job.status === "open" && (
                    <button
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-amber-50 text-amber-800 border border-amber-100 hover:bg-amber-100"
                      onClick={() => handleClose(job._id || job.id)}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
                      </svg>
                      Close
                    </button>
                  )}
                </div>

                {expandedJob === (job._id || job.id) && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Ranked matches</p>
                    {renderMatches(job._id || job.id)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PostedJobs;
