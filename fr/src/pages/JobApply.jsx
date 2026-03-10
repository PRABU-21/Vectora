import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getPublicJob } from "../data/api";
import api from "../data/api";

const JobApply = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicJob(jobId);
        setJob(res?.job || null);
      } catch (err) {
        setMessage(err?.response?.data?.message || "Job not found");
      }
    })();
  }, [jobId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("Upload a resume first");
    setLoading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      await api.post(`/recruiter/jobs/${jobId}/apply`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Application submitted");
      setFile(null);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to apply");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {job ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
            <p className="text-sm text-gray-500">Public role</p>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-600">{job.company} • {job.location}</p>
            <p className="text-sm text-gray-500 mt-2">Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
            <div className="mt-4 text-gray-700 whitespace-pre-line">{job.description}</div>
            {job.skills?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="px-3 py-1 rounded-full text-xs bg-sky-50 text-sky-700 border border-sky-100">{s}</span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-gray-600">{message || "Loading job..."}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Apply with resume</h2>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-700"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-sky-700 hover:to-indigo-800 shadow-md disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit application"}
          </button>
          {message && <div className="text-sm text-sky-700">{message}</div>}
        </form>
        <button onClick={() => navigate(-1)} className="text-sky-700 font-semibold">← Back</button>
      </main>
    </div>
  );
};

export default JobApply;