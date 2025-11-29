import api from './instance';

/**
 * DSCR API
 * Usa la instancia de axios configurada que incluye:
 * - Interceptor para agregar token en header Authorization
 * - Interceptor para refresh token automático en caso de 401
 */

export const createDscr = async (data) => {
  const response = await api.post("/api/v1/dscr-requests/", data);
  return response.data;
};

export const getDscrs = async (params = {}) => {
  const response = await api.get("/api/v1/dscr-requests/", { params });
  return response.data;
};

export const getDscrById = async (dscr_id) => {
  const response = await api.get(`/api/v1/dscr-requests/${dscr_id}`);
  return response.data;
};

export const updateDscr = async (dscr_id, data) => {
  const response = await api.put(`/api/v1/dscr-requests/${dscr_id}`, data);
  return response.data;
};

export const deleteDscr = async (dscr_id) => {
  const response = await api.delete(`/api/v1/dscr-requests/${dscr_id}`);
  return response.data;
};

export const getDscrStatus = async (dscr_id) => {
  const response = await api.get(`/api/v1/dscr-requests/${dscr_id}/status`);
  return response.data;
};

export const getDscrByRegisterCode = async (dscr_code) => {
  const response = await api.get(`/api/v1/dscr-requests/by-uuid/${dscr_code}`);
  return response.data;
};


