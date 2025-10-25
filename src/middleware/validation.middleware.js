const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/helpers');

/**
 * Middleware para validar los resultados de express-validator
 * Debe usarse después de las reglas de validación
 */
const validationMiddleware = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Formatear errores para respuesta más clara
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json(
      errorResponse('Errores de validación', formattedErrors)
    );
  }
  
  next();
};

module.exports = validationMiddleware;
