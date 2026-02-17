// Project Status Constants
export const PROJECT_STATUSES = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  CLOSED: 'Closed',
  COMPLETED: 'Completed'
};

// Submission Status Constants
export const SUBMISSION_STATUSES = {
  SUBMITTED: 'Submitted',
  VIEWED: 'Viewed',
  SHORTLISTED: 'Shortlisted',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  IN_PROGRESS: 'In Progress',
  NEEDS_UPDATES: 'Needs Updates',
  SUBMITTED_WORK: 'Submitted Work',
  COMPLETED: 'Completed'
};

// Status Colors for consistent styling
export const STATUS_COLORS = {
  // Project statuses
  [PROJECT_STATUSES.OPEN]: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',
  [PROJECT_STATUSES.IN_PROGRESS]: 'bg-pink-500/10 text-pink-200 border-pink-500/20',
  [PROJECT_STATUSES.CLOSED]: 'bg-slate-500/10 text-slate-200 border-slate-500/20',
  [PROJECT_STATUSES.COMPLETED]: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/20',
  
  // Submission statuses
  [SUBMISSION_STATUSES.SUBMITTED]: 'bg-slate-500/10 text-slate-200 border-slate-500/20',
  [SUBMISSION_STATUSES.VIEWED]: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',
  [SUBMISSION_STATUSES.SHORTLISTED]: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',
  [SUBMISSION_STATUSES.ACCEPTED]: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',
  [SUBMISSION_STATUSES.REJECTED]: 'bg-rose-500/10 text-rose-200 border-rose-500/20',
  [SUBMISSION_STATUSES.IN_PROGRESS]: 'bg-pink-500/10 text-pink-200 border-pink-500/20',
  [SUBMISSION_STATUSES.NEEDS_UPDATES]: 'bg-pink-500/10 text-pink-200 border-pink-500/20',
  [SUBMISSION_STATUSES.SUBMITTED_WORK]: 'bg-slate-500/10 text-slate-200 border-slate-500/20',
  [SUBMISSION_STATUSES.COMPLETED]: 'bg-emerald-400/10 text-emerald-200 border-emerald-400/20'
};

// Status Icons for visual indicators
export const STATUS_ICONS = {
  [PROJECT_STATUSES.OPEN]: '🔓',
  [PROJECT_STATUSES.IN_PROGRESS]: '🔄',
  [PROJECT_STATUSES.CLOSED]: '🔒',
  [PROJECT_STATUSES.COMPLETED]: '✅',
  [SUBMISSION_STATUSES.SUBMITTED]: '📤',
  [SUBMISSION_STATUSES.VIEWED]: '👁️',
  [SUBMISSION_STATUSES.SHORTLISTED]: '⭐',
  [SUBMISSION_STATUSES.ACCEPTED]: '✔️',
  [SUBMISSION_STATUSES.REJECTED]: '❌'
};

// Helper function to get status color classes
export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || 'bg-slate-500/10 text-slate-200 border-slate-500/20';
};

// Helper function to get status icon
export const getStatusIcon = (status) => {
  return STATUS_ICONS[status] || '';
};

// Helper function to check if a project status is active
export const isProjectActive = (status) => {
  return status === PROJECT_STATUSES.OPEN || status === PROJECT_STATUSES.IN_PROGRESS;
};

// Helper function to check if a submission status indicates success
export const isSubmissionSuccessful = (status) => {
  return status === SUBMISSION_STATUSES.SHORTLISTED || status === SUBMISSION_STATUSES.ACCEPTED;
};

// Helper function to check if a submission status indicates failure
export const isSubmissionFailed = (status) => {
  return status === SUBMISSION_STATUSES.REJECTED;
};