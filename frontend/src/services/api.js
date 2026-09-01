import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adjuntar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejo global de 401 (expiración de sesión)
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    if (error.response.data && error.response.data.error === 'TOKEN_INVALIDO') {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_usuario');
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default api;
