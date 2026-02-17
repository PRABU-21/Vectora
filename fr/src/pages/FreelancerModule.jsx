import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectForm from '../components/ProjectForm';
import ProjectList from '../components/ProjectList';
import ProjectDetail from '../components/ProjectDetail';
import GoogleTranslate from "../components/GoogleTranslate";
import {
  getProjects,
  createProject,
  updateProject,
  getMyProjects,
  getMyProposals,
  createProposal,
  getMyActiveProjects,
  submitProposalWork
} from '../data/api';
import { PROJECT_STATUSES, SUBMISSION_STATUSES, getStatusColor } from '../utils/statusUtils';

const FreelancerModule = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('post-project');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [deliveryForms, setDeliveryForms] = useState({});
  const [deliverySubmitting, setDeliverySubmitting] = useState({});
  const [deliveryErrors, setDeliveryErrors] = useState({});
  const [deliveryAcknowledged, setDeliveryAcknowledged] = useState({});

  // Sample proposals data for demonstration (removed — using live API)

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setError(null);

    if (activeTab === 'my-proposals') {
      fetchMyProposals();
    } else {
      fetchProjects();
    }
  }, [activeTab]);

  const fetchMyProposals = async () => {
    try {
      setLoading(true);
      const response = await getMyProposals();
      setProposals(response);
    } catch (error) {
      setError('Failed to fetch proposals');
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let response;
      if (activeTab === 'in-progress') {
        response = await getMyActiveProjects();
      } else if (activeTab === 'my-projects') {
        response = await getMyProjects();
      } else {
        // Exclude my own posted projects from the public list
        response = await getProjects('excludeMine=true');
      }
      setProjects(response || []);
    } catch (error) {
      if (activeTab === 'my-projects' || activeTab === 'in-progress') {
        setProjects([]);
      }
      const backendMessage = error?.response?.data?.message;
      setError(backendMessage || 'Failed to fetch projects');
      console.error('Error fetching projects:', error?.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSubmit = async (projectData) => {
    try {
      const response = await createProject(projectData);
      setProjects([response, ...projects]);
      setActiveTab('view-projects');
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      setError(backendMessage || 'Failed to create project');
      console.error('Error creating project:', error?.response?.data || error);
    }
  };

  const updateProjectStatusHandler = async (id, newStatus) => {
    try {
      // Update project status via API
      const updatedProject = await updateProject(id, { status: newStatus });
      setProjects(projects.map(project =>
        (project._id || project.id) === id ? { ...project, status: newStatus } : project
      ));
    } catch (error) {
      setError('Failed to update project status');
      console.error('Error updating project status:', error);
    }
  };

  const handleViewProjectDetail = (project) => {
    setSelectedProject(project);
  };

  const handleBackToList = () => {
    setSelectedProject(null);
  };

  const handleApply = async (proposalData) => {
    try {
      const projectId = proposalData.projectId || selectedProject?._id || selectedProject?.id;
      if (!projectId) {
        setError('Missing project id for proposal');
        return;
      }

      const response = await createProposal({
        projectId,
        expectedCost: Number(proposalData.expectedCost),
        expectedDelivery: Number(proposalData.expectedDelivery),
        description: proposalData.proposalText || proposalData.description || '',
        portfolioLink: proposalData.portfolioLink || ''
      });

      setProposals([response, ...proposals]);
      setProjects(projects.map(project =>
        (project._id || project.id) === projectId
          ? { ...project, applicants: (project.applicants ?? 0) + 1 }
          : project
      ));
      setSelectedProject(null);
      setActiveTab('my-proposals');
      await fetchMyProposals();
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      setError(backendMessage || 'Failed to submit proposal');
      console.error('Error applying to project:', err?.response?.data || err);
    }
  };

  const handleStatusUpdate = (proposalId, newStatus) => {
    // Update proposal status in state
    // In a real implementation, this would make an API call
    console.log(`Updated proposal ${proposalId} to ${newStatus}`);
  };

  const eligibleForDelivery = (status) => [
    SUBMISSION_STATUSES.ACCEPTED,
    SUBMISSION_STATUSES.IN_PROGRESS,
    SUBMISSION_STATUSES.NEEDS_UPDATES,
  ].includes(status);

  const updateDeliveryForm = (id, field, value) => {
    setDeliveryForms((prev) => ({
      ...prev,
      [id]: {
        deliveryUrl: '',
        githubUrl: '',
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  const handleDeliverySubmit = async (proposal) => {
    const id = proposal._id;
    const form = deliveryForms[id] || {};
    const requiresAck = proposal.status === SUBMISSION_STATUSES.NEEDS_UPDATES;

    setDeliveryErrors((prev) => ({ ...prev, [id]: null }));

    if (!eligibleForDelivery(proposal.status)) {
      setDeliveryErrors((prev) => ({ ...prev, [id]: 'You can submit work after the client accepts or requests updates.' }));
      return;
    }

    if (requiresAck && !deliveryAcknowledged[id]) {
      setDeliveryErrors((prev) => ({ ...prev, [id]: 'Please acknowledge the requested updates first.' }));
      return;
    }

    setDeliverySubmitting((prev) => ({ ...prev, [id]: true }));
    try {
      if (!form.deliveryUrl || !form.githubUrl) {
        setDeliveryErrors((prev) => ({ ...prev, [id]: 'Please provide both deployment and GitHub URLs.' }));
        return;
      }

      const updated = await submitProposalWork(id, {
        deliveryUrl: form.deliveryUrl,
        githubUrl: form.githubUrl,
      });

      setProposals((prev) => prev.map((p) => (p._id === id ? { ...p, ...updated } : p)));
      setDeliveryForms((prev) => ({ ...prev, [id]: { deliveryUrl: '', githubUrl: '' } }));
      setDeliveryAcknowledged((prev) => ({ ...prev, [id]: false }));
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      setDeliveryErrors((prev) => ({ ...prev, [id]: backendMessage || 'Could not submit work.' }));
    } finally {
      setDeliverySubmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const safeProjects = Array.isArray(projects) ? projects : [];

  const filteredProjects = safeProjects.filter(project => {
    if (activeTab === 'view-projects' || activeTab === 'dashboard' || activeTab === 'manage-proposals') return true;

    const status = project.status || '';
    const normalizedStatus = status.toLowerCase();

    switch (activeTab) {
      case 'in-progress':
        return normalizedStatus === PROJECT_STATUSES.IN_PROGRESS.toLowerCase() || normalizedStatus === PROJECT_STATUSES.OPEN.toLowerCase();
      case 'closed':
        return normalizedStatus === PROJECT_STATUSES.CLOSED.toLowerCase();
      case 'completed':
        return normalizedStatus === PROJECT_STATUSES.COMPLETED.toLowerCase();
      case 'my-projects':
        return true;
      default:
        return normalizedStatus === PROJECT_STATUSES.OPEN.toLowerCase() || normalizedStatus.includes(activeTab);
    }
  });

  if (loading && activeTab !== 'post-project') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projects...</p>
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
              <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Vectora
              </span>
            </div>
            <div className="flex items-center gap-4">
              <GoogleTranslate />
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Freelance & Tender Management</h1>
          <p className="text-xl text-gray-600">Manage your projects, tenders, and freelance opportunities</p>
        </div>

        {/* Quick Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('post-project')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'post-project'
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            Post Project
          </button>
          <button
            onClick={() => setActiveTab('view-projects')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'view-projects'
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            View Projects
          </button>
          <button
            onClick={() => setActiveTab('my-projects')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'my-projects'
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            My Projects
          </button>
          <button
            onClick={() => setActiveTab('my-proposals')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'my-proposals'
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            My Proposals
          </button>
          <button
            onClick={() => setActiveTab('in-progress')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'in-progress'
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            In Progress
          </button>

        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 min-h-[600px]">
          {activeTab === 'post-project' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Create New Project</h2>
              <ProjectForm onSubmit={handleProjectSubmit} />
            </div>
          )}

          {activeTab !== 'post-project' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {activeTab === 'view-projects' ? 'All Projects' :
                    activeTab === 'my-projects' ? 'My Projects' :
                      activeTab === 'my-proposals' ? 'My Proposals' :
                        activeTab === 'in-progress' ? 'In Progress Projects' :
                          'Projects'}
                </h2>
                <div className="text-sm text-gray-500">
                  Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
                </div>
              </div>

              {activeTab === 'my-proposals' ? (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Proposals You've Submitted</h2>
                    <div className="text-sm text-gray-500">
                      {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} found
                    </div>
                  </div>

                  {proposals.length > 0 ? (
                    <div className="space-y-4">
                      {proposals.map((proposal) => (
                        <div key={proposal._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-medium text-gray-900">{proposal.projectId?.title || 'Untitled Project'}</h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(proposal.status)}`}>
                                  {proposal.status}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-3">{proposal.description}</p>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Cost:</span> \${proposal.expectedCost}
                                </div>
                                <div>
                                  <span className="font-medium">Delivery:</span> {proposal.expectedDelivery} days
                                </div>
                                <div>
                                  <span className="font-medium">Submitted:</span> {new Date(proposal.submittedAt).toLocaleDateString()}
                                </div>
                              </div>

                              {/* Delivery / solution submission when accepted or needs updates */}
                              {proposal.status === SUBMISSION_STATUSES.SUBMITTED_WORK ? (
                                <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                                  <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
                                    Work submitted. Awaiting client review.
                                    {proposal.deliverySubmittedAt && (
                                      <span className="ml-2 text-green-900">Submitted: {new Date(proposal.deliverySubmittedAt).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                  {proposal.deliveryUrl && (
                                    <div className="text-xs text-gray-600">
                                      Deployment: <a className="text-indigo-600 underline" href={proposal.deliveryUrl} target="_blank" rel="noreferrer">{proposal.deliveryUrl}</a>
                                    </div>
                                  )}
                                  {proposal.deliveryNote && (
                                    <div className="text-xs text-gray-600">
                                      GitHub: <a className="text-indigo-600 underline" href={proposal.deliveryNote} target="_blank" rel="noreferrer">{proposal.deliveryNote}</a>
                                    </div>
                                  )}
                                </div>
                              ) : eligibleForDelivery(proposal.status) ? (
                                <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                                  {proposal.status === SUBMISSION_STATUSES.NEEDS_UPDATES && (
                                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg text-sm flex items-start justify-between gap-2">
                                      <span>Client requested updates. Please acknowledge before submitting new work.</span>
                                      <button
                                        type="button"
                                        onClick={() => setDeliveryAcknowledged((prev) => ({ ...prev, [proposal._id]: true }))}
                                        className="px-3 py-1 text-xs rounded bg-white text-yellow-800 border border-yellow-300 hover:bg-yellow-100"
                                      >I saw the updates</button>
                                    </div>
                                  )}

                                  {deliveryErrors[proposal._id] && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{deliveryErrors[proposal._id]}</div>
                                  )}

                                  <div className="space-y-2">
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-700 mb-1">Deployment URL (required)</label>
                                      <input
                                        type="url"
                                        value={deliveryForms[proposal._id]?.deliveryUrl || ''}
                                        onChange={(e) => updateDeliveryForm(proposal._id, 'deliveryUrl', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="https://your-live-app.example.com"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold text-gray-700 mb-1">GitHub URL (required)</label>
                                      <input
                                        type="url"
                                        value={deliveryForms[proposal._id]?.githubUrl || ''}
                                        onChange={(e) => updateDeliveryForm(proposal._id, 'githubUrl', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="https://github.com/your-repo"
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>Last status: {proposal.status}</span>
                                      {proposal.deliverySubmittedAt && (
                                        <span>Last submitted: {new Date(proposal.deliverySubmittedAt).toLocaleDateString()}</span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleDeliverySubmit(proposal)}
                                      disabled={
                                        deliverySubmitting[proposal._id] ||
                                        (proposal.status === SUBMISSION_STATUSES.NEEDS_UPDATES && !deliveryAcknowledged[proposal._id])
                                      }
                                      className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-60"
                                    >
                                      {deliverySubmitting[proposal._id] ? 'Submitting...' : 'Submit Work'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                                  You can submit work after the client accepts or asks for updates.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl">
                      <p className="text-gray-500 text-lg">No proposals found.</p>
                      <button
                        onClick={() => setActiveTab('view-projects')}
                        className="mt-4 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-colors"
                      >
                        Browse Projects
                      </button>
                    </div>
                  )}
                </div>
              ) : selectedProject ? (
                <ProjectDetail
                  project={selectedProject}
                  onBack={handleBackToList}
                  onApply={handleApply}
                  userProposals={proposals}
                />
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl">
                  <p className="text-gray-500 text-lg mb-3">
                    {activeTab === 'my-projects'
                      ? 'You have not created any projects yet.'
                      : activeTab === 'in-progress'
                        ? 'No projects are currently in progress.'
                        : 'No projects found.'}
                  </p>
                  <div className="flex justify-center gap-3">
                    {activeTab !== 'view-projects' && (
                      <button
                        onClick={() => setActiveTab('view-projects')}
                        className="px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-colors"
                      >
                        Explore Projects
                      </button>
                    )}
                    {activeTab === 'my-projects' && (
                      <button
                        onClick={() => setActiveTab('post-project')}
                        className="px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        Create Project
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <ProjectList
                  projects={filteredProjects}
                  onStatusChange={updateProjectStatusHandler}
                  showStatusControls={activeTab === 'my-projects'}
                  onViewDetail={handleViewProjectDetail}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancerModule;