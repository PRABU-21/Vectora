import axios from 'axios';

// In dev, prefer relative `/api` so Vite proxy can forward to backend.
// For production or custom setups, set `VITE_API_URL` (e.g. https://example.com/api).
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Job Seeker API
export const jobSeekerAPI = {
  signup: (data) => api.post('/candidates/signup', data),
  login: (data) => api.post('/candidates/login', data),
  getProfile: () => api.get('/candidates/profile'),
  parseResume: (formData) => api.post('/candidates/parse-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getAllJobs: () => api.get('/candidates/jobs'),
  applyToJob: (jobId) => api.post(`/candidates/apply/${jobId}`),
  getMyApplications: () => api.get('/candidates/applications'),
};

// Recruiter API
export const recruiterAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  createJob: (data) => api.post('/jobs', data),
  getMyJobs: () => api.get('/jobs'),
  getJobApplicants: (jobId) => api.get(`/jobs/${jobId}/applicants`),
  bulkUpdateApplications: (jobId, data) => api.post(`/jobs/${jobId}/bulk-update`, data),
  closeJob: (jobId) => api.patch(`/jobs/${jobId}/close`),
};

export default api;
