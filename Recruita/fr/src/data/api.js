import axios from "axios";

const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const signup = async (data) => {
  const res = await api.post("/auth/signup", data);
  return res.data;
};

export const login = async (data) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const shortlist = async ({
  jobDescription,
  skills = [],
  topN = 5,
  experienceRange = {},
}) => {
  const res = await api.post("/recruiter/shortlist", {
    jobDescription,
    skills,
    topN,
    experienceRange,
  });
  return res.data;
};

// Job Management APIs
export const createJob = async (jobData) => {
  const res = await api.post("/jobs", jobData);
  return res.data;
};

export const getMyJobs = async () => {
  const res = await api.get("/jobs");
  return res.data;
};

export const getJobApplicants = async (jobId) => {
  const res = await api.get(`/jobs/${jobId}/applicants`);
  return res.data;
};

export const bulkUpdateApplications = async (jobId, { topN, action }) => {
  const res = await api.post(`/jobs/${jobId}/bulk-update`, { topN, action });
  return res.data;
};

export const closeJob = async (jobId) => {
  const res = await api.patch(`/jobs/${jobId}/close`);
  return res.data;
};

export const getPublicJob = async (jobId) => {
  const res = await api.get(`/jobs/${jobId}/public`);
  return res.data;
};

export const applyToJob = async (jobId, formData) => {
  const res = await api.post(`/jobs/${jobId}/apply`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export default api;
