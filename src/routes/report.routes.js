const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();

const {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  getNearbyReports,
  getMyReports,
  getOrganizationReports
} = require('../controllers/report.controller');

const { authMiddleware } = require('../middleware/auth.middleware');
const { roleMiddleware } = require('../middleware/role.middleware');
const validationMiddleware = require('../middleware/validation.middleware');

/**
 * @route   POST /api/reports
 * @desc    Crear nuevo reporte
 * @access  Private
 */
router.post(
  '/',
  [
    authMiddleware,
    body('description')
      .trim()
      .notEmpty()
      .withMessage('La descripción es requerida')
      .isLength({ min: 10, max: 2000 })
      .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),
    body('urgencyLevel')
      .notEmpty()
      .withMessage('El nivel de urgencia es requerido')
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Nivel de urgencia inválido'),
    body('animalType')
      .notEmpty()
      .withMessage('El tipo de animal es requerido')
      .isIn(['dog', 'cat', 'bird', 'rabbit', 'other'])
      .withMessage('Tipo de animal inválido'),
    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitud inválida'),
    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitud inválida'),
    body('locationAddress')
      .optional()
      .trim()
      .isLength({ max: 300 })
      .withMessage('La dirección no puede exceder 300 caracteres'),
    body('photoUrls')
      .optional()
      .isArray()
      .withMessage('photoUrls debe ser un array'),
    validationMiddleware
  ],
  createReport
);

/**
 * @route   GET /api/reports
 * @desc    Obtener todos los reportes con filtros
 * @access  Public
 */
router.get(
  '/',
  [
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
      .isIn(['pending', 'assigned', 'rescued', 'in_veterinary', 'recovered', 'adopted', 'closed'])
      .withMessage('Estado inválido'),
    query('urgencyLevel')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Nivel de urgencia inválido'),
    query('animalType')
      .optional()
      .isIn(['dog', 'cat', 'bird', 'rabbit', 'other'])
      .withMessage('Tipo de animal inválido'),
    validationMiddleware
  ],
  getAllReports
);

/**
 * @route   GET /api/reports/nearby
 * @desc    Obtener reportes cercanos
 * @access  Public
 */
router.get(
  '/nearby',
  [
    query('latitude')
      .notEmpty()
      .withMessage('La latitud es requerida')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitud inválida'),
    query('longitude')
      .notEmpty()
      .withMessage('La longitud es requerida')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitud inválida'),
    query('maxDistance')
      .optional()
      .isInt({ min: 100, max: 100000 })
      .withMessage('Distancia máxima inválida'),
    validationMiddleware
  ],
  getNearbyReports
);

/**
 * @route   GET /api/reports/my-reports
 * @desc    Obtener reportes del usuario actual
 * @access  Private
 */
router.get('/my-reports', authMiddleware, getMyReports);

/**
 * @route   GET /api/reports/organization/assigned
 * @desc    Obtener reportes asignados a la organización actual
 * @access  Private (Organization)
 */
router.get(
  '/organization/assigned',
  [authMiddleware, roleMiddleware('organization')],
  getOrganizationReports
);

/**
 * @route   GET /api/reports/:id
 * @desc    Obtener un reporte por ID
 * @access  Public
 */
router.get(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('ID de reporte inválido'),
    validationMiddleware
  ],
  getReportById
);

/**
 * @route   PUT /api/reports/:id
 * @desc    Actualizar reporte
 * @access  Private (Organization/Admin)
 */
router.put(
  '/:id',
  [
    authMiddleware,
    roleMiddleware(['organization', 'admin']),
    param('id')
      .isMongoId()
      .withMessage('ID de reporte inválido'),
    body('status')
      .optional()
      .isIn(['pending', 'assigned', 'rescued', 'in_veterinary', 'recovered', 'adopted', 'closed'])
      .withMessage('Estado inválido'),
    body('organizationId')
      .optional()
      .isMongoId()
      .withMessage('ID de organización inválido'),
    body('veterinaryId')
      .optional()
      .isMongoId()
      .withMessage('ID de veterinaria inválido'),
    validationMiddleware
  ],
  updateReport
);

module.exports = router;
