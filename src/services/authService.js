/**
 * Auth Service - Servicio centralizado de autenticación
 * 
 * Maneja:
 * - Login/Logout
 * - Refresh token automático con mutex para evitar race conditions
 * - Persistencia segura de tokens
 * - Validación de sesión con backend
 */

import { login, logout as logoutAPI } from '../Api/auth';
import { refreshTokenAPI } from '../Api/authRefresh';
import { getMe } from '../Api/user';

// Mutex para evitar múltiples llamadas simultáneas de refresh token
let isRefreshing = false;
let refreshPromise = null;
let refreshSubscribers = [];

/**
 * Suscribe un callback para ser ejecutado cuando el refresh token termine
 */
const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

/**
 * Notifica a todos los suscriptores con el nuevo token
 */
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

/**
 * Obtiene el access token del storage
 */
export const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Obtiene el refresh token del storage
 */
export const getRefreshToken = () => {
  return localStorage.getItem('refresh_token');
};

/**
 * Guarda los tokens en el storage
 */
export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem('access_token', accessToken);
    // También guardar como 'token' para compatibilidad legacy
    localStorage.setItem('token', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
};

/**
 * Elimina los tokens del storage
 */
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token'); // Legacy support
  localStorage.removeItem('user');
};

/**
 * Realiza el login y guarda los tokens
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{user, accessToken, refreshToken}>}
 */
export const performLogin = async (credentials) => {
  try {
    const response = await login(credentials);
    
    // Soporta múltiples formatos de respuesta del backend
    const accessToken = response.access_token || response.accessToken;
    const refreshToken = response.refresh_token || response.refreshToken;
    
    if (!accessToken) {
      throw new Error('No access token received from server');
    }
    
    // Guardar tokens
    setTokens(accessToken, refreshToken);
    
    // Obtener información del usuario
    const user = await getMe();
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return { user, accessToken, refreshToken };
  } catch (error) {
    clearTokens();
    throw error;
  }
};

/**
 * Refresca el access token usando el refresh token
 * Usa mutex para evitar múltiples llamadas simultáneas
 * @returns {Promise<string>} - Nuevo access token
 */
export const refreshToken = async () => {
  // Si ya hay un refresh en progreso, esperar a que termine
  if (isRefreshing && refreshPromise) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => {
        resolve(token);
      });
    });
  }
  
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) {
    throw new Error('No refresh token available');
  }
  
  isRefreshing = true;
  
  refreshPromise = refreshTokenAPI(refreshTokenValue)
    .then((response) => {
      const newAccessToken = response.access_token || response.accessToken;
      
      if (!newAccessToken) {
        throw new Error('No access token received from refresh');
      }
      
      // Actualizar token en storage
      setTokens(newAccessToken, null);
      
      // Notificar a todos los suscriptores
      onTokenRefreshed(newAccessToken);
      
      isRefreshing = false;
      refreshPromise = null;
      
      return newAccessToken;
    })
    .catch((error) => {
      isRefreshing = false;
      refreshPromise = null;
      clearTokens();
      throw error;
    });
  
  return refreshPromise;
};

/**
 * Realiza logout y limpia todos los datos
 * @param {boolean} callAPI - Si debe llamar al endpoint de logout (default: false)
 */
export const performLogout = async (callAPI = false) => {
  try {
    if (callAPI) {
      await logoutAPI();
    }
  } catch (error) {
    console.error('Logout API error:', error);
    // Continuar con el logout local aunque falle la API
  } finally {
    clearTokens();
  }
};

/**
 * Valida la sesión actual con el backend
 * Útil para verificar si el usuario sigue autenticado después de una recarga
 * @returns {Promise<{isValid: boolean, user: Object|null}>}
 */
export const validateSession = async () => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { isValid: false, user: null };
    }
    
    const user = await getMe();
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      return { isValid: true, user };
    }
    
    return { isValid: false, user: null };
  } catch (error) {
    // Si falla, puede ser porque el token expiró
    // Intentar refresh si hay refresh token
    if (getRefreshToken()) {
      try {
        await refreshToken();
        const user = await getMe();
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          return { isValid: true, user };
        }
      } catch (refreshError) {
        // Si refresh falla, la sesión no es válida
        return { isValid: false, user: null };
      }
    }
    
    return { isValid: false, user: null };
  }
};

/**
 * Obtiene el usuario almacenado localmente
 * @returns {Object|null}
 */
export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing stored user:', error);
    return null;
  }
};

/**
 * Verifica si hay una sesión activa (tiene tokens)
 * Nota: Esto NO valida con el backend, solo verifica si existen tokens
 * @returns {boolean}
 */
export const hasActiveSession = () => {
  return !!getAccessToken();
};

