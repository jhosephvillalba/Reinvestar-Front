import api from './instance';

/**
 * Fixflip API
 * Usa la instancia de axios configurada que incluye:
 * - Interceptor para agregar token en header Authorization
 * - Interceptor para refresh token automático en caso de 401
 */

export const createFixflip = async (data) => {
  const response = await api.post("/api/v1/fixflip-requests/", data);
  return response.data;
};

export const getFixflips = async (params = {}) => {
  const response = await api.get("/api/v1/fixflip-requests/", { params });
  return response.data;
};

export const getFixflipById = async (fixflip_id) => {
  const response = await api.get(`/api/v1/fixflip-requests/${fixflip_id}`);
  return response.data;
};

export const updateFixflip = async (fixflip_id, data) => {
  const response = await api.put(`/api/v1/fixflip-requests/${fixflip_id}`, data);
  return response.data;
};

export const deleteFixflip = async (fixflip_id) => {
  const response = await api.delete(`/api/v1/fixflip-requests/${fixflip_id}`);
  return response.data;
};

export const getFixflipStatus = async (fixflip_id) => {
  const response = await api.get(`/api/v1/fixflip-requests/${fixflip_id}/status`);
  return response.data;
};

export const getFixflipByRegisterCode = async (fixflip_code) => {
  const response = await api.get(`/api/v1/fixflip-requests/by-uuid/${fixflip_code}`);
  return response.data;
};

