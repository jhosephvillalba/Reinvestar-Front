import axios from "axios";
import { getAccessToken, refreshToken, performLogout } from "../services/authService";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Cambiar a true si usas cookies HttpOnly
});

/**
 * Interceptor de peticiones:
 * Agrega el token de acceso a cada petición
 */
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken() || localStorage.getItem("token"); // Legacy support
    
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No token found for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuestas:
 * Maneja automáticamente la renovación de tokens cuando expiran
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si el error es 401 y no es una petición de refresh o login
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      
      try {
        // Intentar refrescar el token usando el servicio
        const newAccessToken = await refreshToken();
        
        // Actualizar el header de la petición original con el nuevo token
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        
        // Reintentar la petición original
        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla, hacer logout y redirigir
        console.error("Token refresh failed:", refreshError);
        
        await performLogout(false); // No llamar API, ya que puede fallar también
        
        // Redirigir a login con razón (usar window.location para evitar problemas con React Router)
        if (window.location.pathname !== "/login") {
          window.location.href = "/login?reason=session_expired";
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
