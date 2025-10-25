const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT para el usuario
 * @param {Object} payload - Datos a incluir en el token (usualmente user ID y role)
 * @returns {String} Token JWT
 */
const generateToken = (payload) => {
  try {
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    );
    return token;
  } catch (error) {
    console.error('Error al generar token:', error);
    throw new Error('Error al generar token de autenticación');
  }
};

/**
 * Verifica y decodifica un token JWT
 * @param {String} token - Token JWT a verificar
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Token inválido');
    }
    throw new Error('Error al verificar token');
  }
};

module.exports = {
  generateToken,
  verifyToken
};
