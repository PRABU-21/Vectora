import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getMyProposals,
  getProposalsByProject,
  updateProposalStatus,
  getMyProjects,
  updateProject,
  submitProposalWork
} from '../data/api';
import { PROJECT_STATUSES, SUBMISSION_STATUSES, getStatusColor as getProjectStatusColor } from '../utils/statusUtils';

const ProposalManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('my-proposals');
  const [proposals, setProposals] = useState([]);
  const [projectProposals, setProjectProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [myProjects, setMyProjects] = useState([]);
  const [deliveryInputs, setDeliveryInputs] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProposals();
  }, [fetchProposals, navigate]);

  useEffect(() => {
    const loadMyProjects = async () => {
      try {
        const projects = await getMyProjects();
        setMyProjects(projects);
        if (!selectedProjectId && projects.length > 0) {
          setSelectedProjectId(projects[0]._id);
        }
      } catch (err) {
        console.error('Error fetching my projects:', err);
      }
    };

    if (activeTab === 'my-projects') {
      loadMyProjects();
    }
  }, [activeTab, selectedProjectId]);

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'my-proposals') {
        const response = await getMyProposals();
        setProposals(response || []);
      } else if (activeTab === 'my-projects' && selectedProjectId) {
        const response = await getProposalsByProject(selectedProjectId);
        setProjectProposals(response || []);
      }
    } catch (error) {
      setError('Failed to fetch proposals');
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedProjectId]);

  const handleStatusUpdate = async (proposalId, newStatus) => {
    try {
      setError(null);
      const updated = await updateProposalStatus(proposalId, { status: newStatus });
      if (activeTab === 'my-proposals') {
        setProposals(proposals.map(proposal => 
          proposal._id === proposalId ? updated : proposal
        ));
      } else {
        setProjectProposals(projectProposals.map(proposal => 
          proposal._id === proposalId ? updated : proposal
        ));
      }
    } catch (error) {
      setError('Failed to update proposal status');
      console.error('Error updating proposal status:', error);
    }
  };

  const handleSubmitWork = async (proposalId) => {
    const payload = deliveryInputs[proposalId] || {};
    try {
      setError(null);
      const updated = await submitProposalWork(proposalId, payload);
      setProposals(prev => prev.map(p => p._id === proposalId ? updated : p));
    } catch (err) {
      setError('Failed to submit work');
      console.error('Submit work error:', err);
    }
  };

  const setDeliveryField = (proposalId, field, value) => {
    setDeliveryInputs(prev => ({
      ...prev,
      [proposalId]: {
        ...(prev[proposalId] || {}),
        [field]: value
      }
    }));
  };

  const getProposalStatusColor = (status) => {
    switch(status) {
      case SUBMISSION_STATUSES.SUBMITTED:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case SUBMISSION_STATUSES.VIEWED:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case SUBMISSION_STATUSES.SHORTLISTED:
        return 'bg-green-100 text-green-800 border-green-300';
      case SUBMISSION_STATUSES.ACCEPTED:
        return 'bg-green-100 text-green-800 border-green-300';
      case SUBMISSION_STATUSES.REJECTED:
        return 'bg-red-100 text-red-800 border-red-300';
      case SUBMISSION_STATUSES.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case SUBMISSION_STATUSES.NEEDS_UPDATES:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case SUBMISSION_STATUSES.SUBMITTED_WORK:
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case SUBMISSION_STATUSES.COMPLETED:
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const selectedProject = myProjects.find(p => p._id === selectedProjectId);

  const handleMarkProjectCompleted = async (projectId) => {
    try {
      setError(null);
      await updateProject(projectId, { status: PROJECT_STATUSES.COMPLETED });

      setMyProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: PROJECT_STATUSES.COMPLETED } : p));
      setProjectProposals(prev => prev.map(pr => pr.projectId?._id === projectId ? { ...pr, projectId: { ...pr.projectId, status: PROJECT_STATUSES.COMPLETED } } : pr));
      setProposals(prev => prev.map(pr => pr.projectId?._id === projectId ? { ...pr, projectId: { ...pr.projectId, status: PROJECT_STATUSES.COMPLETED } } : pr));
    } catch (err) {
      setError('Failed to mark project as completed');
      console.error('Error completing project:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-rose-600 rounded-xl flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Vectora
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Proposal Management</h1>
          <p className="text-xl text-gray-600">Manage your proposals and project applications</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
          <button
            onClick={() => {
              setActiveTab('my-proposals');
              setSelectedProjectId(null);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'my-proposals'
                ? 'bg-white text-red-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Proposals
          </button>
          <button
            onClick={() => setActiveTab('my-projects')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'my-projects'
                ? 'bg-white text-red-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Projects
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {activeTab === 'my-proposals' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Proposals I've Submitted</h2>
              <div className="text-sm text-gray-500">
                {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} found
              </div>
            </div>

            {proposals.length > 0 ? (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                    {(() => {
                      const hasOwnerAccepted = [SUBMISSION_STATUSES.ACCEPTED, SUBMISSION_STATUSES.IN_PROGRESS, SUBMISSION_STATUSES.NEEDS_UPDATES, SUBMISSION_STATUSES.SUBMITTED_WORK, SUBMISSION_STATUSES.COMPLETED].includes(proposal.status);
                      const displayStatus = proposal.status === SUBMISSION_STATUSES.COMPLETED ? PROJECT_STATUSES.COMPLETED : hasOwnerAccepted ? PROJECT_STATUSES.IN_PROGRESS : 'Awaiting Approval';
                      const badgeColor = displayStatus === PROJECT_STATUSES.IN_PROGRESS || displayStatus === PROJECT_STATUSES.COMPLETED
                        ? getProjectStatusColor(displayStatus)
                        : 'bg-yellow-100 text-yellow-800 border-yellow-300';

                      return (
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {proposal.projectId?.title || 'Untitled Project'}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getProposalStatusColor(proposal.status)}`}>
                                {proposal.status}
                              </span>
                              {proposal.status === SUBMISSION_STATUSES.SUBMITTED_WORK && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getProposalStatusColor(proposal.status)}`}>
                                  Submitted Work
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 mb-3">{proposal.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Cost:</span> ${proposal.expectedCost}
                              </div>
                              <div>
                                <span className="font-medium">Delivery:</span> {proposal.expectedDelivery} days
                              </div>
                              <div>
                                <span className="font-medium">Submitted:</span> {new Date(proposal.submittedAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Project Status:</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${badgeColor}`}>
                                  {displayStatus}
                                </span>
                              </div>
                              {proposal.deliveryUrl && (
                                <div className="col-span-2 text-sm">
                                  <span className="font-medium">Delivery:</span> <a className="text-indigo-600 break-all" href={proposal.deliveryUrl} target="_blank" rel="noreferrer">{proposal.deliveryUrl}</a>
                                </div>
                              )}
                              {proposal.deliveryNote && (
                                <div className="col-span-2 text-sm text-gray-700">
                                  <span className="font-medium">Notes:</span> {proposal.deliveryNote}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex md:flex-col items-start md:items-end gap-2 min-w-[200px] justify-start md:justify-end">
                            <span className="text-xs font-semibold text-gray-500">Project Status</span>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${badgeColor}`}>
                              {displayStatus}
                            </span>
                            {hasOwnerAccepted && proposal.status !== SUBMISSION_STATUSES.COMPLETED && (
                              <div className="w-full md:w-auto mt-2">
                                <label className="block text-xs text-gray-600 mb-1">Delivery URL</label>
                                <input
                                  type="text"
                                  value={deliveryInputs[proposal._id]?.deliveryUrl || ''}
                                  onChange={(e) => setDeliveryField(proposal._id, 'deliveryUrl', e.target.value)}
                                  placeholder="https://...zip"
                                  className="w-full md:w-56 px-3 py-2 border border-gray-300 rounded-lg text-xs mb-2"
                                />
                                <label className="block text-xs text-gray-600 mb-1">Notes</label>
                                <textarea
                                  value={deliveryInputs[proposal._id]?.deliveryNote || ''}
                                  onChange={(e) => setDeliveryField(proposal._id, 'deliveryNote', e.target.value)}
                                  placeholder="Summary of the delivery"
                                  className="w-full md:w-56 px-3 py-2 border border-gray-300 rounded-lg text-xs mb-2"
                                  rows={2}
                                />
                                <button
                                  onClick={() => handleSubmitWork(proposal._id)}
                                  className="w-full md:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700"
                                >
                                  Submit Work
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <p className="text-gray-500 text-lg">No proposals found.</p>
                <button
                  onClick={() => navigate('/freelancer-module')}
                  className="mt-4 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-colors"
                >
                  Browse Projects
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-projects' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">My Projects Proposals</h2>
              <p className="text-gray-600 mt-1">Manage proposals for your posted projects</p>
            </div>

            {/* Project Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
              <select
                value={selectedProjectId || ''}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Select a project</option>
                {myProjects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>

              {selectedProject && (
                <div className="mt-3 flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getProjectStatusColor(selectedProject.status || '')}`}>
                    {selectedProject.status || 'Status'}
                  </span>
                  {selectedProject.status !== PROJECT_STATUSES.COMPLETED && (
                    <button
                      onClick={() => handleMarkProjectCompleted(selectedProject._id)}
                      className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-colors"
                    >
                      Mark Project Completed
                    </button>
                  )}
                </div>
              )}
            </div>

            {selectedProjectId && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Proposals for Project: {selectedProject?.title || selectedProjectId}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {projectProposals.length} proposal{projectProposals.length !== 1 ? 's' : ''} found
                  </div>
                </div>

                {projectProposals.length > 0 ? (
                  <div className="space-y-4">
                    {projectProposals.map((proposal) => (
                      <div key={proposal._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {proposal.freelancerId?.name || 'Unknown Freelancer'}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getProposalStatusColor(proposal.status)}`}>
                                {proposal.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{proposal.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Cost:</span> ${proposal.expectedCost}
                              </div>
                              <div>
                                <span className="font-medium">Delivery:</span> {proposal.expectedDelivery} days
                              </div>
                              <div>
                                <span className="font-medium">Submitted:</span> {new Date(proposal.submittedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleStatusUpdate(proposal._id, SUBMISSION_STATUSES.ACCEPTED)}
                                className={`px-3 py-1 text-xs rounded-md ${
                                  proposal.status === SUBMISSION_STATUSES.ACCEPTED || proposal.status === SUBMISSION_STATUSES.IN_PROGRESS
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                Accept / In Progress
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(proposal._id, SUBMISSION_STATUSES.NEEDS_UPDATES)}
                                className={`px-3 py-1 text-xs rounded-md ${
                                  proposal.status === SUBMISSION_STATUSES.NEEDS_UPDATES
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                Needs Updates
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(proposal._id, SUBMISSION_STATUSES.COMPLETED)}
                                className={`px-3 py-1 text-xs rounded-md ${
                                  proposal.status === SUBMISSION_STATUSES.COMPLETED 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                Mark Completed
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(proposal._id, SUBMISSION_STATUSES.REJECTED)}
                                className={`px-3 py-1 text-xs rounded-md ${
                                  proposal.status === SUBMISSION_STATUSES.REJECTED 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                              >
                                Reject
                              </button>
                            </div>
                            {proposal.deliveryUrl && (
                              <div className="text-xs text-gray-700 text-right">
                                <div className="font-semibold">Delivery</div>
                                <a className="text-indigo-600 break-all" href={proposal.deliveryUrl} target="_blank" rel="noreferrer">{proposal.deliveryUrl}</a>
                                {proposal.deliveryNote && <div className="text-gray-600 mt-1">{proposal.deliveryNote}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <p className="text-gray-500 text-lg">No proposals found for this project.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalManagement;