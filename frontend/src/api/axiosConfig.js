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
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) { reject(error); return; }
            originalRequest.headers.Authorization = `Bearer ${token}`;
            originalRequest._retry = true;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');

      if (!refresh || refresh === 'undefined' || refresh === 'null') {
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
        refreshSubscribers = [];

        // Solo cerrar sesión si el refresh fue rechazado de forma definitiva (token inválido).
        // No cerrar sesión por errores de red o 5xx (pueden ser arranques en frío del servidor).
        const status = refreshError.response?.status;
        if (status === 401 || status === 400 || status === 403) {
          localStorage.clear();
          window.dispatchEvent(new Event('tokenExpired'));
          if (window.location.pathname !== '/login') window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
