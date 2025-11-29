import api from './instance';

/**
 * Construction API
 * Usa la instancia de axios configurada que incluye:
 * - Interceptor para agregar token en header Authorization
 * - Interceptor para refresh token automático en caso de 401
 */

export const createConstruction = async (data) => {
  const response = await api.post("/api/v1/construction-requests/", data);
  return response.data;
};

export const getConstructions = async (params = {}) => {
  const response = await api.get("/api/v1/construction-requests/", { params });
  return response.data;
};

export const getConstructionById = async (construction_id) => {
  const response = await api.get(`/api/v1/construction-requests/${construction_id}`);
  return response.data;
};   

export const updateConstruction = async (construction_id, data) => {
  const response = await api.put(`/api/v1/construction-requests/${construction_id}`, data);
  return response.data;
};   

export const deleteConstruction = async (construction_id) => {
  const response = await api.delete(`/api/v1/construction-requests/${construction_id}`);
  return response.data;
};

export const getConstructionStatus = async (construction_id) => {
  const response = await api.get(`/api/v1/construction-requests/${construction_id}/status`);
  return response.data;
};

export const getConstructionByRegisterCode = async (construction_code) => {
  const response = await api.get(`/api/v1/construction-requests/by-uuid/${construction_code}`);
  return response.data;
};