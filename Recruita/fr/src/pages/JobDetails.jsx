import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getJobApplicants, bulkUpdateApplications, closeJob } from "../data/api";

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topN, setTopN] = useState(15);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchApplicants();
  }, [jobId, navigate]);

  const fetchApplicants = async () => {
    try {
      const response = await getJobApplicants(jobId);
      if (response.success) {
        setJob(response.job);
        setApplicants(response.results || []);
      }
    } catch (error) {
      console.error("Failed to fetch applicants:", error);
      if (error.response?.status === 404) {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSelect = async () => {
    if (!topN || topN < 1) {
      alert("Please enter a valid number");
      return;
    }

    if (
      !confirm(
        `This will mark top ${topN} candidates as SELECTED and rest as REJECTED. Continue?`
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const response = await bulkUpdateApplications(jobId, {
        topN: parseInt(topN),
        action: "select",
      });
      if (response.success) {
        alert(response.message);
        fetchApplicants(); // Refresh the list
      }
    } catch (error) {
      console.error("Bulk update failed:", error);
      alert(error.response?.data?.message || "Failed to update applications");
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseJob = async () => {
    if (!confirm("Are you sure you want to close this job?")) {
      return;
    }

    try {
      const response = await closeJob(jobId);
      if (response.success) {
        alert("Job closed successfully");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Close job failed:", error);
      alert(error.response?.data?.message || "Failed to close job");
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "selected":
        return "bg-emerald-500/10 text-emerald-200 border-emerald-500/20";
      case "rejected":
        return "bg-rose-500/10 text-rose-200 border-rose-500/20";
      default:
        return "bg-pink-500/10 text-pink-200 border-pink-500/20";
    }
  };

  const pct = (part, total) => {
    const numerator = Number(part) || 0;
    const denominator = Number(total) || 0;
    if (denominator <= 0) return 0;
    return Math.round((numerator / denominator) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-pink-200 border-t-transparent animate-spin"></div>
          <p className="text-xl text-slate-300">Loading applicants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-emerald-900/20 bg-slate-950/70 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 rounded-lg hover:bg-slate-900/50 text-slate-300 hover:text-white transition-colors"
              >
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300 font-semibold">
                  Job Applicants
                </p>
                <h1 className="text-2xl font-bold text-white">
                  {job?.title || "Loading..."}
                </h1>
                {job && (
                  <p className="text-sm text-slate-400 mt-0.5">
                    {job.company} • {job.status}
                  </p>
                )}
              </div>
            </div>
            {job && job.status === "open" && (
              <button
                onClick={handleCloseJob}
                className="px-4 py-2 rounded-lg border border-rose-500/30 text-rose-200 hover:bg-rose-500/10 transition-colors"
              >
                Close Job
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats & Actions */}
        <div className="mb-8 p-6 rounded-xl border border-emerald-900/20 bg-slate-950/50 shadow-2xl shadow-emerald-950/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <p className="text-sm text-slate-400">Total Applications</p>
              <p className="text-3xl font-bold text-pink-200 mt-1">
                {applicants.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending</p>
              <p className="text-3xl font-bold text-pink-200 mt-1">
                {applicants.filter((a) => a.status === "pending").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Selected</p>
              <p className="text-3xl font-bold text-emerald-300 mt-1">
                {applicants.filter((a) => a.status === "selected").length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Rejected</p>
              <p className="text-3xl font-bold text-rose-200 mt-1">
                {applicants.filter((a) => a.status === "rejected").length}
              </p>
            </div>
          </div>

          {job && job.status === "open" && (
            <div className="border-t border-emerald-900/20 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Bulk Selection
              </h3>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-50">
                  <label className="block text-sm text-slate-300 font-medium mb-2">
                    Select Top N Candidates
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={applicants.length}
                    value={topN}
                    onChange={(e) => setTopN(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-emerald-900/30 text-white px-4 py-3 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20 placeholder-slate-500 transition-colors outline-none"
                    placeholder="15"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Top {topN} will be marked as Selected, rest as Rejected
                  </p>
                </div>
                <button
                  onClick={handleBulkSelect}
                  disabled={processing || applicants.length === 0}
                  className="px-6 py-3 rounded-lg bg-emerald-500 text-emerald-950 font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Processing..." : `Select Top ${topN}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Applicants List */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Candidates (Ranked by Score)
            </h2>
            <p className="text-sm text-slate-400">
              Automatically scored on application
            </p>
          </div>

          {applicants.length === 0 ? (
            <div className="text-center py-16 p-6 rounded-xl border border-emerald-900/20 bg-slate-950/50 shadow-2xl shadow-emerald-950/20">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-xl text-slate-400">No applications yet</p>
              <p className="text-sm text-slate-500 mt-2">
                Candidates will appear here once they apply
              </p>
            </div>
          ) : (
            applicants.map((app, idx) => (
              <div
                key={app.applicationId}
                className="p-6 rounded-xl border border-emerald-900/20 bg-slate-950/50 hover:bg-slate-950/70 hover:border-emerald-400/20 transition-colors shadow-2xl shadow-black/20"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br from-pink-200 to-green-300 text-black font-bold text-2xl shadow-lg shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-bold text-white truncate">
                          {app.candidate}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{app.email}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        {app.yearsExperience !== undefined && (
                          <span className="text-emerald-300">
                            {app.yearsExperience} years exp
                          </span>
                        )}
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">
                          Applied {formatDate(app.appliedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      Match Score
                    </p>
                    <p className="text-5xl font-bold text-pink-200">
                      {Math.round((app.score || 0) * 100)}%
                    </p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-pink-200/20 text-pink-200 border border-pink-200/40">
                    Experience: {pct(app.breakdown?.experience, app.score)}%
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-200 border border-emerald-500/25">
                    Skills: {pct(app.breakdown?.skills, app.score)}%
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-pink-300/20 text-pink-300 border border-pink-300/40">
                    Projects: {pct(app.breakdown?.projects, app.score)}%
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-500/15 text-slate-200 border border-slate-500/25">
                    Semantic: {pct(app.breakdown?.semantic, app.score)}%
                  </span>
                </div>

                {/* Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {app.matchedSkills && app.matchedSkills.length > 0 && (
                    <div>
                      <p className="text-slate-500 font-medium mb-2">
                        ✓ Matched Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {app.matchedSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {app.missingSkills && app.missingSkills.length > 0 && (
                    <div>
                      <p className="text-slate-500 font-medium mb-2">
                        ✗ Missing Skills:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {app.missingSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded bg-rose-500/15 text-rose-200 text-xs font-medium border border-rose-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default JobDetails;
