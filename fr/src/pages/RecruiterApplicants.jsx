import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ParticlesBackground from "../components/ParticlesBackground";
import { recruiterGetApplicants, recruiterBulkUpdate } from "../data/api";

const RecruiterApplicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await recruiterGetApplicants(jobId);
      setData(res);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load applicants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [jobId]);

  const bulkSelect = async (topN) => {
    try {
      await recruiterBulkUpdate(jobId, { topN, action: "select" });
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Bulk action failed");
    }
  };

  const rejectRest = async () => {
    try {
      await recruiterBulkUpdate(jobId, { action: "reject_rest" });
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Bulk action failed");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 text-white">
      <ParticlesBackground id="recruiter-applicants" className="opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(14,165,233,0.15),transparent_30%),radial-gradient(circle_at_90%_0%,rgba(236,72,153,0.14),transparent_28%),radial-gradient(circle_at_50%_90%,rgba(79,70,229,0.12),transparent_30%)]" />
      <Navbar />
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex items-center justify-between fade-up">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.18em] text-sky-200/80">Applicants</p>
            <h1 className="text-3xl font-bold text-white">{data?.job?.title || "Job"}</h1>
            <p className="text-sm text-slate-200/80">{data?.job?.company}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => bulkSelect(5)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-400 to-indigo-500 shadow-lg shadow-sky-900/30 hover:translate-y-[-1px] transition-transform"
            >
              Select top 5
            </button>
            <button
              onClick={rejectRest}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100"
            >
              Reject pending
            </button>
          </div>
        </div>
        {message && <div className="text-sm text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2 inline-flex items-center gap-2 fade-up">{message}</div>}
        {loading && <div className="text-slate-200/90 fade-up">Loading...</div>}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden fade-up">
          <div className="grid grid-cols-12 text-xs font-semibold text-slate-200/80 px-4 py-3 bg-white/5 border-b border-white/10">
            <span className="col-span-3">Candidate</span>
            <span className="col-span-2">Email</span>
            <span className="col-span-2">Score</span>
            <span className="col-span-2">Experience</span>
            <span className="col-span-2">Skill match</span>
            <span className="col-span-1 text-right">Status</span>
          </div>
          {data?.results?.map((row) => (
            <div key={row.applicationId} className="grid grid-cols-12 px-4 py-3 border-t border-white/5 text-sm text-white/90 hover:bg-white/5 transition-colors fade-up">
              <span className="col-span-3 font-semibold">{row.candidate}</span>
              <span className="col-span-2 text-slate-200/80">{row.email}</span>
              <span className="col-span-2">{row.score?.toFixed(3)}</span>
              <span className="col-span-2">{(row.experienceScore || 0).toFixed(2)}</span>
              <span className="col-span-2">{(row.skillMatch || 0).toFixed(2)}</span>
              <span className="col-span-1 text-right capitalize">{row.status}</span>
            </div>
          ))}
          {!data?.results?.length && !loading && (
            <div className="px-4 py-6 text-slate-200/80 fade-up">No applicants yet.</div>
          )}
        </div>
        <button
          onClick={() => navigate("/recruiter/jobs")}
          className="text-sky-200 font-semibold hover:text-white transition-colors"
        >
          ← Back to jobs
        </button>
      </main>
    </div>
  );
};

export default RecruiterApplicants;