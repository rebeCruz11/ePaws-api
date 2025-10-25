const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const { errorResponse } = require('../utils/helpers');

/**
 * Middleware de autenticación
 * Verifica el token JWT y adjunta el usuario a req.user
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        errorResponse('Acceso denegado. No se proporcionó token de autenticación.')
      );
    }

    // Extraer el token
    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
      // Verificar token
      const decoded = verifyToken(token);
      
      // Buscar usuario en la base de datos
      const user = await User.findById(decoded.userId).select('-passwordHash');
      
      if (!user) {
        return res.status(401).json(
          errorResponse('Token inválido. Usuario no encontrado.')
        );
      }

      if (!user.isActive) {
        return res.status(403).json(
          errorResponse('Tu cuenta ha sido desactivada. Contacta al administrador.')
        );
      }

      // Adjuntar usuario al request
      req.user = user;
      next();
      
    } catch (tokenError) {
      return res.status(401).json(
        errorResponse(tokenError.message || 'Token inválido o expirado.')
      );
    }

  } catch (error) {
    console.error('Error en authMiddleware:', error);
    return res.status(500).json(
      errorResponse('Error en el servidor al verificar autenticación.')
    );
  }
};

/**
 * Middleware opcional de autenticación
 * Similar a authMiddleware pero no requiere token
 * Útil para endpoints que pueden funcionar con o sin autenticación
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No hay token, continuar sin usuario
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId).select('-passwordHash');
      
      if (user && user.isActive) {
        req.user = user;
      } else {
        req.user = null;
      }
    } catch (tokenError) {
      // Token inválido, continuar sin usuario
      req.user = null;
    }

    next();
    
  } catch (error) {
    console.error('Error en optionalAuthMiddleware:', error);
    req.user = null;
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
