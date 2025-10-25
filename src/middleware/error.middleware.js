const { errorResponse } = require('../utils/helpers');

/**
 * Middleware global de manejo de errores
 * Debe ser el último middleware en la cadena
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error capturado por errorHandler:', err);

  // Error de Mongoose - Validación
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
    
    return res.status(400).json(
      errorResponse('Error de validación', errors)
    );
  }

  // Error de Mongoose - Cast (ID inválido)
  if (err.name === 'CastError') {
    return res.status(400).json(
      errorResponse(`ID inválido: ${err.value}`)
    );
  }

  // Error de Mongoose - Duplicado (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json(
      errorResponse(`El campo '${field}' ya existe en la base de datos.`)
    );
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      errorResponse('Token inválido')
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      errorResponse('Token expirado')
    );
  }

  // Error de Multer (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json(
        errorResponse('El archivo es demasiado grande')
      );
    }
    return res.status(400).json(
      errorResponse(`Error al subir archivo: ${err.message}`)
    );
  }

  // Error personalizado con statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json(
      errorResponse(err.message)
    );
  }

  // Error genérico del servidor
  const statusCode = err.status || 500;
  return res.status(statusCode).json(
    errorResponse(
      process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Error interno del servidor'
    )
  );
};

/**
 * Middleware para rutas no encontradas (404)
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json(
    errorResponse(`Ruta no encontrada: ${req.originalUrl}`)
  );
};

module.exports = {
  errorHandler,
  notFoundHandler
};
