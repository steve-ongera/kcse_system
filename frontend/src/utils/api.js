// utils/api.js
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';


const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh / redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

// ── Public endpoints ──────────────────────────────
export const lookupResult = (payload) =>
  api.post('/results/lookup/', payload);

export const fetchActiveYears = () =>
  api.get('/reference/years/');

export const fetchGradingScale = () =>
  api.get('/reference/grading-scale/');

// ── Admin: Candidates ─────────────────────────────
export const fetchCandidates = (params) =>
  api.get('/admin/candidates/', { params });

export const fetchCandidate = (indexNumber) =>
  api.get(`/admin/candidates/${indexNumber}/`);

export const registerCandidate = (data) =>
  api.post('/admin/candidates/register/', data);

export const updateCandidate = (indexNumber, data) =>
  api.patch(`/admin/candidates/${indexNumber}/`, data);

// ── Admin: Marks ──────────────────────────────────
export const enterMarks = (data) =>
  api.post('/admin/marks/enter/', data);

export const approveMarks = (pk) =>
  api.post(`/admin/marks/${pk}/approve/`);

// ── Admin: Analytics ──────────────────────────────
export const fetchSchoolPerformance = (centerCode, year) =>
  api.get(`/admin/analytics/school/${centerCode}/`, { params: { year } });

// ── Admin: Audit ──────────────────────────────────
export const fetchAuditLogs = (params) =>
  api.get('/admin/audit-logs/', { params });

// ── Auth (Django Simple JWT) ──────────────────────
export const loginUser = (credentials) =>
  api.post('/token/', credentials);

export const refreshToken = (refresh) =>
  api.post('/token/refresh/', { refresh });

export default api;