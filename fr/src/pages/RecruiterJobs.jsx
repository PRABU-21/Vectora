import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  recruiterCreateJob,
  recruiterGetJobs,
  recruiterGetApplicants,
  recruiterCloseJob,
  recruiterBulkUpdate,
  recruiterUpdateJob,
  recruiterDeleteJob,
} from "../data/api";
import ParticlesBackground from "../components/ParticlesBackground";
import GoogleTranslate from "../components/GoogleTranslate";
import GooeyNav from "../components/GooeyNav";

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
  const location = useLocation();
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
  const [editModal, setEditModal] = useState({ open: false, job: null, saving: false });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, job: null, deleting: false });

  const navItems = [
    { label: "Profile", href: "/recruiter/profile" },
    { label: "Posted", href: "/recruiter/posted" },
    { label: "Shortlist", href: "/recruiter/shortlist" },
  ];
  const activeNavIndex = navItems.findIndex((item) => location.pathname.startsWith(item.href));

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
      const resp = await recruiterGetJobs();
      setJobs(resp?.jobs || resp || []);
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
        company: form.companyName || form.company,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const resp = await recruiterCreateJob(payload);
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
      const resp = await recruiterGetApplicants(jobId);
      setModal({ open: true, jobId, applicants: resp.applications || [] });
    } catch (err) {
      console.error(err);
      showToast("Failed to load applicants", "error");
    }
  };

  const handleBulk = async (jobId, action, topN) => {
    try {
      await recruiterBulkUpdate(jobId, { action, topN });
      showToast("Bulk update applied");
      if (modal.open && modal.jobId === jobId) openApplicants(jobId);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Bulk update failed", "error");
    }
  };

  const handleCloseJob = async (jobId) => {
    try {
      await recruiterCloseJob(jobId);
      showToast("Job closed");
      loadJobs();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to close job", "error");
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const openEdit = (job) => {
    const deadlineValue = (() => {
      if (!job.deadline) return "";
      const d = new Date(job.deadline);
      if (Number.isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 10);
    })();

    setEditModal({
      open: true,
      saving: false,
      job: {
        ...job,
        companyName: job.companyName || job.company,
        skillsInput: Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || "",
        deadline: deadlineValue,
      },
    });
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    if (!editModal.job) return;
    setEditModal((prev) => ({ ...prev, saving: true }));
    try {
      const payload = {
        title: editModal.job.title,
        company: editModal.job.companyName || editModal.job.company,
        location: editModal.job.location,
        description: editModal.job.description,
        skills: (editModal.job.skillsInput || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        minExperience: editModal.job.minExperience,
        durationMonths: editModal.job.durationMonths,
        deadline: editModal.job.deadline,
        status: editModal.job.status,
      };
      await recruiterUpdateJob(editModal.job._id || editModal.job.id, payload);
      showToast("Job updated");
      setEditModal({ open: false, job: null, saving: false });
      loadJobs();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to update job", "error");
      setEditModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const requestDelete = (job) => {
    setDeleteConfirm({ open: true, job, deleting: false });
  };

  const handleDeleteJob = async () => {
    if (!deleteConfirm.job) return;
    setDeleteConfirm((prev) => ({ ...prev, deleting: true }));
    try {
      await recruiterDeleteJob(deleteConfirm.job._id || deleteConfirm.job.id);
      showToast("Job deleted");
      setDeleteConfirm({ open: false, job: null, deleting: false });
      loadJobs();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Failed to delete job", "error");
      setDeleteConfirm((prev) => ({ ...prev, deleting: false }));
    }
  };

  const parsedJobs = useMemo(() => {
    return (jobs || []).map((j) => {
      const base = j.job ? { ...j.job, ...j } : { ...j };
      const counts = {
        total: base.totalApplications ?? base.counts?.total ?? 0,
        pending: base.pendingCount ?? base.counts?.pending ?? 0,
        selected: base.selectedCount ?? base.counts?.selected ?? 0,
      };

      return {
        ...base,
        title: base.title || base.jobRoleName,
        companyName: base.company || base.companyName,
        counts,
      };
    });
  }, [jobs]);

  const dashboardStats = useMemo(() => {
    const totalJobs = parsedJobs.length;
    const openJobs = parsedJobs.filter((j) => j.status === "open").length;
    const totalApplicants = parsedJobs.reduce((sum, j) => sum + (j.counts.total || 0), 0);
    return { totalJobs, openJobs, totalApplicants };
  }, [parsedJobs]);

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
              <GooeyNav
                items={navItems}
                activeIndex={activeNavIndex >= 0 ? activeNavIndex : 0}
                onSelect={(_, item) => navigate(item.href)}
              />
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

        <section className="grid lg:grid-cols-3 gap-6">
          

          <div className="lg:col-span-2 bg-white border border-gray-100 shadow-lg rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Create a new role</h3>
                <p className="text-gray-500 text-sm">Add a role and instantly share it with candidates.</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">Semantic matching enabled</span>
            </div>
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                Job title
                <input
                  required
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Senior Frontend Engineer"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                Company
                <input
                  required
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Vectora Labs"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                Location
                <input
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Remote"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                Type
                <input
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Full-time"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                Salary
                <input
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="Not specified"
                  value={form.salary}
                  onChange={(e) => setForm({ ...form, salary: e.target.value })}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                Skills (comma separated)
                <input
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="React, Node.js, AWS"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                Min experience (years)
                <input
                  type="number"
                  min="0"
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="0"
                  value={form.minExperience}
                  onChange={(e) => setForm({ ...form, minExperience: e.target.value })}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                Duration months (optional)
                <input
                  type="number"
                  min="0"
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="2"
                  value={form.durationMonths}
                  onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                />
              </label>
              <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                Deadline
                <input
                  type="date"
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </label>
              <label className="md:col-span-2 flex flex-col text-sm font-medium text-gray-700 gap-1">
                Description
                <textarea
                  required
                  rows={4}
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-500"
                  placeholder="What will this role own?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
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
          </div>
        </section>
      </main>

      {editModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Edit role</h4>
                <p className="text-sm text-gray-500">Update details and save to refresh embeddings.</p>
              </div>
              <button
                className="text-gray-500 hover:text-gray-800"
                onClick={() => setEditModal({ open: false, job: null, saving: false })}
              >
                ✕
              </button>
            </div>
            {editModal.job && (
              <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleUpdateJob}>
                <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                  Job title
                  <input
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editModal.job.title}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, job: { ...prev.job, title: e.target.value } }))}
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                  Company
                  <input
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editModal.job.companyName}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, job: { ...prev.job, companyName: e.target.value } }))}
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                  Location
                  <input
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editModal.job.location}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, job: { ...prev.job, location: e.target.value } }))}
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                  Deadline
                  <input
                    type="date"
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editModal.job.deadline || ""}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, job: { ...prev.job, deadline: e.target.value } }))}
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                  Min experience (years)
                  <input
                    type="number"
                    min="0"
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editModal.job.minExperience}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, job: { ...prev.job, minExperience: e.target.value } }))}
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                  Duration months
                  <input
                    type="number"
                    min="1"
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editModal.job.durationMonths}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, job: { ...prev.job, durationMonths: e.target.value } }))}
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 gap-1">
                  Status
                  <select
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editModal.job.status}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, job: { ...prev.job, status: e.target.value } }))}
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="filled">Filled</option>
                  </select>
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 gap-1 md:col-span-2">
                  Skills (comma separated)
                  <input
                    className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editModal.job.skillsInput || ""}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, job: { ...prev.job, skillsInput: e.target.value } }))}
                  />
                </label>
                <label className="flex flex-col text-sm font-medium text-gray-700 gap-1 md:col-span-2">
                  Description
                  <textarea
                    rows={4}
                    className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={editModal.job.description}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, job: { ...prev.job, description: e.target.value } }))}
                  />
                </label>
                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => setEditModal({ open: false, job: null, saving: false })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editModal.saving}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-700 text-white font-semibold shadow hover:from-sky-700 hover:to-indigo-800 disabled:opacity-60"
                  >
                    {editModal.saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {deleteConfirm.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Delete this role?</h4>
            <p className="text-sm text-gray-600">
              This will remove the role and its applications. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                onClick={() => setDeleteConfirm({ open: false, job: null, deleting: false })}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold shadow hover:bg-red-700 disabled:opacity-60"
                onClick={handleDeleteJob}
                disabled={deleteConfirm.deleting}
              >
                {deleteConfirm.deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

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