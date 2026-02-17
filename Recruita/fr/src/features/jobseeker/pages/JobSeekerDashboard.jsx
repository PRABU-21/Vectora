import { useState, useEffect } from 'react';
import { jobSeekerAPI } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';

const JobSeekerDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, jobsRes, applicationsRes] = await Promise.all([
        jobSeekerAPI.getProfile(),
        jobSeekerAPI.getAllJobs(),
        jobSeekerAPI.getMyApplications(),
      ]);

      setProfile(profileRes.data.candidate);
      setJobs(jobsRes.data.jobs);
      setApplications(applicationsRes.data.applications);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        navigate('/jobseeker/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;

    setUploadingResume(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const response = await jobSeekerAPI.parseResume(formData);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Resume parsed successfully!' });
        setProfile(response.data.candidate);
        setResumeFile(null);
        // Refresh jobs to see updated recommendations
        const jobsRes = await jobSeekerAPI.getAllJobs();
        setJobs(jobsRes.data.jobs);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to parse resume' 
      });
    } finally {
      setUploadingResume(false);
    }
  };

  const handleApply = async (jobId) => {
    if (!profile?.resumeParsed) {
      setMessage({ 
        type: 'error', 
        text: 'Please upload and parse your resume first' 
      });
      return;
    }

    try {
      const response = await jobSeekerAPI.applyToJob(jobId);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Application submitted successfully!' });
        // Refresh applications
        const applicationsRes = await jobSeekerAPI.getMyApplications();
        setApplications(applicationsRes.data.applications);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to apply' 
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    navigate('/');
  };

  const hasApplied = (jobId) => {
    return applications.some(app => app.job._id === jobId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl px-5 py-4 shadow-2xl">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Recruita — Job Seeker</h1>
            <p className="text-xs sm:text-sm text-white/60">Find jobs and apply with AI scoring.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-white/70">Welcome, {profile?.name}!</span>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{profile?.name}</h2>
                <p className="mt-0.5 text-sm text-white/60 break-all">{profile?.email}</p>
                {profile?.location && <p className="mt-2 text-sm text-white/70">📍 {profile.location}</p>}
                {profile?.phone && <p className="mt-1 text-sm text-white/70">📞 {profile.phone}</p>}
              </div>
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                  profile?.resumeParsed
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                    : 'border-pink-400/30 bg-pink-400/10 text-pink-100'
                }`}
              >
                {profile?.resumeParsed ? 'Resume parsed' : 'Resume needed'}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-lg font-semibold">{profile?.skills?.length || 0}</div>
                <div className="text-[11px] text-white/60">Skills</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-lg font-semibold">{profile?.yearsExperience || 0}</div>
                <div className="text-[11px] text-white/60">Years Exp.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-lg font-semibold">{applications.length}</div>
                <div className="text-[11px] text-white/60">Applied</div>
              </div>
            </div>

            {profile?.skills?.length ? (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-white/90">Your Skills</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.skills.slice(0, 12).map((skill, idx) => (
                    <span key={idx} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                      {skill}
                    </span>
                  ))}
                  {profile.skills.length > 12 && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                      +{profile.skills.length - 12} more
                    </span>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {!profile?.resumeParsed && (
            <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-2xl">
              <h3 className="text-sm font-semibold text-white/90">📄 Upload your resume</h3>
              <p className="mt-1 text-sm text-white/60">Parse it once to apply faster and improve matching.</p>
              <form onSubmit={handleResumeUpload} className="mt-4 space-y-3">
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  required
                  className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white file:hover:bg-white/15"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!resumeFile || uploadingResume}
                >
                  {uploadingResume ? 'Parsing…' : 'Upload & Parse'}
                </button>
              </form>
            </div>
          )}
        </aside>

        {/* Main */}
        <main>
          {message.text && (
            <div
              className={`mb-5 rounded-2xl border px-4 py-3 text-sm flex items-start justify-between gap-3 ${
                message.type === 'success'
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                  : 'border-rose-400/30 bg-rose-400/10 text-rose-100'
              }`}
            >
              <span>{message.text}</span>
              <button
                onClick={() => setMessage({ type: '', text: '' })}
                className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white/80 hover:bg-white/10"
                type="button"
              >
                ×
              </button>
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-2 shadow-2xl inline-flex">
            <button
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'jobs' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setActiveTab('jobs')}
              type="button"
            >
              Available Jobs ({jobs.length})
            </button>
            <button
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'applications' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setActiveTab('applications')}
              type="button"
            >
              My Applications ({applications.length})
            </button>
          </div>

          {activeTab === 'jobs' && (
            <div className="mt-5 grid grid-cols-1 gap-4">
              {jobs.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 text-center text-white/70 shadow-2xl">
                  No jobs available at the moment.
                </div>
              ) : (
                jobs.map((job) => {
                  const applied = hasApplied(job._id);
                  const deadlineText = job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A';
                  const match = job.match;
                  const scorePct = typeof match?.score === 'number' ? match.score * 100 : null;
                  const expPct = typeof match?.breakdown?.experience === 'number' ? match.breakdown.experience * 100 : null;
                  const skillsPct = typeof match?.breakdown?.skills === 'number' ? match.breakdown.skills * 100 : null;
                  const projectsPct = typeof match?.breakdown?.projects === 'number' ? match.breakdown.projects * 100 : null;
                  const semanticPct = typeof match?.breakdown?.semantic === 'number' ? match.breakdown.semantic * 100 : null;
                  return (
                    <div key={job._id} className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-2xl transition hover:bg-white/12">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold">{job.title}</h3>
                          <p className="mt-1 text-sm text-white/60">{job.company}</p>
                        </div>
                        <div className="text-sm text-white/70">📍 {job.location || 'Remote'}</div>
                      </div>

                      {profile?.resumeParsed && scorePct !== null && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                            <div className="text-3xl font-extrabold">{scorePct.toFixed(0)}%</div>
                            <div className="mt-1 text-xs text-white/60">AI Semantic Match</div>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-sm font-semibold text-white/90">Semantic Breakdown</div>
                            <div className="mt-4 space-y-3">
                              <div>
                                <div className="flex items-center justify-between text-xs text-white/70">
                                  <span>Experience</span>
                                  <span>{expPct !== null ? `${expPct.toFixed(0)}%` : '—'}</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div className="h-full bg-pink-400 transition-all" style={{ width: `${Math.max(0, Math.min(100, expPct || 0))}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-xs text-white/70">
                                  <span>Skills</span>
                                  <span>{skillsPct !== null ? `${skillsPct.toFixed(0)}%` : '—'}</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div className="h-full bg-emerald-400 transition-all" style={{ width: `${Math.max(0, Math.min(100, skillsPct || 0))}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-xs text-white/70">
                                  <span>Projects</span>
                                  <span>{projectsPct !== null ? `${projectsPct.toFixed(0)}%` : '—'}</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div className="h-full bg-pink-300 transition-all" style={{ width: `${Math.max(0, Math.min(100, projectsPct || 0))}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between text-xs text-white/70">
                                  <span>Overall</span>
                                  <span>{semanticPct !== null ? `${semanticPct.toFixed(0)}%` : '—'}</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                                  <div className="h-full bg-emerald-300 transition-all" style={{ width: `${Math.max(0, Math.min(100, semanticPct || 0))}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="mt-4 text-sm text-white/75">
                        {(job.description || '').length > 220
                          ? `${job.description.substring(0, 220)}…`
                          : job.description}
                      </p>

                      {job.skills?.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.skills.slice(0, 10).map((skill, idx) => (
                            <span key={idx} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                              {skill}
                            </span>
                          ))}
                          {job.skills.length > 10 && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                              +{job.skills.length - 10}
                            </span>
                          )}
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-white/60">
                        <span>💼 {job.minExperience || 0}+ years experience</span>
                        <span>Deadline: {deadlineText}</span>
                      </div>

                      <div className="mt-5 flex justify-end">
                        <button
                          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                            applied
                              ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30'
                              : 'bg-emerald-500 text-emerald-950 hover:bg-emerald-400'
                          }`}
                          onClick={() => handleApply(job._id)}
                          disabled={applied || !profile?.resumeParsed}
                          type="button"
                          title={!profile?.resumeParsed ? 'Upload & parse your resume to apply' : undefined}
                        >
                          {applied ? '✓ Applied' : 'Apply Now'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div className="mt-5 grid grid-cols-1 gap-4">
              {applications.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 text-center text-white/70 shadow-2xl">
                  You haven&apos;t applied to any jobs yet.
                </div>
              ) : (
                applications.map((app) => {
                  const scorePct = typeof app.score === 'number' ? (app.score * 100) : 0;
                  return (
                    <div key={app._id} className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 shadow-2xl">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">{app.job.title}</h3>
                          <p className="mt-1 text-sm text-white/60">{app.job.company}</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                          {(app.status || 'pending').toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                          <div className="text-3xl font-extrabold">{scorePct.toFixed(0)}%</div>
                          <div className="mt-1 text-xs text-white/60">Match Score</div>
                        </div>

                        <div className="space-y-4">
                          {app.matchedSkills?.length ? (
                            <div>
                              <div className="text-sm font-semibold text-white/90">Matched Skills</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {app.matchedSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {app.missingSkills?.length ? (
                            <div>
                              <div className="text-sm font-semibold text-white/90">Missing Skills</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {app.missingSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs text-rose-100"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-white/60">
                        Applied on {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default JobSeekerDashboard;
