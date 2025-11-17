const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();

const {
  createAdvertisement,
  getAllAdvertisements,
  getActiveAdvertisements,
  getAdvertisementById,
  getMyAdvertisements,
  updateAdvertisement,
  renewAdvertisement,
  registerClick,
  cancelAdvertisement,
  deleteAdvertisement,
  getAdvertisementStats
} = require('../controllers/advertisement.controller');

const { authMiddleware } = require('../middleware/auth.middleware');
const { roleMiddleware } = require('../middleware/role.middleware');
const validationMiddleware = require('../middleware/validation.middleware');

/**
 * @route   POST /api/advertisements
 * @desc    Crear nueva publicidad
 * @access  Private (Organization/Veterinary)
 */
router.post(
  '/',
  [
    authMiddleware,
    roleMiddleware(['organization', 'veterinary']),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('El título es requerido')
      .isLength({ max: 100 })
      .withMessage('El título no puede exceder 100 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres'),
    body('imageUrl')
      .notEmpty()
      .withMessage('La imagen es requerida')
      .isURL()
      .withMessage('Debe ser una URL válida'),
    body('linkUrl')
      .optional()
      .isURL()
      .withMessage('Debe ser una URL válida'),
    body('plan')
      .notEmpty()
      .withMessage('El plan es requerido')
      .isIn(['monthly', 'annual'])
      .withMessage('Plan inválido (monthly o annual)'),
    body('paymentMethod')
      .notEmpty()
      .withMessage('El método de pago es requerido')
      .isIn(['credit_card', 'debit_card', 'paypal', 'bank_transfer'])
      .withMessage('Método de pago inválido'),
    body('cardholderName')
      .if(body('paymentMethod').isIn(['credit_card', 'debit_card']))
      .notEmpty()
      .withMessage('El nombre del titular es requerido'),
    body('last4Digits')
      .if(body('paymentMethod').isIn(['credit_card', 'debit_card']))
      .notEmpty()
      .withMessage('Los últimos 4 dígitos son requeridos')
      .isLength({ min: 4, max: 4 })
      .withMessage('Deben ser exactamente 4 dígitos'),
    body('email')
      .if(body('paymentMethod').equals('paypal'))
      .notEmpty()
      .withMessage('El email de PayPal es requerido')
      .isEmail()
      .withMessage('Email inválido'),
    body('accountNumber')
      .if(body('paymentMethod').equals('bank_transfer'))
      .notEmpty()
      .withMessage('El número de cuenta es requerido'),
    body('transactionId')
      .optional()
      .trim(),
    validationMiddleware
  ],
  createAdvertisement
);

/**
 * @route   GET /api/advertisements
 * @desc    Obtener todas las publicidades con filtros
 * @access  Private (Admin)
 */
router.get(
  '/',
  [
    authMiddleware,
    roleMiddleware('admin'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Página inválida'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Límite inválido'),
    query('status')
      .optional()
      .isIn(['pending', 'active', 'expired', 'cancelled'])
      .withMessage('Estado inválido'),
    query('userType')
      .optional()
      .isIn(['organization', 'veterinary'])
      .withMessage('Tipo de usuario inválido'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive debe ser booleano'),
    validationMiddleware
  ],
  getAllAdvertisements
);

/**
 * @route   GET /api/advertisements/active
 * @desc    Obtener publicidades activas para mostrar en la app
 * @access  Public
 */
router.get(
  '/active',
  [
    query('userType')
      .optional()
      .isIn(['organization', 'veterinary'])
      .withMessage('Tipo de usuario inválido'),
    validationMiddleware
  ],
  getActiveAdvertisements
);

/**
 * @route   GET /api/advertisements/my/ads
 * @desc    Obtener mis publicidades
 * @access  Private (Organization/Veterinary)
 */
router.get(
  '/my/ads',
  [
    authMiddleware,
    roleMiddleware(['organization', 'veterinary'])
  ],
  getMyAdvertisements
);

/**
 * @route   GET /api/advertisements/:id
 * @desc    Obtener publicidad por ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    authMiddleware,
    param('id')
      .isMongoId()
      .withMessage('ID de publicidad inválido'),
    validationMiddleware
  ],
  getAdvertisementById
);

/**
 * @route   GET /api/advertisements/:id/stats
 * @desc    Obtener estadísticas de publicidad
 * @access  Private (Owner/Admin)
 */
router.get(
  '/:id/stats',
  [
    authMiddleware,
    param('id')
      .isMongoId()
      .withMessage('ID de publicidad inválido'),
    validationMiddleware
  ],
  getAdvertisementStats
);

/**
 * @route   PUT /api/advertisements/:id
 * @desc    Actualizar publicidad
 * @access  Private (Owner/Admin)
 */
router.put(
  '/:id',
  [
    authMiddleware,
    param('id')
      .isMongoId()
      .withMessage('ID de publicidad inválido'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('El título no puede exceder 100 caracteres'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La descripción no puede exceder 500 caracteres'),
    body('imageUrl')
      .optional()
      .isURL()
      .withMessage('Debe ser una URL válida'),
    body('linkUrl')
      .optional()
      .isURL()
      .withMessage('Debe ser una URL válida'),
    validationMiddleware
  ],
  updateAdvertisement
);

/**
 * @route   POST /api/advertisements/:id/renew
 * @desc    Renovar publicidad
 * @access  Private (Owner)
 */
router.post(
  '/:id/renew',
  [
    authMiddleware,
    param('id')
      .isMongoId()
      .withMessage('ID de publicidad inválido'),
    body('plan')
      .notEmpty()
      .withMessage('El plan es requerido')
      .isIn(['monthly', 'annual'])
      .withMessage('Plan inválido'),
    body('transactionId')
      .optional()
      .trim(),
    validationMiddleware
  ],
  renewAdvertisement
);

/**
 * @route   POST /api/advertisements/:id/click
 * @desc    Registrar click en publicidad
 * @access  Public
 */
router.post(
  '/:id/click',
  [
    param('id')
      .isMongoId()
      .withMessage('ID de publicidad inválido'),
    validationMiddleware
  ],
  registerClick
);

/**
 * @route   POST /api/advertisements/:id/cancel
 * @desc    Cancelar publicidad
 * @access  Private (Owner/Admin)
 */
router.post(
  '/:id/cancel',
  [
    authMiddleware,
    param('id')
      .isMongoId()
      .withMessage('ID de publicidad inválido'),
    validationMiddleware
  ],
  cancelAdvertisement
);

/**
 * @route   DELETE /api/advertisements/:id
 * @desc    Eliminar publicidad (soft delete)
 * @access  Private (Owner/Admin)
 */
router.delete(
  '/:id',
  [
    authMiddleware,
    param('id')
      .isMongoId()
      .withMessage('ID de publicidad inválido'),
    validationMiddleware
  ],
  deleteAdvertisement
);

module.exports = router;
