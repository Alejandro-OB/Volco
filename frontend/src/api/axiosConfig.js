import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Añade el access token a cada request
api.interceptors.request.use((config) => {
  const access = localStorage.getItem('access_token');
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Refresca token si expira
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data.success !== 'undefined' && typeof response.data.data !== 'undefined') {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    // Intercept and standardize Volco ErrorResponses for UI components
    if (error.response?.data && error.response.data.success === false) {
      let errorMessage = error.response.data.message || 'Error en el servidor';
      
      if (error.response.data.details && Array.isArray(error.response.data.details)) {
         const detailsStr = error.response.data.details.map(d => d.msg || d).join(', ');
         if (detailsStr) {
             errorMessage += `: ${detailsStr}`;
         }
      }
      
      // Remap to { detail } so legacy UI components don't break
      error.response.data = { detail: errorMessage };
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL}token/refresh/`,
            { refresh }
          );

          const newAccess = response.data.access_token;
          localStorage.setItem('access_token', newAccess);

          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (err) {
          console.error('Refresh token inválido o expirado.');
          localStorage.clear();
          
          // Emitir evento global para mostrar el Toast
          window.dispatchEvent(new Event('tokenExpired'));
          
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
