import api from "./instance";

/**
 * Cambia el estado de una solicitud
 * @param {Object} params - Parámetros para el cambio de estado
 * @param {string} params.request_type - Tipo de solicitud ('dscr', 'fixflip', 'construction')
 * @param {number} params.request_id - ID de la solicitud
 * @param {string} params.new_status - Nuevo estado de la solicitud
 * @param {string} [params.notes] - Notas adicionales sobre el cambio de estado (opcional)
 * @returns {Promise} - Respuesta de la API
 */
export const changeRequestStatus = async (params) => {
  const { request_type, request_id, new_status, notes } = params;

  // Validar parámetros requeridos
  if (!request_type || !['dscr', 'fixflip', 'construction'].includes(request_type)) {
    throw new Error('Tipo de solicitud inválido. Debe ser: dscr, fixflip o construction');
  }
  if (!request_id || isNaN(Number(request_id))) {
    throw new Error('ID de solicitud inválido');
  }
  if (!new_status) {
    throw new Error('Nuevo estado es requerido');
  }

  // Construir parámetros de la consulta
  const queryParams = {
    request_type,
    request_id: Number(request_id),
    new_status
  };

  // Agregar notas si se proporcionan
  if (notes) {
    queryParams.notes = notes;
  }

  try {
    const response = await api.put("/api/v1/request-status/change-status", null, {
      params: queryParams
    });
    return response.data;
  } catch (error) {
    console.error('Error cambiando estado de la solicitud:', error);
    // Si el error es por permisos o validación, propagar el mensaje específico
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};

// Enum de estados posibles
export const StatusEnum = {
  PENDING: "PENDING",
  IN_REVIEW: "IN_REVIEW",
  PRICING: "PRICING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  CLOSED: "CLOSED"
};

// Mapeo de estados a etiquetas en inglés
export const StatusLabels = {
  [StatusEnum.PENDING]: "Pending",
  [StatusEnum.IN_REVIEW]: "Under Review",
  [StatusEnum.PRICING]: "Pricing",
  [StatusEnum.ACCEPTED]: "Approved",
  [StatusEnum.REJECTED]: "Rejected",
  [StatusEnum.CANCELLED]: "Cancelled",
  [StatusEnum.CLOSED]: "Closed"
};

// Mapeo de estados a colores de badge
export const StatusColors = {
  [StatusEnum.PENDING]: "bg-warning",
  [StatusEnum.IN_REVIEW]: "bg-info",
  [StatusEnum.PRICING]: "bg-primary",
  [StatusEnum.ACCEPTED]: "bg-success",
  [StatusEnum.REJECTED]: "bg-danger",
  [StatusEnum.CANCELLED]: "bg-secondary",
  [StatusEnum.CLOSED]: "bg-dark"
};