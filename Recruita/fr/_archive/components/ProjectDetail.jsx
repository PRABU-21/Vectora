import React, { useEffect, useMemo, useState } from "react";
import { getStatusColor, SUBMISSION_STATUSES } from "../utils/statusUtils";
import { getProposalsByProject, submitProposalWork, updateProposalStatus } from "../data/api";

const ProjectDetail = ({ project, onBack, onApply, userProposals = [] }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [incomingProposals, setIncomingProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalError, setProposalError] = useState(null);
  const [applyForm, setApplyForm] = useState({ expectedCost: "", expectedDelivery: "", description: "", portfolioLink: "" });
  const [applyError, setApplyError] = useState(null);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [solutionForm, setSolutionForm] = useState({ deliveryUrl: "", githubUrl: "" });
  const [solutionError, setSolutionError] = useState(null);
  const [solutionSubmitting, setSolutionSubmitting] = useState(false);
  const [acknowledgedUpdates, setAcknowledgedUpdates] = useState(false);

  const currentUserId = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw)?._id : null;
    } catch (err) {
      return null;
    }
  })();

  const projectOwnerId = project?.postedBy?._id || project?.postedBy?.id || project?.postedBy;
  const isOwner = Boolean(currentUserId && projectOwnerId && String(projectOwnerId) === String(currentUserId));
  const myProposalFromProps = useMemo(() => {
    if (!userProposals || !project) return null;
    return userProposals.find((p) => {
      const pid = p.projectId?._id || p.projectId?.id || p.projectId;
      return pid && (pid === project._id || pid === project.id);
    }) || null;
  }, [userProposals, project]);

  const [myProposal, setMyProposal] = useState(myProposalFromProps);

  useEffect(() => {
    setMyProposal(myProposalFromProps);
  }, [myProposalFromProps]);

  useEffect(() => {
    if (myProposal?.status === SUBMISSION_STATUSES.NEEDS_UPDATES) {
      setAcknowledgedUpdates(false);
    }
  }, [myProposal?.status]);

  const alreadyApplied = !isOwner && Boolean(myProposal);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!project?.deadline) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      const deadline = new Date(project.deadline);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      const expiredNow = remaining.days <= 0 && remaining.hours <= 0 && remaining.minutes <= 0 && remaining.seconds <= 0;
      setIsExpired(expiredNow);
    }, 1000);

    return () => clearInterval(timer);
  }, [project?.deadline]);

  useEffect(() => {
    const fetchProposals = async () => {
      if (!project?._id || !isOwner) {
        setIncomingProposals([]);
        return;
      }
      setLoadingProposals(true);
      setProposalError(null);
      try {
        const result = await getProposalsByProject(project._id);
        setIncomingProposals(result || []);
      } catch (err) {
        setProposalError("Unable to load proposals right now.");
      } finally {
        setLoadingProposals(false);
      }
    };

    fetchProposals();
  }, [project?._id, isOwner]);

  const handleProposalStatus = async (proposalId, status) => {
    setProposalError(null);
    try {
      // Send status as an object so backend JSON parser receives a valid payload
      const updated = await updateProposalStatus(proposalId, { status });
      setIncomingProposals((prev) => prev.map((p) => (p._id === proposalId ? { ...p, status: updated?.status ?? status } : p)));
    } catch (err) {
      setProposalError("Could not update proposal status. Please try again.");
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError(null);
    if (alreadyApplied) {
      setApplyError("You have already applied to this project.");
      return;
    }
    if (!onApply) {
      setApplyError("Apply action is unavailable.");
      return;
    }
    if (!applyForm.expectedCost || !applyForm.expectedDelivery || !applyForm.description) {
      setApplyError("Please fill in cost, delivery timeline, and a brief description.");
      return;
    }

    setApplySubmitting(true);
    try {
      const created = await onApply({
        ...applyForm,
        projectId: project._id || project.id,
        proposalText: applyForm.description,
      });
      if (created) {
        setMyProposal(created);
      }
      setApplyForm({ expectedCost: "", expectedDelivery: "", description: "", portfolioLink: "" });
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      setApplyError(backendMessage || "Could not submit proposal.");
    } finally {
      setApplySubmitting(false);
    }
  };

  const handleSolutionSubmit = async (e) => {
    e.preventDefault();
    if (!myProposal) return;
    setSolutionError(null);

    setSolutionSubmitting(true);
    try {
      if (!solutionForm.deliveryUrl || !solutionForm.githubUrl) {
        setSolutionError("Please provide both deployment and GitHub URLs.");
        return;
      }

      const updated = await submitProposalWork(myProposal._id, {
        deliveryUrl: solutionForm.deliveryUrl,
        githubUrl: solutionForm.githubUrl,
      });
      setMyProposal((prev) => ({ ...(prev || {}), ...(updated || {}), status: updated?.status || SUBMISSION_STATUSES.SUBMITTED_WORK }));
      setSolutionForm({ deliveryUrl: "", githubUrl: "" });
      setAcknowledgedUpdates(false);
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      setSolutionError(backendMessage || "Could not submit work.");
    } finally {
      setSolutionSubmitting(false);
    }
  };

  const isUrgent = timeLeft.days <= 3 && !isExpired;
  const canSubmitWork = [
    SUBMISSION_STATUSES.ACCEPTED,
    SUBMISSION_STATUSES.IN_PROGRESS,
    SUBMISSION_STATUSES.NEEDS_UPDATES,
  ].includes(myProposal?.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-red-600 hover:text-red-800 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Projects
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className={`p-6 border-b ${isUrgent ? "bg-red-50 border-red-200" : "bg-white border-gray-200"}`}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  {isUrgent && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                      URGENT
                    </span>
                  )}
                </div>

                <div className={`text-sm ${isUrgent ? "text-red-600" : "text-gray-600"} mb-4`}>
                  <span className="font-medium">Deadline:</span> {project.deadline ? new Date(project.deadline).toLocaleDateString() : "N/A"}
                  {!isExpired && project.deadline && (
                    <span className="ml-2">Time left: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s</span>
                  )}
                  {isExpired && (
                    <span className="ml-2 text-red-600 font-medium">EXPIRED</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-sm text-gray-500">Posted: {project.postedDate ? new Date(project.postedDate).toLocaleDateString() : "N/A"}</div>
                <div className="text-xs text-gray-500">{isOwner ? "Owner view" : "Freelancer view"}</div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Project Description</h2>
                  <p className="text-gray-700 leading-relaxed">{project.description}</p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {(project.skills || []).map((skill, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {isOwner ? (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Incoming Proposals</h3>
                      <div className="text-xs text-gray-500">{incomingProposals.length} total</div>
                    </div>
                    {loadingProposals ? (
                      <div className="text-sm text-gray-600">Loading proposals...</div>
                    ) : proposalError ? (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{proposalError}</div>
                    ) : incomingProposals.length === 0 ? (
                      <div className="text-sm text-gray-600">No proposals yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {incomingProposals.map((p) => (
                          <div key={p._id} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-semibold text-gray-900">{p.freelancerId?.name || "Freelancer"}</span>
                                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(p.status)}`}>{p.status}</span>
                                </div>
                                <div className="text-sm text-gray-700 mb-2">{p.description}</div>
                                <div className="text-xs text-gray-600 space-x-3 flex flex-wrap gap-2">
                                  <span>Cost: ${p.expectedCost}</span>
                                  <span>Delivery: {p.expectedDelivery} days</span>
                                  <span>Submitted: {new Date(p.submittedAt).toLocaleDateString()}</span>
                                </div>
                                {p.deliveryUrl && (
                                  <div className="mt-2 text-xs">
                                    <span className="font-semibold">Deployment: </span>
                                    <a className="text-indigo-600 break-all" href={p.deliveryUrl} target="_blank" rel="noreferrer">{p.deliveryUrl}</a>
                                  </div>
                                )}
                                {p.deliveryNote && (
                                  <div className="mt-1 text-xs text-gray-700">
                                    <span className="font-semibold">GitHub: </span>
                                    <a className="text-indigo-600 break-all" href={p.deliveryNote} target="_blank" rel="noreferrer">{p.deliveryNote}</a>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2 text-xs">
                                {p.status === SUBMISSION_STATUSES.ACCEPTED && (
                                  <>
                                    <button
                                      onClick={() => handleProposalStatus(p._id, SUBMISSION_STATUSES.NEEDS_UPDATES)}
                                      className="px-3 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100"
                                    >Needs Updates</button>
                                    <button
                                      onClick={() => handleProposalStatus(p._id, SUBMISSION_STATUSES.COMPLETED)}
                                      className="px-3 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                                    >Mark Completed</button>
                                  </>
                                )}

                                {p.status === SUBMISSION_STATUSES.NEEDS_UPDATES && (
                                  <button
                                    onClick={() => handleProposalStatus(p._id, SUBMISSION_STATUSES.COMPLETED)}
                                    className="px-3 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                                  >Mark Completed</button>
                                )}

                                {p.status !== SUBMISSION_STATUSES.ACCEPTED &&
                                 p.status !== SUBMISSION_STATUSES.NEEDS_UPDATES &&
                                 p.status !== SUBMISSION_STATUSES.COMPLETED &&
                                 p.status !== SUBMISSION_STATUSES.REJECTED && (
                                  <>
                                    <button
                                      onClick={() => handleProposalStatus(p._id, SUBMISSION_STATUSES.ACCEPTED)}
                                      className="px-3 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                    >Accept / In Progress</button>
                                    <button
                                      onClick={() => handleProposalStatus(p._id, SUBMISSION_STATUSES.NEEDS_UPDATES)}
                                      className="px-3 py-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100"
                                    >Needs Updates</button>
                                    <button
                                      onClick={() => handleProposalStatus(p._id, SUBMISSION_STATUSES.REJECTED)}
                                      className="px-3 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                    >Reject</button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    {!myProposal ? (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Apply to this project</h3>
                          <div className="text-xs text-gray-500">Status: {project.status}</div>
                        </div>

                        {applyError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-3">{applyError}</div>
                        )}

                        <form className="space-y-3" onSubmit={handleApplySubmit}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Expected Cost (USD)</label>
                              <input
                                type="number"
                                min="0"
                                value={applyForm.expectedCost}
                                onChange={(e) => setApplyForm((prev) => ({ ...prev, expectedCost: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="e.g. 1200"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-700 mb-1">Delivery (days)</label>
                              <input
                                type="number"
                                min="1"
                                value={applyForm.expectedDelivery}
                                onChange={(e) => setApplyForm((prev) => ({ ...prev, expectedDelivery: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="e.g. 7"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Proposal Summary</label>
                            <textarea
                              value={applyForm.description}
                              onChange={(e) => setApplyForm((prev) => ({ ...prev, description: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              rows={4}
                              placeholder="Briefly explain your approach and experience."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Portfolio / Work Link (optional)</label>
                            <input
                              type="url"
                              value={applyForm.portfolioLink}
                              onChange={(e) => setApplyForm((prev) => ({ ...prev, portfolioLink: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder="https://"
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{project.applicants ?? 0} proposals submitted</span>
                            <span>Posted: {project.postedDate ? new Date(project.postedDate).toLocaleDateString() : "N/A"}</span>
                          </div>

                          <button
                            type="submit"
                            disabled={applySubmitting}
                            className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-60"
                          >
                            {applySubmitting ? "Submitting..." : "Submit Proposal"}
                          </button>
                        </form>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Deliver your work</h3>
                          <div className="text-xs text-gray-500">Status: {myProposal.status}</div>
                        </div>

                        {myProposal.status === SUBMISSION_STATUSES.SUBMITTED_WORK && (
                          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm mb-3">
                            Work submitted. Awaiting client review.
                            {myProposal.deliverySubmittedAt && (
                              <span className="ml-2 text-green-900">Last submitted: {new Date(myProposal.deliverySubmittedAt).toLocaleDateString()}</span>
                            )}
                            <div className="mt-2 space-y-1 text-gray-800">
                              {myProposal.deliveryUrl && (
                                <div className="text-xs">
                                  <span className="font-semibold">Deployment: </span>
                                  <a className="text-indigo-600 break-all" href={myProposal.deliveryUrl} target="_blank" rel="noreferrer">{myProposal.deliveryUrl}</a>
                                </div>
                              )}
                              {myProposal.deliveryNote && (
                                <div className="text-xs">
                                  <span className="font-semibold">GitHub: </span>
                                  <a className="text-indigo-600 break-all" href={myProposal.deliveryNote} target="_blank" rel="noreferrer">{myProposal.deliveryNote}</a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {!canSubmitWork && myProposal.status !== SUBMISSION_STATUSES.SUBMITTED_WORK && (
                          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm mb-3">
                            Your proposal is currently "{myProposal.status}". You can submit work after the client accepts or requests updates.
                          </div>
                        )}

                        {myProposal.status === SUBMISSION_STATUSES.NEEDS_UPDATES && (
                          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm mb-3">
                            Owner requested updates. Please review feedback and resubmit.
                            {!acknowledgedUpdates && (
                              <button
                                type="button"
                                onClick={() => setAcknowledgedUpdates(true)}
                                className="ml-3 px-3 py-1 text-xs rounded bg-white text-yellow-800 border border-yellow-300 hover:bg-yellow-100"
                              >I saw the updates</button>
                            )}
                          </div>
                        )}

                        {solutionError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-3">{solutionError}</div>
                        )}

                        {canSubmitWork && (
                        <form
                          className="space-y-3"
                          onSubmit={handleSolutionSubmit}
                          aria-disabled={!canSubmitWork}
                        >
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Deployment URL</label>
                            <input
                              type="url"
                              value={solutionForm.deliveryUrl}
                              onChange={(e) => setSolutionForm((prev) => ({ ...prev, deliveryUrl: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder="https://your-live-app.com"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">GitHub URL</label>
                            <input
                              type="url"
                              value={solutionForm.githubUrl}
                              onChange={(e) => setSolutionForm((prev) => ({ ...prev, githubUrl: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                              placeholder="https://github.com/your-repo"
                              required
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Last status: {myProposal.status}</span>
                            {myProposal.deliverySubmittedAt && (
                              <span>Last submitted: {new Date(myProposal.deliverySubmittedAt).toLocaleDateString()}</span>
                            )}
                          </div>

                          <button
                            type="submit"
                            disabled={
                              solutionSubmitting ||
                              (myProposal.status === SUBMISSION_STATUSES.NEEDS_UPDATES && !acknowledgedUpdates) ||
                              !canSubmitWork
                            }
                            className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-60"
                          >
                            {solutionSubmitting ? "Submitting..." : "Submit Work"}
                          </button>
                        </form>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Project Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium">${project.minBudget} - ${project.maxBudget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{project.duration} weeks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deadline:</span>
                      <span className="font-medium">{project.deadline ? new Date(project.deadline).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Proposals:</span>
                      <span className="font-medium">{project.applicants ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Application Status</h3>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{project.applicants ?? 0}</div>
                    <div className="text-sm text-gray-600">proposals received</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
