import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api/v1' : 'http://127.0.0.1:8000/api/v1'),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// ── Request Interceptor — Attach token ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('edms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — Handle errors globally ───────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('edms_token');
      localStorage.removeItem('edms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login:  (data) => api.post('/auth/login', data),
  logout: ()     => api.post('/auth/logout'),
  me:     ()     => api.get('/auth/me'),
};

// ─── Documents ─────────────────────────────────────────────────
export const documentsAPI = {
  list:    (params) => api.get('/documents', { params }),
  show:    (id)     => api.get(`/documents/${id}`),
  create:  (data)   => api.post('/documents', data),
  update:  (id, data) => api.put(`/documents/${id}`, data),
  delete:  (id)     => api.delete(`/documents/${id}`),
  archive: (id)     => api.post(`/documents/${id}/archive`),
  restore: (id)     => api.post(`/documents/${id}/restore`),
  approve: (id, data) => api.post(`/documents/${id}/approve`, data),
  reject:  (id, data) => api.post(`/documents/${id}/reject`, data),
  search:  (params) => api.get('/search', { params }),
};

// ─── Attachments ───────────────────────────────────────────────
export const attachmentsAPI = {
  list:     (docId)         => api.get(`/documents/${docId}/attachments`),
  upload:   (docId, formData) => api.post(`/documents/${docId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:   (docId, attId) => api.delete(`/documents/${docId}/attachments/${attId}`),
  download: (docId, attId) => api.get(`/documents/${docId}/attachments/${attId}/download`, { responseType: 'blob' }),
  preview:  (docId, attId) => api.get(`/documents/${docId}/attachments/${attId}/preview`, { responseType: 'blob' }),
};

// ─── Categories ────────────────────────────────────────────────
export const categoriesAPI = {
  list:    (params) => api.get('/categories', { params }),
  show:    (id)     => api.get(`/categories/${id}`),
  create:  (data)   => api.post('/categories', data),
  update:  (id, data) => api.put(`/categories/${id}`, data),
  delete:  (id)     => api.delete(`/categories/${id}`),
};

// ─── Document Types ────────────────────────────────────────────
export const documentTypesAPI = {
  list:        (params) => api.get('/document-types', { params }),
  show:        (id)     => api.get(`/document-types/${id}`),
  create:      (data)   => api.post('/document-types', data),
  update:      (id, data) => api.put(`/document-types/${id}`, data),
  delete:      (id)     => api.delete(`/document-types/${id}`),
  fields:      (id)     => api.get(`/document-types/${id}/fields`),
  addField:    (id, data) => api.post(`/document-types/${id}/fields`, data),
  updateField: (fieldId, data) => api.put(`/document-type-fields/${fieldId}`, data),
  deleteField: (fieldId) => api.delete(`/document-type-fields/${fieldId}`),
};

// ─── Users ─────────────────────────────────────────────────────
export const usersAPI = {
  list:        (params) => api.get('/users', { params }),
  show:        (id)     => api.get(`/users/${id}`),
  create:      (data)   => api.post('/users', data),
  update:      (id, data) => api.put(`/users/${id}`, data),
  delete:      (id)     => api.delete(`/users/${id}`),
  updateRoles: (id, roles) => api.put(`/users/${id}/roles`, { roles }),
};

// ─── Roles & Permissions Tree ──────────────────────────────────
export const rolesAPI = {
  list:            () => api.get('/roles'),
  get:             (id) => api.get(`/roles/${id}`),
  create:          (data) => api.post('/roles', data),
  update:          (id, data) => api.put(`/roles/${id}`, data),
  delete:          (id) => api.delete(`/roles/${id}`),
  permissions:     () => api.get('/permissions'),
  permissionsTree: () => api.get('/permissions/tree'),
};

// ─── Departments ───────────────────────────────────────────────
export const departmentsAPI = {
  list:   (params) => api.get('/departments', { params }),
  show:   (id)     => api.get(`/departments/${id}`),
  create: (data)   => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id)     => api.delete(`/departments/${id}`),
};

// ─── Organizations ─────────────────────────────────────────────
export const organizationsAPI = {
  list:   (params) => api.get('/organizations', { params }),
  show:   (id)     => api.get(`/organizations/${id}`),
  create: (data)   => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  delete: (id)     => api.delete(`/organizations/${id}`),
};

// ─── Dashboard ─────────────────────────────────────────────────
export const dashboardAPI = {
  stats:           () => api.get('/dashboard/stats'),
  recentDocuments: () => api.get('/dashboard/recent-documents'),
  pendingApprovals:() => api.get('/dashboard/pending-approvals'),
  activity:        () => api.get('/dashboard/activity'),
};

// ─── Audit Logs ────────────────────────────────────────────────
export const auditAPI = {
  list:        (params) => api.get('/audit-logs', { params }),
  forDocument: (docId)  => api.get(`/documents/${docId}/audit-logs`),
};

// ─── Settings ──────────────────────────────────────────────────
export const settingsAPI = {
  statuses:             () => api.get('/statuses'),
  confidentialityLevels:() => api.get('/confidentiality-levels'),
};
