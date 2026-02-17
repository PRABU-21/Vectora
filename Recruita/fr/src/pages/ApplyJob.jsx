import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicJob, applyToJob } from "../data/api";

const ApplyJob = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [resume, setResume] = useState(null);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await getPublicJob(jobId);
      if (response.success) {
        setJob(response.job);
      }
    } catch (error) {
      console.error("Failed to fetch job:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resume) {
      alert("Please upload your resume");
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("resume", resume);

      const response = await applyToJob(jobId, formDataToSend);
      if (response.success) {
        setSuccess(true);
        setFormData({ name: "", email: "" });
        setResume(null);
      }
    } catch (error) {
      console.error("Application failed:", error);
      alert(
        error.response?.data?.message ||
          "Failed to submit application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-pink-200 border-t-transparent animate-spin"></div>
          <p className="text-xl text-slate-300">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md p-8 rounded-xl border border-red-500/30 bg-zinc-900/60">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">
            Job Not Available
          </h2>
          <p className="text-slate-400">
            This job posting is no longer accepting applications or does not
            exist.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-xl border border-emerald-500/30 bg-zinc-900/60 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-linear-to-br from-emerald-400 to-green-500 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Application Submitted!
          </h2>
          <p className="text-slate-300 mb-6">
            Your application has been automatically scored and added to the
            candidate pool. The recruiter will review all applications soon.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setFormData({ name: "", email: "" });
            }}
            className="px-6 py-3 rounded-lg bg-linear-to-r from-pink-200 to-pink-300 text-black font-bold hover:from-pink-300 hover:to-pink-400 transition-colors"
          >
            Apply to Another Job
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-linear-to-br from-pink-200 to-green-300 flex items-center justify-center font-bold text-2xl shadow-lg">
              <span className="text-black">R</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-green-300 font-semibold">
                Recruita
              </p>
              <p className="text-xl font-bold text-pink-200">
                Job Application
              </p>
            </div>
          </div>

          <div className="p-8 rounded-2xl border border-pink-200/20 bg-zinc-900/60 shadow-xl">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-3">
                {job.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span>{job.company}</span>
                </div>
                <span className="text-slate-600">•</span>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span>{job.location}</span>
                </div>
                <span className="text-slate-600">•</span>
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Apply by {formatDate(job.deadline)}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-white mb-3">
                Job Description
              </h3>
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {job.skills && job.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full text-sm font-medium bg-pink-200/20 text-pink-200 border border-pink-200/40"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.minExperience > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">
                  Experience Required
                </h3>
                <p className="text-slate-300">
                  {job.minExperience}+ years
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Application Form */}
        <div className="p-8 rounded-2xl border border-green-300/20 bg-zinc-900/60 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-2">
            Submit Your Application
          </h2>
          <p className="text-sm text-slate-400 mb-6">
            Your resume will be automatically scored against this job description
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-slate-300 font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 placeholder-slate-500 transition-colors outline-none"
                placeholder="john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 font-medium mb-2">
                Resume *
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={(e) => setResume(e.target.files[0])}
                  accept=".txt,.pdf,.doc,.docx"
                  className="w-full rounded-lg bg-black border border-zinc-700 text-white px-4 py-3 focus:border-pink-200 focus:ring-2 focus:ring-pink-200/30 transition-colors outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-pink-200 file:text-black hover:file:bg-pink-300"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Accepted formats: .txt, .pdf, .doc, .docx (max 5MB)
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-lg bg-linear-to-r from-pink-200 to-pink-300 text-black font-bold text-lg hover:from-pink-300 hover:to-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
          </form>

          <p className="text-xs text-slate-500 mt-6 text-center">
            By submitting this application, you agree that your resume will be
            processed using AI to match against the job requirements.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplyJob;
