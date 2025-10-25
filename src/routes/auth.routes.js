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
    // Validaciones para organización
    body('organizationName')
      .if(body('role').equals('organization'))
      .notEmpty()
      .withMessage('El nombre de la organización es requerido'),
    // Validaciones para veterinaria
    body('clinicName')
      .if(body('role').equals('veterinary'))
      .notEmpty()
      .withMessage('El nombre de la clínica es requerido'),
    body('licenseNumber')
      .if(body('role').equals('veterinary'))
      .notEmpty()
      .withMessage('El número de licencia es requerido'),
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
