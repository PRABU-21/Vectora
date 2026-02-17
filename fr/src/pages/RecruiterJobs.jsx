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