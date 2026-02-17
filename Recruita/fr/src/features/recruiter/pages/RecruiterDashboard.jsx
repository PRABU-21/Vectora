import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruiterAPI } from '../../../utils/api';

const RecruiterDashboard = () => {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    minExperience: 0,
    location: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    const userData = localStorage.getItem('user');

    if (!token || userType !== 'recruiter') {
      navigate('/recruiter/login');
      return;
    }

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // ignore invalid localStorage
      }
    }

    void loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await recruiterAPI.getMyJobs();
      setJobs(response.data.jobs || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async (job) => {
    try {
      setLoading(true);
      setError('');

      const response = await recruiterAPI.getJobApplicants(job._id);
      const mappedApplicants = (response.data.results || []).map((app) => ({
        _id: app.applicationId,
        candidate: {
          name: app.candidate,
          email: app.email,
          yearsExperience: app.yearsExperience,
        },
        compositeScore: app.score,
        experienceScore: app.experienceScore,
        skillScore: app.skillMatch,
        projectScore: app.projectScore,
        semanticScore: app.similarity,
        matchedSkills: app.matchedSkills || [],
        missingSkills: app.missingSkills || [],
        totalRequiredSkills: (app.matchedSkills?.length || 0) + (app.missingSkills?.length || 0),
        status: app.status,
      }));

      setCandidates(mappedApplicants);
      setSelectedJob(job._id);
      setSelectedJobDetails(job);
      setSelectedApplicant(null);
      setShowApplicantsModal(true);
    } catch (err) {
      console.error(err);
      setError('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowApplicantsModal(false);
    setSelectedJob(null);
    setSelectedJobDetails(null);
    setCandidates([]);
    setSelectedApplicant(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    navigate('/recruiter/login');
  };

  const handleJobFormChange = (e) => {
    setJobForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const jobData = {
        title: jobForm.title,
        description: jobForm.description,
        location: jobForm.location,
        skills: jobForm.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        minExperience: parseInt(jobForm.minExperience, 10) || 0,
      };

      await recruiterAPI.createJob(jobData);
      setShowCreateJob(false);
      setJobForm({
        title: '',
        description: '',
        requiredSkills: '',
        minExperience: 0,
        location: '',
      });
      await loadJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadgeClass = (score) => {
    if (score >= 0.7) return 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
    if (score >= 0.5) return 'border border-pink-400/20 bg-pink-500/10 text-pink-200';
    return 'border border-rose-400/20 bg-rose-500/10 text-rose-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.7) return 'Excellent Match';
    if (score >= 0.5) return 'Good Match';
    return 'Potential Match';
  };

  const JobForm = ({ onCancel }) => (
    <form onSubmit={handleCreateJob} className="mt-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-white/80">Job Title *</label>
          <input
            type="text"
            name="title"
            value={jobForm.title}
            onChange={handleJobFormChange}
            required
            placeholder="e.g., Senior Full Stack Developer"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-white/80">Job Description *</label>
          <textarea
            name="description"
            value={jobForm.description}
            onChange={handleJobFormChange}
            required
            rows={5}
            placeholder="Describe responsibilities, requirements, and what success looks like…"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-white/80">Required Skills (comma-separated) *</label>
          <input
            type="text"
            name="requiredSkills"
            value={jobForm.requiredSkills}
            onChange={handleJobFormChange}
            required
            placeholder="React, Node.js, MongoDB, AWS"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80">Minimum Experience (years)</label>
          <input
            type="number"
            name="minExperience"
            value={jobForm.minExperience}
            onChange={handleJobFormChange}
            min="0"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80">Location</label>
          <input
            type="text"
            name="location"
            value={jobForm.location}
            onChange={handleJobFormChange}
            placeholder="Remote, Hybrid, Bengaluru…"
            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
        ) : (
          <div />
        )}
        <button
          type="submit"
          className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Creating…' : 'Create Job Posting'}
        </button>
      </div>
    </form>
  );

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl px-5 py-4 shadow-2xl">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Recruiter Dashboard</h1>
            <p className="text-xs sm:text-sm text-white/60">Post jobs and review ranked applicants.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium">{user?.name || 'Recruiter'}</div>
              {user?.company && <div className="text-xs text-white/60">{user.company}</div>}
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
              type="button"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && (
          <div className="mb-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 sm:p-10 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold">No job postings yet</h2>
                <p className="mt-1 text-sm text-white/70">
                  Create your first job posting and you&apos;ll start seeing auto-ranked applicants here.
                </p>
              </div>
              <button
                onClick={() => setShowCreateJob(true)}
                className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:opacity-60"
                disabled={showCreateJob}
                type="button"
              >
                + Create Job
              </button>
            </div>

            {showCreateJob && (
              <div className="mt-8">
                <h3 className="text-base font-semibold">Create job</h3>
                <JobForm onCancel={() => setShowCreateJob(false)} />
              </div>
            )}
          </div>
        ) : (
          <>
            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">Your Job Postings</h2>
                  <p className="mt-1 text-sm text-white/60">Click a job to view applicants ranked by score.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
                  <span className="rounded-full bg-white/5 px-3 py-1 border border-white/10">{jobs.length} total</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div key={job._id} className="group rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-semibold leading-tight">{job.title}</h3>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70">
                            {job.status || 'open'}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
                          {job.location && <span>📍 {job.location}</span>}
                          {job.minExperience > 0 && <span>💼 {job.minExperience}+ years</span>}
                        </div>
                      </div>

                      <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                        <div className="text-lg font-semibold">{job.totalApplications || 0}</div>
                        <div className="text-[11px] text-white/60">Applicants</div>
                      </div>
                    </div>

                    {job.skills?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {job.skills.slice(0, 8).map((skill, idx) => (
                          <span key={idx} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5 flex items-center justify-end">
                      <button
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => loadApplicants(job)}
                        disabled={!job.totalApplications || job.totalApplications === 0}
                        type="button"
                      >
                        {job.totalApplications > 0
                          ? `View ${job.totalApplications} Applicant${job.totalApplications !== 1 ? 's' : ''}`
                          : 'No Applicants Yet'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-7">
              <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 sm:p-6 shadow-2xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold">Create a new job</h3>
                    <p className="mt-1 text-sm text-white/60">Post a job and review ranked applicants.</p>
                  </div>
                  <button
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      showCreateJob ? 'bg-white/10 text-white' : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
                    }`}
                    onClick={() => setShowCreateJob((v) => !v)}
                    type="button"
                  >
                    {showCreateJob ? 'Close' : '+ Create Job'}
                  </button>
                </div>

                {showCreateJob && <JobForm />}
              </div>
            </section>
          </>
        )}
      </main>

      {showApplicantsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-6xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/10 bg-white/5">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">{selectedJobDetails?.title}</h2>
                <p className="mt-1 text-sm text-white/60">
                  {candidates.length} Applicant{candidates.length !== 1 ? 's' : ''} • Auto-Scored & Ranked
                </p>
              </div>
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                onClick={closeModal}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[360px_1fr]" style={{ height: '75vh' }}>
              <div className="border-b md:border-b-0 md:border-r border-white/10 overflow-hidden bg-white/5">
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/90">All Applicants</h3>
                    <span className="text-xs text-white/60">Ranked by score</span>
                  </div>
                </div>

                {loading ? (
                  <div className="px-5 pb-5 text-sm text-white/70">Loading applicants…</div>
                ) : candidates.length === 0 ? (
                  <div className="px-5 pb-5 text-sm text-white/70">No applicants yet.</div>
                ) : (
                  <div className="overflow-y-auto" style={{ maxHeight: 'calc(75vh - 64px)' }}>
                    {candidates.map((applicant, index) => {
                      const score = applicant.compositeScore || 0;
                      const isActive = selectedApplicant?._id === applicant._id;
                      return (
                        <button
                          key={applicant._id}
                          type="button"
                          onClick={() => setSelectedApplicant(applicant)}
                          className={`w-full text-left px-5 py-4 border-t border-white/10 transition ${
                            isActive
                              ? 'bg-emerald-500/10 border-l-2 border-l-emerald-400'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-white/60">#{index + 1}</span>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getScoreBadgeClass(
                                    score
                                  )}`}
                                >
                                  {(score * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="mt-2 truncate font-semibold">{applicant.candidate?.name}</div>
                              <div className="mt-0.5 truncate text-xs text-white/60">{applicant.candidate?.email}</div>
                            </div>
                            <span className={isActive ? 'text-emerald-200/70' : 'text-white/40'}>→</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: '75vh' }}>
                <div className="p-5">
                  {selectedApplicant ? (
                    (() => {
                      const score = selectedApplicant.compositeScore || 0;
                      return (
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-semibold">{selectedApplicant.candidate?.name}</h3>
                              <p className="mt-1 text-sm text-white/60">{selectedApplicant.candidate?.email}</p>
                            </div>
                            <div className={`rounded-2xl px-4 py-3 text-center ${getScoreBadgeClass(score)}`}>
                              <div className="text-2xl font-extrabold text-white">{(score * 100).toFixed(0)}%</div>
                              <div className="text-xs font-semibold text-white/70">{getScoreLabel(score)}</div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <h4 className="text-sm font-semibold text-white/90">Automatic Scoring Breakdown</h4>
                            <div className="mt-4 space-y-4">
                              <div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/80">Experience (Semantic)</span>
                                  <span className="text-white/70">{selectedApplicant.candidate?.yearsExperience || 0} years</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-pink-400"
                                    style={{ width: `${(selectedApplicant.experienceScore || 0) * 100}%` }}
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/80">Skills (Semantic)</span>
                                  <span className="text-white/70">{((selectedApplicant.skillScore || 0) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-400"
                                    style={{ width: `${(selectedApplicant.skillScore || 0) * 100}%` }}
                                  />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/80">Projects (Semantic)</span>
                                  <span className="text-white/70">{((selectedApplicant.projectScore || 0) * 100).toFixed(0)}%</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full bg-pink-300"
                                    style={{ width: `${(selectedApplicant.projectScore || 0) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
                      <div className="text-3xl">👈</div>
                      <h3 className="mt-3 text-lg font-semibold">Select an applicant</h3>
                      <p className="mt-1 text-sm text-white/60">Choose an applicant from the left to see details.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedJob ? null : null}
    </div>
  );
};

export default RecruiterDashboard;
