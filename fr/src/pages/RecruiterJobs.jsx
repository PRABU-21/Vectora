import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createJob,
  getMyJobs,
  getJobApplicants,
  closeJob,
  bulkUpdateApplicants,
} from "../data/api";
import ParticlesBackground from "../components/ParticlesBackground";
import GoogleTranslate from "../components/GoogleTranslate";

const emptyForm = {
  title: "",
  companyName: "",
  description: "",
  location: "Remote",
  type: "Full-time",
  salary: "Not specified",
  skills: "",
  minExperience: 0,
  durationMonths: "",
  deadline: "",
};

const RecruiterJobs = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({ open: false, jobId: null, applicants: [] });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    if (user?.role !== "recruiter") {
      navigate("/dashboard");
      return;
    }
    loadJobs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadJobs = async () => {
    try {
      setLoading(true);
      const resp = await getMyJobs();
      setJobs(resp.jobs || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const resp = await createJob(payload);
      if (resp.success) showToast("Job created");
      setForm(emptyForm);
      loadJobs();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create job");
    } finally {
      setSaving(false);
    }
  };

  const openApplicants = async (jobId) => {
    try {
      setModal({ open: true, jobId, applicants: [] });
      const resp = await getJobApplicants(jobId);
      setModal({ open: true, jobId, applicants: resp.applications || [] });
    } catch (err) {
      console.error(err);
      showToast("Failed to load applicants", "error");
    }
  };

  const handleBulk = async (jobId, action, topN) => {
    try {
      await bulkUpdateApplicants(jobId, { action, topN });
      showToast("Bulk update applied");
      if (modal.open && modal.jobId === jobId) openApplicants(jobId);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Bulk update failed", "error");
    }
  };

  const handleCloseJob = async (jobId) => {
    try {
      await closeJob(jobId);
      showToast("Job closed");
      loadJobs();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to close job", "error");
    }
  };

  const parsedJobs = useMemo(
    () =>
      (jobs || []).map((j) => ({
        ...j.job,
        counts: j.counts || { total: 0, pending: 0, selected: 0 },
      })),
    [jobs]
  );

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
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
                Recruiter Hub
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <GoogleTranslate />
              <button
                onClick={() => navigate("/dashboard")}
                className="text-gray-700 hover:text-sky-700 font-medium transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={logout}
                className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-sky-700 hover:to-indigo-800 transition-all shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-gradient-to-r from-sky-500 via-indigo-600 to-blue-700 relative overflow-hidden">
        <ParticlesBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-3">Create and manage roles</h2>
            <p className="text-blue-100 text-lg">
              Semantic-only matching is live. Create a role, share the link, and review ranked applicants.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {toast && (
          <div
            className={`rounded-xl px-4 py-3 shadow-md text-sm ${
              toast.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {toast.message}
          </div>
        )}

        <section className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Create job</h3>
          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
            <input
              required
              className="border rounded-lg px-3 py-2"
              placeholder="Job title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              required
              className="border rounded-lg px-3 py-2"
              placeholder="Company"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Type (e.g., Full-time)"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Salary"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
            />
            <input
              className="border rounded-lg px-3 py-2"
              placeholder="Skills (comma separated)"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
            <input
              type="number"
              min="0"
              className="border rounded-lg px-3 py-2"
              placeholder="Min experience (years)"
              value={form.minExperience}
              onChange={(e) => setForm({ ...form, minExperience: e.target.value })}
            />
            <input
              type="number"
              min="0"
              className="border rounded-lg px-3 py-2"
              placeholder="Duration months (optional)"
              value={form.durationMonths}
              onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
            />
            <input
              type="date"
              className="border rounded-lg px-3 py-2"
              placeholder="Deadline"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            <div className="md:col-span-2">
              <textarea
                required
                rows={4}
                className="border rounded-lg px-3 py-2 w-full"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-sky-700 hover:to-indigo-800 transition disabled:opacity-60"
              >
                {saving ? "Saving..." : "Create job"}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">My jobs</h3>
            <button
              className="text-sm text-sky-700 hover:text-sky-800"
              onClick={loadJobs}
            >
              Refresh
            </button>
          </div>
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : parsedJobs.length === 0 ? (
            <div className="text-gray-600">No jobs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-2">Title</th>
                    <th className="px-4 py-2">Company</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Deadline</th>
                    <th className="px-4 py-2">Apps</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedJobs.map((job) => (
                    <tr key={job._id} className="border-t">
                      <td className="px-4 py-2 font-medium text-gray-900">{job.title || job.jobRoleName}</td>
                      <td className="px-4 py-2 text-gray-700">{job.companyName}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          job.status === "open"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-700"
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {job.deadline ? new Date(job.deadline).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-2 text-gray-700">
                        {job.counts.total || 0} (pending {job.counts.pending || 0})
                      </td>
                      <td className="px-4 py-2 flex gap-2 flex-wrap">
                        <button
                          className="text-sky-700 hover:text-sky-900"
                          onClick={() => openApplicants(job._id)}
                        >
                          Applicants
                        </button>
                        {job.status === "open" && (
                          <button
                            className="text-orange-700 hover:text-orange-900"
                            onClick={() => handleCloseJob(job._id)}
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {modal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Applicants</h4>
              <button onClick={() => setModal({ open: false, jobId: null, applicants: [] })}>✕</button>
            </div>
            <div className="flex gap-3 mb-4">
              <button
                className="text-sm text-sky-700"
                onClick={() => handleBulk(modal.jobId, "select_top", 3)}
              >
                Select top 3
              </button>
              <button
                className="text-sm text-orange-700"
                onClick={() => handleBulk(modal.jobId, "reject_pending")}
              >
                Reject pending
              </button>
            </div>
            {modal.applicants.length === 0 ? (
              <div className="text-gray-600">No applicants yet.</div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left">
                    <tr>
                      <th className="px-4 py-2">Candidate</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Score</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modal.applicants.map((app) => (
                      <tr key={app._id} className="border-t">
                        <td className="px-4 py-2 text-gray-900">
                          {app.candidateId?.name || "Candidate"}
                        </td>
                        <td className="px-4 py-2 text-gray-700">{app.candidateId?.email || "-"}</td>
                        <td className="px-4 py-2 text-gray-700">
                          {app.score !== null && app.score !== undefined
                            ? `${(app.score * 100).toFixed(1)}%`
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-gray-700 capitalize">{app.status}</td>
                        <td className="px-4 py-2 text-gray-700">
                          {app.appliedAt ? new Date(app.appliedAt).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterJobs;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ParticlesBackground from "../components/ParticlesBackground";
import {
  recruiterCreateJob,
  recruiterGetJobs,
  recruiterCloseJob,
} from "../data/api";

const emptyForm = {
  title: "",
  company: "",
  location: "Remote",
  description: "",
  skills: "",
  minExperience: 0,
  durationMonths: 2,
};

const RecruiterJobs = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const data = await recruiterGetJobs();
      setJobs(data || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load jobs");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const payload = {
        ...form,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await recruiterCreateJob(payload);
      setForm(emptyForm);
      await load();
      setMessage("Job created");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  const closeJob = async (jobId) => {
    try {
      await recruiterCloseJob(jobId);
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to close job");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 text-white">
      <ParticlesBackground id="recruiter-jobs" className="opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.12),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(79,70,229,0.12),transparent_30%)]" />

      <Navbar />

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <header className="grid gap-6 lg:grid-cols-2 items-center fade-up">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-200/80">Recruiter workspace</p>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-white">
              Post roles, view pipelines, and shortlist with AI
            </h1>
            <p className="text-lg text-slate-200/90">
              Mirror the job seeker experience with the same motion and particle flair—designed for fast role creation and real-time applicant visibility.
            </p>
            {message && (
              <span className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-full bg-white/10 text-sky-100 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {message}
              </span>
            )}
          </div>
          <div className="relative fade-up-delayed">
            <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 via-indigo-500/10 to-fuchsia-500/20 blur-3xl" />
            <section className="relative bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-200/80">Post a new role</p>
                  <h2 className="text-2xl font-semibold text-white">Create job</h2>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-400/40">Live</span>
              </div>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
                <input
                  className="border border-white/20 bg-white/5 rounded-xl px-3 py-2 text-white placeholder:text-slate-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
                <input
                  className="border border-white/20 bg-white/5 rounded-xl px-3 py-2 text-white placeholder:text-slate-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  placeholder="Company"
                  value={form.company}
                  onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                />
                <input
                  className="border border-white/20 bg-white/5 rounded-xl px-3 py-2 text-white placeholder:text-slate-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  placeholder="Location"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    className="border border-white/20 bg-white/5 rounded-xl px-3 py-2 text-white placeholder:text-slate-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    placeholder="Min experience (yrs)"
                    value={form.minExperience}
                    onChange={(e) => setForm((p) => ({ ...p, minExperience: e.target.value }))}
                  />
                  <input
                    type="number"
                    className="border border-white/20 bg-white/5 rounded-xl px-3 py-2 text-white placeholder:text-slate-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                    placeholder="Duration months"
                    value={form.durationMonths}
                    onChange={(e) => setForm((p) => ({ ...p, durationMonths: e.target.value }))}
                  />
                </div>
                <textarea
                  className="md:col-span-2 border border-white/20 bg-white/5 rounded-xl px-3 py-2 text-white placeholder:text-slate-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  rows={3}
                  placeholder="Skills (comma separated)"
                  value={form.skills}
                  onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
                />
                <textarea
                  className="md:col-span-2 border border-white/20 bg-white/5 rounded-xl px-3 py-2 text-white placeholder:text-slate-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  rows={4}
                  placeholder="Description"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  required
                />
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-sky-900/40 hover:translate-y-[-1px] transition-transform disabled:opacity-60"
                  >
                    {loading ? "Saving..." : "Post job"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </header>

        <section className="space-y-4 fade-up">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-200/80">Your roles</p>
              <h2 className="text-2xl font-bold text-white">Jobs & applicants</h2>
            </div>
            <div className="flex gap-3 text-xs text-slate-200/80">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Live insights</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Motion enabled</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div
                key={job._id || job.id}
                className="group bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-indigo-950/30 transition-transform hover:-translate-y-1 hover:border-sky-400/50 fade-up"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-white">{job.title}</h3>
                    <p className="text-sm text-slate-200/80">{job.company} • {job.location}</p>
                    <p className="text-xs text-slate-300/70">Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full border ${job.status === "open" ? "bg-emerald-500/15 text-emerald-100 border-emerald-400/40" : "bg-white/5 text-slate-200 border-white/15"}`}>
                    {job.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200/90 mt-3">
                  <span>{job.totalApplications ?? 0} applications</span>
                  <span className="text-slate-400">•</span>
                  <span>{job.pendingCount ?? 0} pending</span>
                  <span className="text-slate-400">•</span>
                  <span>{job.selectedCount ?? 0} selected</span>
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => navigate(`/recruiter/jobs/${job._id || job.id}/applicants`)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-400 to-indigo-500 shadow-lg shadow-sky-900/30 group-hover:translate-y-[-1px] transition-transform"
                  >
                    View applicants
                  </button>
                  <button
                    onClick={() => closeJob(job._id || job.id)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
            {!jobs.length && (
              <div className="col-span-1 md:col-span-2 text-slate-200/80">No jobs yet. Post one above.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default RecruiterJobs;