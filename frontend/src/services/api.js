import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach Access Token and Tenant ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clinic_access_token');
  const tenantId = localStorage.getItem('clinic_tenant_id');

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Error Handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    console.error('[API Error]', message, error.response?.data);
    return Promise.reject({
      message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

export default api;
