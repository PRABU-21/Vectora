import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { shortlist } from "../data/api";

const Shortlist = () => {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [topN, setTopN] = useState(5);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        jobDescription,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        topN: Number(topN) || 5,
        experienceRange: {},
      };
      const data = await shortlist(payload);
      setResults(data.results || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to shortlist");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="bg-slate-950/80 border-b border-emerald-900/30 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/90 font-semibold">Recruita</p>
            <h1 className="text-xl font-semibold bg-linear-to-r from-white to-slate-200 bg-clip-text text-transparent">Shortlist Workspace</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="text-sm text-slate-300 hover:text-emerald-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-slate-900/80 border border-emerald-900/40 shadow-2xl shadow-emerald-950/30 rounded-2xl p-6 backdrop-blur">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-pink-200/90 font-semibold">Post a JD</p>
              <h2 className="text-xl font-semibold text-white">Run a shortlist</h2>
              <p className="text-sm text-slate-300">Weights: Experience 40%, Skills 20%, Projects 20%, Profile fit 20%.</p>
            </div>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Job Description
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                required
                rows={6}
                className="w-full rounded-xl px-3 py-3 bg-slate-950/60 border border-emerald-900/40 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 shadow-inner placeholder-slate-500 transition-all"
                placeholder="Paste the job description"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Desired Skills (comma separated)
                </label>
                <input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 bg-slate-950/60 border border-emerald-900/40 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 shadow-inner placeholder-slate-500 transition-all"
                  placeholder="react, node, aws"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Top N</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={topN}
                  onChange={(e) => setTopN(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 bg-slate-950/60 border border-emerald-900/40 text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 shadow-inner placeholder-slate-500 transition-all"
                />
              </div>
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-linear-to-r from-emerald-600 to-emerald-700 text-white rounded-lg font-semibold hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 shadow-lg shadow-emerald-900/40 transition-all"
            >
              {loading ? "Shortlisting..." : "Shortlist"}
            </button>
          </form>
        </section>

        <section className="bg-slate-900/80 border border-emerald-900/40 shadow-2xl shadow-emerald-950/30 rounded-2xl p-6 backdrop-blur">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-pink-200/90 font-semibold">Results</p>
              <h2 className="text-xl font-semibold text-white">Ranked candidates</h2>
            </div>
            {results.length > 0 && (
              <p className="text-sm text-slate-400">Showing top {results.length}</p>
            )}
          </div>
          {results.length === 0 ? (
            <p className="text-slate-400 text-sm">No results yet. Submit a JD to see matches.</p>
          ) : (
            <div className="space-y-3">
              {results.map((r) => (
                <div
                  key={r.candidateId}
                  className="p-4 rounded-xl border border-emerald-900/30 bg-slate-950/40 shadow-sm shadow-emerald-950/20 hover:border-emerald-800/50 transition-all"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-lg font-semibold text-white">{r.candidate}</div>
                      <div className="text-sm text-slate-400">{r.email}</div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-[0.14em] text-pink-200/90 font-semibold">Score</p>
                      <p className="text-2xl font-bold bg-linear-to-br from-emerald-200 to-pink-200 bg-clip-text text-transparent">{Math.round((r.score || 0) * 100)}%</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/40">
                      Experience {r.breakdownPercent?.experience ?? 0}%
                    </span>
                    <span className="px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-100 border border-emerald-400/30">
                      Skills {r.breakdownPercent?.skills ?? 0}%
                    </span>
                    <span className="px-2 py-1 rounded-full bg-pink-400/10 text-pink-100 border border-pink-400/30">
                      Projects {r.breakdownPercent?.projects ?? 0}%
                    </span>
                    <span className="px-2 py-1 rounded-full bg-slate-600/25 text-slate-300 border border-slate-600/40">
                      Profile fit {r.breakdownPercent?.semantic ?? 0}%
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                    {r.explanation || "Weighted blend of experience, skills, projects, and profile fit."}
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500">Years experience</p>
                      <p className="font-semibold text-slate-200">{r.yearsExperience ?? "—"} yrs</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Matched skills</p>
                      <p className="font-semibold text-slate-200">{r.matchedSkills?.length ? r.matchedSkills.join(", ") : "—"}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Gap skills</p>
                      <p className="font-semibold text-slate-200">{r.missingSkills?.length ? r.missingSkills.join(", ") : "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Shortlist;