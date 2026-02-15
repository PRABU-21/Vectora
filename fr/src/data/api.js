import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Export API_BASE_URL for use in other components
export const API_BASE_URL = API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const signup = async (userData) => {
  const response = await api.post("/auth/signup", userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

// Embeddings API calls
export const uploadEmbedding = async (fileData) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    `${API_URL}/embeddings/upload-embedding`,
    fileData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

// Jobs API calls
export const getJobs = async () => {
  const response = await api.get("/jobs");
  return response.data;
};

// Get personalized job recommendations based on resume similarity
export const getJobRecommendations = async (limit = 10) => {
  const response = await api.get(`/jobs/recommendations?limit=${limit}`);
  return response.data;
};

// Apply to a job
export const applyToJob = async (jobData) => {
  const response = await api.post("/jobs/apply", jobData);
  return response.data;
};

// Get applied jobs for the user
export const getAppliedJobs = async () => {
  const response = await api.get("/jobs/applied");
  return response.data;
};

// LeetCode profile stats
export const getLeetCodeProfile = async (username) => {
  const response = await api.get(`/jobs/leetcode/${encodeURIComponent(username)}`);
  return response.data;
};

// Resume parsing API
export const parseResume = async (file) => {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await api.post("/resume/parse", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const saveParsedProfile = async (profile) => {
  const response = await api.post("/resume/save", { profile });
  return response.data;
};

export const getParsedProfile = async () => {
  const response = await api.get("/resume/profile");
  return response.data;
};

// Project API calls
export const getProjects = async (queryString = "") => {
  const suffix = queryString ? `?${queryString}` : "";
  const response = await api.get(`/projects${suffix}`);
  return response.data?.data || response.data || [];
};

export const createProject = async (projectData) => {
  const response = await api.post("/projects", projectData);
  return response.data?.data || response.data;
};

export const updateProject = async (projectId, updates) => {
  const response = await api.put(`/projects/${projectId}`, updates);
  return response.data?.data || response.data;
};

export const getMyProjects = async () => {
  const response = await api.get("/projects/my-projects");
  return response.data?.data || response.data || [];
};

// Proposal API calls
export const createProposal = async (proposalData) => {
  const response = await api.post("/proposals", proposalData);
  return response.data?.data || response.data;
};

export const getMyProposals = async () => {
  const response = await api.get("/proposals/my-proposals");
  return response.data?.data || response.data || [];
};

export const getMyActiveProjects = async () => {
  const response = await api.get("/proposals/my-active-projects");
  return response.data?.data || response.data || [];
};

export const getProposalsByProject = async (projectId) => {
  const response = await api.get(`/proposals/project/${projectId}`);
  return response.data?.data || response.data || [];
};

export const updateProposalStatus = async (proposalId, payload) => {
  const response = await api.put(`/proposals/${proposalId}/status`, payload);
  return response.data?.data || response.data;
};

export const submitProposalWork = async (proposalId, payload) => {
  const response = await api.put(`/proposals/${proposalId}/submit-work`, payload);
  return response.data?.data || response.data;
};

// Freelancer profile API calls
export const getFreelancerProfile = async () => {
  const response = await api.get("/freelancers/profile");
  return response.data?.data || response.data;
};

export const createFreelancerProfile = async (profileData) => {
  const response = await api.post("/freelancers/profile", profileData);
  return response.data?.data || response.data;
};

export const updateFreelancerProfile = async (profileData) => {
  const response = await api.put("/freelancers/profile", profileData);
  return response.data?.data || response.data;
};

export default api;
