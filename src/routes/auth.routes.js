const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/auth.controller');

const { authMiddleware } = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post(
  '/register',
  [
    body('email')
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('El nombre es requerido')
      .isLength({ max: 100 })
      .withMessage('El nombre no puede exceder 100 caracteres'),
    body('role')
      .optional()
      .isIn(['user', 'organization', 'veterinary'])
      .withMessage('Rol inválido'),
    body('phone')
      .optional()
      .matches(/^[0-9]{8,15}$/)
      .withMessage('Teléfono inválido'),
    // Validaciones condicionales para organización
    body('organizationName')
      .if((value, { req }) => req.body.role === 'organization')
      .notEmpty()
      .withMessage('El nombre de la organización es requerido'),
    body('description')
      .if((value, { req }) => req.body.role === 'organization')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('La descripción no puede exceder 1000 caracteres'),
    body('website')
      .if((value, { req }) => req.body.role === 'organization')
      .optional()
      .isURL()
      .withMessage('El sitio web debe ser una URL válida'),
    body('capacity')
      .if((value, { req }) => req.body.role === 'organization')
      .optional()
      .isInt({ min: 0 })
      .withMessage('La capacidad debe ser un número positivo'),
    body('logoUrl')
      .if((value, { req }) => req.body.role === 'organization')
      .optional()
      .isURL()
      .withMessage('El logo debe ser una URL válida'),
    // Validaciones condicionales para veterinaria
    body('clinicName')
      .if((value, { req }) => req.body.role === 'veterinary')
      .notEmpty()
      .withMessage('El nombre de la clínica es requerido'),
    body('licenseNumber')
      .if((value, { req }) => req.body.role === 'veterinary')
      .notEmpty()
      .withMessage('El número de licencia es requerido'),
    body('specialties')
      .if((value, { req }) => req.body.role === 'veterinary')
      .optional()
      .isArray()
      .withMessage('Las especialidades deben ser un array'),
    body('businessHours')
      .if((value, { req }) => req.body.role === 'veterinary')
      .optional()
      .isString()
      .withMessage('El horario debe ser texto'),
    body('latitude')
      .if((value, { req }) => req.body.role === 'veterinary' && req.body.latitude)
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitud inválida'),
    body('longitude')
      .if((value, { req }) => req.body.role === 'veterinary' && req.body.longitude)
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitud inválida'),
    body('locationAddress')
      .if((value, { req }) => req.body.role === 'veterinary')
      .optional()
      .isString()
      .withMessage('La dirección debe ser texto'),
    validationMiddleware
  ],
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .withMessage('Email inválido')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('La contraseña es requerida'),
    validationMiddleware
  ],
  login
);

/**
 * @route   GET /api/auth/me
 * @desc    Obtener perfil del usuario actual
 * @access  Private
 */
router.get('/me', authMiddleware, getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
router.put(
  '/profile',
  [
    authMiddleware,
    body('name')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('El nombre no puede exceder 100 caracteres'),
    body('phone')
      .optional()
      .matches(/^[0-9]{8,15}$/)
      .withMessage('Teléfono inválido'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email inválido'),
    validationMiddleware
  ],
  updateProfile
);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.put(
  '/change-password',
  [
    authMiddleware,
    body('currentPassword')
      .notEmpty()
      .withMessage('La contraseña actual es requerida'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
    validationMiddleware
  ],
  changePassword
);

module.exports = router;
