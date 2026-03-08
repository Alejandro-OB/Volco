import axios from 'axios';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map((cb) => cb(token));
  refreshSubscribers = [];
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Helper to ensure URL consistency
const getRefreshUrl = () => {
  const base = import.meta.env.VITE_API_URL || '';
  const separator = base.endsWith('/') ? '' : '/';
  return `${base}${separator}token/refresh/`;
};

// Añade el access token a cada request
api.interceptors.request.use((config) => {
  const access = localStorage.getItem('access_token');
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Interceptor de respuesta para manejar 401 y refresco de token
api.interceptors.response.use(
  (response) => {
    // Unrolling Volco StandardResponse
    if (response.data && typeof response.data.success !== 'undefined' && typeof response.data.data !== 'undefined') {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const { config, response } = error;
    const originalRequest = config;

    // Interceptar y estandarizar ErrorResponses
    if (response?.data && response.data.success === false) {
      let errorMessage = response.data.message || 'Error en el servidor';
      
      if (response.data.details && Array.isArray(response.data.details)) {
         const detailsStr = response.data.details.map(d => d.msg || d).join(', ');
         if (detailsStr) errorMessage += `: ${detailsStr}`;
      }
      
      response.data = { detail: errorMessage };
    }

    if (response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');

      if (!refresh) {
        // No hay refresh token, forzar logout
        localStorage.clear();
        window.dispatchEvent(new Event('tokenExpired'));
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(error);
      }

      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(getRefreshUrl(), { refresh });
        const newAccess = refreshResponse.data.access_token;

        localStorage.setItem('access_token', newAccess);
        isRefreshing = false;
        onRefreshed(newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        console.error('Refresh token inválido o expirado.');
        localStorage.clear();
        window.dispatchEvent(new Event('tokenExpired'));
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
