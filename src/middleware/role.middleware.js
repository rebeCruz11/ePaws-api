const { errorResponse } = require('../utils/helpers');

/**
 * Middleware de verificación de roles
 * Verifica que el usuario tenga uno de los roles permitidos
 * @param {Array|String} allowedRoles - Roles permitidos (array o string único)
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json(
          errorResponse('Acceso denegado. Debes estar autenticado.')
        );
      }

      // Convertir a array si es un string
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Verificar si el usuario tiene uno de los roles permitidos
      if (!roles.includes(req.user.role)) {
        return res.status(403).json(
          errorResponse(
            `Acceso denegado. Se requiere uno de los siguientes roles: ${roles.join(', ')}`
          )
        );
      }

      next();
      
    } catch (error) {
      console.error('Error en roleMiddleware:', error);
      return res.status(500).json(
        errorResponse('Error en el servidor al verificar permisos.')
      );
    }
  };
};

/**
 * Middleware para verificar que el usuario esté verificado
 */
const verifiedMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json(
        errorResponse('Acceso denegado. Debes estar autenticado.')
      );
    }

    if (!req.user.verified) {
      return res.status(403).json(
        errorResponse('Tu cuenta no está verificada. Por favor verifica tu email.')
      );
    }

    next();
    
  } catch (error) {
    console.error('Error en verifiedMiddleware:', error);
    return res.status(500).json(
      errorResponse('Error en el servidor al verificar cuenta.')
    );
  }
};

/**
 * Middleware para verificar que el usuario sea el propietario del recurso
 * o tenga un rol de administrador
 * @param {String} resourceUserIdField - Campo en req.params o req.body que contiene el userId del recurso
 */
const ownerOrAdminMiddleware = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json(
          errorResponse('Acceso denegado. Debes estar autenticado.')
        );
      }

      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      // Permitir si es admin o es el propietario
      if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId) {
        return next();
      }

      return res.status(403).json(
        errorResponse('No tienes permisos para acceder a este recurso.')
      );
      
    } catch (error) {
      console.error('Error en ownerOrAdminMiddleware:', error);
      return res.status(500).json(
        errorResponse('Error en el servidor al verificar permisos.')
      );
    }
  };
};

module.exports = {
  roleMiddleware,
  verifiedMiddleware,
  ownerOrAdminMiddleware
};
