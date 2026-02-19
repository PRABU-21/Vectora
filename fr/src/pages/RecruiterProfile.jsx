import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { recruiterGetJobs } from "../data/api";
import ParticlesBackground from "../components/ParticlesBackground";
import GoogleTranslate from "../components/GoogleTranslate";
import GooeyNav from "../components/GooeyNav";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    return null;
  }
};

const accentClasses = {
  sky: "text-sky-700",
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  indigo: "text-indigo-700",
};

const StatCard = ({ label, value, accent = "sky" }) => (
  <div className="flex flex-col gap-1 p-4 rounded-2xl bg-white/70 border border-white/60 shadow-sm">
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
    <p className={`text-2xl font-bold ${accentClasses[accent] || "text-sky-700"}`}>{value}</p>
  </div>
);

const RecruiterProfile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navItems = [
    { label: "Home", href: "/recruiter/jobs" },
    { label: "Posted", href: "/recruiter/posted" },
    { label: "Shortlist", href: "/recruiter/shortlist" },
  ];
  const activeNavIndex = navItems.findIndex((item) => location.pathname.startsWith(item.href));

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = getUser();
    if (!token || !userData || userData.role !== "recruiter") {
      navigate("/login");
      return;
    }
    loadJobs();
  }, [navigate]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const resp = await recruiterGetJobs();
      setJobs(resp?.jobs || resp || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = jobs.length;
    const open = jobs.filter((j) => j.status === "open").length;
    const closed = jobs.filter((j) => j.status === "closed").length;
    const totalApps = jobs.reduce((sum, j) => sum + (j.totalApplications || j.counts?.total || 0), 0);
    return { total, open, closed, totalApps };
  }, [jobs]);

  const recentJobs = useMemo(() => {
    return [...jobs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((j) => ({
        id: j._id || j.id,
        title: j.title || j.jobRoleName,
        status: j.status,
        location: j.location || "Remote",
        totalApplications: j.totalApplications || j.counts?.total || 0,
        deadline: j.deadline,
      }));
  }, [jobs]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const company = user?.company || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 text-white relative overflow-hidden">
      <ParticlesBackground id="recruiter-profile" className="opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(14,165,233,0.12),transparent_35%),radial-gradient(circle_at_90%_0%,rgba(236,72,153,0.12),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(79,70,229,0.12),transparent_34%)]" />

      <nav className="relative z-10 bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-indigo-700 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sky-200/80">Recruiter</p>
              <h1 className="text-2xl font-bold text-white">Profile & Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <GoogleTranslate />
            <GooeyNav
              items={navItems}
              activeIndex={activeNavIndex >= 0 ? activeNavIndex : 0}
              onSelect={(_, item) => navigate(item.href)}
            />
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {error && <div className="bg-red-500/10 border border-red-400/50 text-red-100 px-4 py-3 rounded-xl">{error}</div>}

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-sky-200/80">Profile</p>
                <h2 className="text-3xl font-bold text-white">{user?.name || "Recruiter"}</h2>
                <p className="text-sm text-slate-200/80">{user?.email}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-100 border border-emerald-400/40">
                {user?.role || "recruiter"}
              </span>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-300/80">Company</p>
                <p className="text-lg font-semibold text-white">{company.name || "Not provided"}</p>
                {company.industry && <p className="text-sm text-slate-200/80">Industry: {company.industry}</p>}
                {company.description && <p className="text-sm text-slate-200/70 mt-1">{company.description}</p>}
              </div>
              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-300/80">Location</p>
                <p className="text-lg font-semibold text-white">
                  {user?.location?.city || user?.location?.state || user?.location?.country ?
                    [user?.location?.city, user?.location?.state, user?.location?.country].filter(Boolean).join(", ") :
                    "Not set"}
                </p>
                {company.techStack?.length ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {company.techStack.slice(0, 6).map((t) => (
                      <span key={t} className="px-2 py-1 text-xs rounded-full bg-white/10 border border-white/20 text-sky-100">{t}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-300/80 mt-1">Tech stack not added</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <StatCard label="Total jobs" value={stats.total} accent="sky" />
            <StatCard label="Open roles" value={stats.open} accent="emerald" />
            <StatCard label="Closed roles" value={stats.closed} accent="amber" />
            <StatCard label="Total applications" value={stats.totalApps} accent="indigo" />
          </div>
        </section>

        <section className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-sky-200/80">Recent roles</p>
              <h3 className="text-2xl font-bold text-white">Latest 5 postings</h3>
            </div>
            <button
              onClick={() => navigate("/recruiter/posted")}
              className="px-3 py-2 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100 transition"
            >
              View all posted
            </button>
          </div>

          {loading ? (
            <div className="text-slate-200/80">Loading jobs...</div>
          ) : recentJobs.length === 0 ? (
            <div className="text-slate-200/80">No jobs yet. Create one from recruiter home.</div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-black/20 border border-white/10">
                  <div>
                    <p className="text-sm font-semibold text-white">{job.title}</p>
                    <p className="text-xs text-slate-200/80">{job.location}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-100">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                      job.status === "open"
                        ? "bg-emerald-500/15 text-emerald-100 border-emerald-400/30"
                        : "bg-slate-500/20 text-slate-100 border-slate-400/30"
                    }`}>
                      {job.status || "open"}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-white/10 border border-white/20">{job.totalApplications} apps</span>
                    <span className="text-xs text-slate-200/80">Due {formatDate(job.deadline)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-sky-200/80">Quick actions</p>
              <h3 className="text-2xl font-bold text-white">Manage hiring</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/recruiter/jobs")}
                className="px-3 py-2 rounded-lg bg-sky-500 text-white font-semibold hover:bg-sky-600 transition"
              >
                Create / Edit Jobs
              </button>
              <button
                onClick={() => navigate("/recruiter/posted")}
                className="px-3 py-2 rounded-lg bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition"
              >
                View Posted Jobs
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-slate-100">
            <div className="p-3 rounded-xl bg-black/20 border border-white/10">Track applicants and shortlist quickly.</div>
            <div className="p-3 rounded-xl bg-black/20 border border-white/10">Keep company info updated for candidates.</div>
            <div className="p-3 rounded-xl bg-black/20 border border-white/10">Review performance with live stats.</div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default RecruiterProfile;
