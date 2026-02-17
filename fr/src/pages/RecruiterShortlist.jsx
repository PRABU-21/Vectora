import { useState } from "react";
import Navbar from "../components/Navbar";
import ParticlesBackground from "../components/ParticlesBackground";
import { recruiterShortlist } from "../data/api";

const RecruiterShortlist = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [topN, setTopN] = useState(5);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const body = {
        jobDescription,
        skills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        topN,
      };
      const res = await recruiterShortlist(body);
      setResults(res?.results || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to shortlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 text-white">
      <ParticlesBackground id="recruiter-shortlist" className="opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(14,165,233,0.15),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(236,72,153,0.14),transparent_30%),radial-gradient(circle_at_50%_90%,rgba(79,70,229,0.12),transparent_32%)]" />
      <Navbar />
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <section className="relative bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden fade-up">
          <div className="absolute -inset-10 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-fuchsia-500/15 blur-3xl" />
          <div className="relative mb-4">
            <p className="text-sm uppercase tracking-[0.18em] text-sky-200/80">Semantic shortlist</p>
            <h1 className="text-2xl font-bold text-white">Paste JD and rank candidates</h1>
          </div>
          <form className="relative space-y-4" onSubmit={handleSubmit}>
            <textarea
              className="w-full border border-white/20 bg-white/5 rounded-xl px-3 py-2 text-white placeholder:text-slate-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              rows={4}
              placeholder="Job description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
            />
            <input
              className="w-full border border-white/20 bg-white/5 rounded-xl px-3 py-2 text-white placeholder:text-slate-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              placeholder="Skills (comma separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-200/90">Top N</label>
              <input
                type="number"
                min={1}
                max={50}
                className="w-24 border border-white/20 bg-white/5 rounded-xl px-3 py-2 text-white placeholder:text-slate-300/70 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value))}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-sky-400 via-indigo-500 to-fuchsia-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-sky-900/40 hover:translate-y-[-1px] transition-transform disabled:opacity-60"
            >
              {loading ? "Scoring..." : "Shortlist"}
            </button>
            {message && <div className="text-sm text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2 inline-flex items-center gap-2 fade-up">{message}</div>}
          </form>
        </section>

        <section className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl fade-up">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Results</h2>
            <span className="text-sm text-slate-200/80">{results.length} shown</span>
          </div>
          {results.length ? (
            results.map((r) => (
              <div key={r.candidateId} className="px-4 py-3 border-t border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors fade-up">
                <div>
                  <p className="font-semibold text-white">{r.candidate}</p>
                  <p className="text-sm text-slate-200/80">{r.email}</p>
                  <p className="text-xs text-slate-300/80">Score {r.score?.toFixed(3)} • Semantic {r.breakdown?.semantic?.toFixed(3)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-300/80">Matched: {r.matchedSkills?.length || 0}</p>
                  <p className="text-xs text-slate-300/80">Missing: {r.missingSkills?.join(", ")}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-slate-200/80 fade-up">No results yet.</div>
          )}
        </section>
      </main>
    </div>
  );
};

export default RecruiterShortlist;