import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== RFP APIs ==========
export const rfpAPI = {
  create: (data) => api.post('/rfps', data),
  getAll: () => api.get('/rfps'),
  getById: (id) => api.get(`/rfps/${id}`),
  updateStatus: (id, status) => api.patch(`/rfps/${id}/status`, { status }),
  delete: (id) => api.delete(`/rfps/${id}`),
};

// ========== Vendor APIs ==========
export const vendorAPI = {
  create: (data) => api.post('/vendors', data),
  getAll: () => api.get('/vendors'),
  getById: (id) => api.get(`/vendors/${id}`),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`),
};

// ========== Proposal APIs ==========
export const proposalAPI = {
  getAll: () => api.get('/proposals'),
  getByRFP: (rfpId) => api.get(`/proposals/rfp/${rfpId}`),
  getById: (id) => api.get(`/proposals/${id}`),
  create: (data) => api.post('/proposals', data),
  delete: (id) => api.delete(`/proposals/${id}`),
  compare: (rfpId) => api.get(`/proposals/rfp/${rfpId}/compare`),
};

// ========== Email APIs ==========
export const emailAPI = {
  sendRFP: (rfpId, vendorIds) => api.post(`/email/send-rfp/${rfpId}`, { vendorIds }),
  fetchProposals: () => api.post('/email/fetch-proposals'),
  testEmail: (email) => api.post('/email/test', { email }),
};

export default api;