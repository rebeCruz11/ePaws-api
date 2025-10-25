/**
 * Funciones auxiliares para la aplicación
 */

/**
 * Genera opciones de paginación para queries de Mongoose
 * @param {Number} page - Número de página (base 1)
 * @param {Number} limit - Cantidad de items por página
 * @returns {Object} Objeto con skip y limit
 */
const getPaginationOptions = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 items por página
  
  return {
    skip: (pageNum - 1) * limitNum,
    limit: limitNum,
    page: pageNum
  };
};

/**
 * Genera respuesta paginada con metadata
 * @param {Array} data - Datos a devolver
 * @param {Number} total - Total de items en la base de datos
 * @param {Number} page - Página actual
 * @param {Number} limit - Items por página
 * @returns {Object} Respuesta con datos y metadata de paginación
 */
const paginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Genera respuesta de éxito estándar
 * @param {*} data - Datos a devolver
 * @param {String} message - Mensaje opcional
 * @returns {Object} Respuesta estandarizada
 */
const successResponse = (data, message = null) => {
  const response = {
    success: true,
    data
  };
  
  if (message) {
    response.message = message;
  }
  
  return response;
};

/**
 * Genera respuesta de error estándar
 * @param {String} message - Mensaje de error
 * @param {Array} errors - Array de errores detallados (opcional)
 * @returns {Object} Respuesta de error estandarizada
 */
const errorResponse = (message, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return response;
};

/**
 * Calcula la distancia entre dos puntos geográficos (en kilómetros)
 * @param {Number} lat1 - Latitud del punto 1
 * @param {Number} lon1 - Longitud del punto 1
 * @param {Number} lat2 - Latitud del punto 2
 * @param {Number} lon2 - Longitud del punto 2
 * @returns {Number} Distancia en kilómetros
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

/**
 * Convierte grados a radianes
 * @param {Number} deg - Grados
 * @returns {Number} Radianes
 */
const toRad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 * Valida coordenadas geográficas
 * @param {Number} lat - Latitud
 * @param {Number} lng - Longitud
 * @returns {Boolean} True si son válidas
 */
const validateCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Sanitiza un string para prevenir inyecciones
 * @param {String} str - String a sanitizar
 * @returns {String} String sanitizado
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Valida formato de ObjectId de MongoDB
 * @param {String} id - ID a validar
 * @returns {Boolean} True si es válido
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

module.exports = {
  getPaginationOptions,
  paginatedResponse,
  successResponse,
  errorResponse,
  calculateDistance,
  validateCoordinates,
  sanitizeString,
  isValidObjectId
};
