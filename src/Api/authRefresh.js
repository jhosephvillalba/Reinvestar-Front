/**
 * Auth Refresh API
 * 
 * Instancia separada de axios para refresh token
 * Sin interceptors para evitar dependencias circulares
 */

import axios from "axios";

const authRefreshApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Refresh token
 * El refresh token se envía en el header Authorization
 * (Ajusta según tu implementación de backend)
 */
export const refreshTokenAPI = async (refreshTokenValue) => {
  // Opción 1: Enviar refresh token en header (recomendado)
  const response = await authRefreshApi.post(
    "/api/v1/auth/refresh",
    {},
    {
      headers: {
        Authorization: `Bearer ${refreshTokenValue}`,
      },
    }
  );

  // Opción 2: Si tu backend requiere el refresh token en el body, descomenta esto:
  // const response = await authRefreshApi.post("/api/v1/auth/refresh", {
  //   refresh_token: refreshTokenValue,
  // });

  return response.data;
};

