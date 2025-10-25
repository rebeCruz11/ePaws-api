const express = require('express');
const { param, query } = require('express-validator');
const router = express.Router();

const {
  getAllOrganizations,
  getOrganizationById,
  getOrganizationAnimals,
  getOrganizationStats
} = require('../controllers/organization.controller');

const { authMiddleware } = require('../middleware/auth.middleware');
const { roleMiddleware } = require('../middleware/role.middleware');
const validationMiddleware = require('../middleware/validation.middleware');

/**
 * @route   GET /api/organizations
 * @desc    Obtener todas las organizaciones verificadas
 * @access  Public
 */
router.get('/', getAllOrganizations);

/**
 * @route   GET /api/organizations/:id
 * @desc    Obtener detalles de una organización
 * @access  Public
 */
router.get(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('ID de organización inválido'),
    validationMiddleware
  ],
  getOrganizationById
);

/**
 * @route   GET /api/organizations/:id/animals
 * @desc    Obtener animales de una organización
 * @access  Public
 */
router.get(
  '/:id/animals',
  [
    param('id')
      .isMongoId()
      .withMessage('ID de organización inválido'),
    query('status')
      .optional()
      .isIn(['available', 'pending_adoption', 'adopted', 'deceased'])
      .withMessage('Estado inválido'),
    validationMiddleware
  ],
  getOrganizationAnimals
);

/**
 * @route   GET /api/organizations/:id/stats
 * @desc    Obtener estadísticas de una organización
 * @access  Private (Organization/Admin)
 */
router.get(
  '/:id/stats',
  [
    authMiddleware,
    roleMiddleware(['organization', 'admin']),
    param('id')
      .isMongoId()
      .withMessage('ID de organización inválido'),
    validationMiddleware
  ],
  getOrganizationStats
);

module.exports = router;
