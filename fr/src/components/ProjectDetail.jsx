import React, { useEffect, useMemo, useState } from "react";
import { getStatusColor, SUBMISSION_STATUSES } from "../utils/statusUtils";
import {
  createPaymentOrder,
  getProposalsByProject,
  submitProposalWork,
  updateProposalStatus,
  verifyPayment,
} from "../data/api";
import {
  Clock,
  Calendar,
  DollarSign,
  MapPin,
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Send,
  Github,
  Globe,
  Briefcase,
  ShieldCheck,
  CreditCard
} from "lucide-react";

const formatLinkText = (url) => {
  if (!url) return "";
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname;
  } catch (_err) {
    return url;
  }
};

const ProjectDetail = ({ project, onBack, onApply, userProposals = [] }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);
  const [incomingProposals, setIncomingProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [proposalError, setProposalError] = useState(null);
  const [applyForm, setApplyForm] = useState({
    expectedCost: "",
    expectedDelivery: "",
    description: "",
    portfolioLink: "",
  });
  const [applyError, setApplyError] = useState(null);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [solutionForm, setSolutionForm] = useState({
    deliveryUrl: "",
    githubUrl: "",
  });
  const [solutionError, setSolutionError] = useState(null);
  const [solutionSubmitting, setSolutionSubmitting] = useState(false);
  const [acknowledgedUpdates, setAcknowledgedUpdates] = useState(false);
  const [paymentLoadingId, setPaymentLoadingId] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });
  };

  const currentUserId = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw)?._id : null;
    } catch (err) {
      return null;
    }
  })();

  const projectOwnerId =
    project?.postedBy?._id || project?.postedBy?.id || project?.postedBy;
  const isOwner = Boolean(
    currentUserId &&
    projectOwnerId &&
    String(projectOwnerId) === String(currentUserId),
  );

  const myProposalFromProps = useMemo(() => {
    if (!userProposals || !project) return null;
    return (
      userProposals.find((p) => {
        const pid = p.projectId?._id || p.projectId?.id || p.projectId;
        return pid && (pid === project._id || pid === project.id);
      }) || null
    );
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
      if (!project?.deadline)
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      const deadline = new Date(project.deadline);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      const expiredNow =
        remaining.days <= 0 &&
        remaining.hours <= 0 &&
        remaining.minutes <= 0 &&
        remaining.seconds <= 0;
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
      const updated = await updateProposalStatus(proposalId, { status });
      setIncomingProposals((prev) =>
        prev.map((p) =>
          p._id === proposalId
            ? { ...p, status: updated?.status ?? status }
            : p,
        ),
      );
    } catch (err) {
      setProposalError("Could not update proposal status. Please try again.");
    }
  };

  const handlePayAndComplete = async (proposal) => {
    setPaymentError(null);
    setPaymentLoadingId(proposal._id);
    try {
      await loadRazorpayScript();

      const orderResp = await createPaymentOrder(
        proposal._id,
        proposal.expectedCost,
      );
      const { orderId, amount, currency, keyId } = orderResp || {};
      if (!orderId || !keyId) {
        throw new Error("Missing Razorpay order details.");
      }

      const options = {
        key: keyId,
        amount,
        currency,
        name: "Vectora",
        description: `Payment for ${project?.title || "Project"}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyResp = await verifyPayment({
              proposalId: proposal._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            const updatedProposal = verifyResp?.proposal || proposal;
            setIncomingProposals((prev) =>
              prev.map((p) =>
                p._id === proposal._id
                  ? {
                    ...p,
                    ...updatedProposal,
                    status:
                      updatedProposal.status || SUBMISSION_STATUSES.COMPLETED,
                  }
                  : p,
              ),
            );
          } catch (err) {
            setPaymentError(
              "Payment verified but updating state failed. Please refresh.",
            );
          }
        },
        prefill: {
          name: project?.postedBy?.name || "",
        },
        theme: { color: "#ef4444" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setPaymentError("Payment failed or was cancelled.");
      });
      rzp.open();
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      setPaymentError(
        backendMessage || err.message || "Could not start payment.",
      );
    } finally {
      setPaymentLoadingId(null);
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
    if (
      !applyForm.expectedCost ||
      !applyForm.expectedDelivery ||
      !applyForm.description
    ) {
      setApplyError(
        "Please fill in cost, delivery timeline, and a brief description.",
      );
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
      setApplyForm({
        expectedCost: "",
        expectedDelivery: "",
        description: "",
        portfolioLink: "",
      });
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
      setMyProposal((prev) => ({
        ...(prev || {}),
        ...(updated || {}),
        status: updated?.status || SUBMISSION_STATUSES.SUBMITTED_WORK,
      }));
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

  // New Components for Redesign
  const TimerBox = ({ value, label }) => (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-xl p-3 min-w-[70px] border border-white/20">
      <span className="text-2xl font-bold text-white tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="text-xs text-red-100 uppercase tracking-widest">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-red-600 to-rose-700 pb-24 pt-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="relative max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="group flex items-center text-red-100 hover:text-white font-medium mb-8 transition-colors"
          >
            <div className="bg-white/10 p-2 rounded-full mr-3 group-hover:bg-white/20 transition-all">
              <ArrowLeft className="w-5 h-5" />
            </div>
            Back to Projects
          </button>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-4 py-1.5 text-sm font-bold rounded-full border shadow-sm ${project.status === 'Open' ? 'bg-green-400/20 text-white border-green-400/30' :
                  'bg-white/20 text-white border-white/30'
                  }`}>
                  {project.status || 'Active'}
                </span>
                {isUrgent && (
                  <span className="px-4 py-1.5 text-sm font-bold rounded-full bg-red-500 text-white shadow-lg animate-pulse">
                    URGENT
                  </span>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 shadow-sm">
                {project.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-red-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>Posted {project.postedDate ? new Date(project.postedDate).toLocaleDateString() : "Recently"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span>{isOwner ? "You (Owner)" : project.postedBy?.name || "Client"}</span>
                </div>
              </div>
            </div>

            {/* Timer */}
            {!isExpired && project.deadline && (
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-2xl">
                <p className="text-red-100 text-sm font-medium mb-4 text-center">Time Remaining</p>
                <div className="flex gap-2">
                  <TimerBox value={timeLeft.days} label="Days" />
                  <span className="text-2xl text-white/50 pt-2">:</span>
                  <TimerBox value={timeLeft.hours} label="Hrs" />
                  <span className="text-2xl text-white/50 pt-2">:</span>
                  <TimerBox value={timeLeft.minutes} label="Mins" />
                  <span className="text-2xl text-white/50 pt-2">:</span>
                  <TimerBox value={timeLeft.seconds} label="Secs" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Details & Scripts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-red-500" />
                Project Details
              </h2>
              <div className="prose prose-red max-w-none text-gray-600 leading-relaxed">
                {project.description}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {(project.skills || []).map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-700 border border-red-100 hover:bg-red-100 transition-colors cursor-default">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Proposals Section (Owner Only) */}
            {isOwner && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User className="w-6 h-6 text-red-500" />
                    Incoming Proposals
                  </h2>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                    {incomingProposals.length} Applicants
                  </span>
                </div>

                {loadingProposals ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  </div>
                ) : incomingProposals.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No proposals yet. Check back later!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incomingProposals.map((p) => (
                      <div key={p._id} className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-red-200 transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg text-gray-900">{p.freelancerId?.name || "Freelancer"}</h3>
                              <a
                                href="https://jaisanth.tech/"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-indigo-600 hover:underline break-all"
                              >
                                portfolio
                              </a>
                              {p.portfolioLink && (
                                <a
                                  href={p.portfolioLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-indigo-600 hover:underline break-all"
                                >
                                  {formatLinkText(p.portfolioLink)}
                                </a>
                              )}
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(p.status)}`}>
                                {p.status === SUBMISSION_STATUSES.COMPLETED ? "PAID & COMPLETED" : p.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2">{p.description}</p>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" />{p.expectedCost}</div>
                              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{p.expectedDelivery} days</div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 justify-center min-w-[140px]">
                            {p.status === SUBMISSION_STATUSES.ACCEPTED && (
                              <button onClick={() => handleProposalStatus(p._id, SUBMISSION_STATUSES.NEEDS_UPDATES)} className="btn-secondary text-xs py-2 w-full bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg font-medium">Request Updates</button>
                            )}
                            {/* Simple approve/reject actions */}
                            {!['Accepted', 'Needs Updates', 'Completed', 'Rejected', 'Submitted Work'].includes(p.status) && (
                              <>
                                <button onClick={() => handleProposalStatus(p._id, SUBMISSION_STATUSES.ACCEPTED)} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 shadow-sm">Accept Proposal</button>
                                <button onClick={() => handleProposalStatus(p._id, SUBMISSION_STATUSES.REJECTED)} className="w-full py-2 bg-white text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50">Reject</button>
                              </>
                            )}

                            {p.status === SUBMISSION_STATUSES.SUBMITTED_WORK && (
                              <button onClick={() => handlePayAndComplete(p)} disabled={paymentLoadingId === p._id} className="btn-primary text-xs py-2 w-full bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium shadow-md shadow-indigo-200 mt-2">
                                {paymentLoadingId === p._id ? "Processing..." : "Pay & Complete"}
                              </button>
                            )}
                            {/* Show submitted work details */}
                            {p.deliveryUrl && (
                              <div className="mt-2 pt-2 border-t border-gray-100 w-full">
                                <a href={p.deliveryUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-indigo-600 hover:underline mb-1"><Globe className="w-3 h-3" /> View Deployment</a>
                                <a href={p.deliveryNote} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-gray-600 hover:underline"><Github className="w-3 h-3" /> View Code</a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-8">
            {/* Budget & Timeline Card */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-xl"><DollarSign className="w-6 h-6" /></div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Budget</p>
                      <p className="text-lg font-bold text-gray-900">${project.minBudget} - ${project.maxBudget}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Clock className="w-6 h-6" /></div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Duration</p>
                      <p className="text-lg font-bold text-gray-900">{project.duration} Weeks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Application / Status Card (Freelancer Only) */}
            {!isOwner && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Send className="w-24 h-24 text-red-500 transform rotate-12" /></div>

                <h2 className="text-xl font-bold text-gray-900 mb-6 relative z-10">
                  {myProposal ? "Your Application" : "Apply Now"}
                </h2>

                {myProposal ? (
                  <div className="relative z-10 space-y-6">
                    <div className={`p-4 rounded-xl border-l-4 ${myProposal.status === 'Accepted' ? 'bg-green-50 border-green-500 text-green-700' :
                      myProposal.status === 'Rejected' ? 'bg-red-50 border-red-500 text-red-700' :
                        'bg-blue-50 border-blue-500 text-blue-700'
                      }`}>
                      <p className="font-semibold text-sm">Status: {myProposal.status === SUBMISSION_STATUSES.COMPLETED ? "PAID & COMPLETED" : myProposal.status}</p>
                      <p className="text-xs mt-1 opacity-80">Submitted on {new Date(myProposal.submittedAt).toLocaleDateString()}</p>
                    </div>

                    {/* Work Submission Form */}
                    {(['Accepted', 'Needs Updates', 'Submitted Work'].includes(myProposal.status)) && (
                      <div className="pt-4 border-t border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /> Submit Work</h3>

                        {myProposal.status === 'Needs Updates' && !acknowledgedUpdates && (
                          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800 mb-4 flex flex-col gap-2">
                            <p>Client requested changes. Please review.</p>
                            <button onClick={() => setAcknowledgedUpdates(true)} className="text-xs font-bold underline text-left">Acknowledge & Submit Update</button>
                          </div>
                        )}

                        {(!['Needs Updates'].includes(myProposal.status) || acknowledgedUpdates) && (
                          <form onSubmit={handleSolutionSubmit} className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Live URL</label>
                              <div className="relative">
                                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input type="url" value={solutionForm.deliveryUrl} onChange={e => setSolutionForm({ ...solutionForm, deliveryUrl: e.target.value })} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="https://myapp.com" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">GitHub URL</label>
                              <div className="relative">
                                <Github className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input type="url" value={solutionForm.githubUrl} onChange={e => setSolutionForm({ ...solutionForm, githubUrl: e.target.value })} className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="https://github.com/..." />
                              </div>
                            </div>
                            <button type="submit" disabled={solutionSubmitting} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition-colors shadow-lg">
                              {solutionSubmitting ? "Submitting..." : "Submit Deliverables"}
                            </button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleApplySubmit} className="relative z-10 space-y-4">
                    {applyError && <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg">{applyError}</div>}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">My Bid ($)</label>
                        <input type="number" value={applyForm.expectedCost} onChange={e => setApplyForm({ ...applyForm, expectedCost: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="1000" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Days</label>
                        <input type="number" value={applyForm.expectedDelivery} onChange={e => setApplyForm({ ...applyForm, expectedDelivery: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="7" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Proposal</label>
                      <textarea rows="3" value={applyForm.description} onChange={e => setApplyForm({ ...applyForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none" placeholder="I am the best fit..." />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Portfolio (Optional)</label>
                      <input type="url" value={applyForm.portfolioLink} onChange={e => setApplyForm({ ...applyForm, portfolioLink: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" placeholder="https://" />
                    </div>

                    <button type="submit" disabled={applySubmitting} className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 rounded-xl font-bold text-sm hover:shadow-lg hover:scale-[1.02] transition-all">
                      {applySubmitting ? "Sending..." : "Submit Proposal"}
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Safe Payments</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Funds are held securely until work is approved.
                  </p>
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
