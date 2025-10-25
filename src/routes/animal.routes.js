const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();

const {
  createAnimal,
  getAllAnimals,
  getAnimalById,
  updateAnimal,
  deleteAnimal,
  getAnimalsByOrganization
} = require('../controllers/animal.controller');

const { authMiddleware } = require('../middleware/auth.middleware');
const { roleMiddleware } = require('../middleware/role.middleware');
const validationMiddleware = require('../middleware/validation.middleware');

/**
 * @route   POST /api/animals
 * @desc    Crear perfil de animal
 * @access  Private (Organization)
 */
router.post(
  '/',
  [
    authMiddleware,
    roleMiddleware('organization'),
    body('name')
      .trim()
      .notEmpty()
      .withMessage('El nombre es requerido')
      .isLength({ max: 50 })
      .withMessage('El nombre no puede exceder 50 caracteres'),
    body('species')
      .notEmpty()
      .withMessage('La especie es requerida')
      .isIn(['dog', 'cat', 'bird', 'rabbit', 'other'])
      .withMessage('Especie inválida'),
    body('size')
      .notEmpty()
      .withMessage('El tamaño es requerido')
      .isIn(['small', 'medium', 'large'])
      .withMessage('Tamaño inválido'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'unknown'])
      .withMessage('Género inválido'),
    body('photoUrls')
      .isArray({ min: 1 })
      .withMessage('Debe proporcionar al menos una foto'),
    body('reportId')
      .optional()
      .isMongoId()
      .withMessage('ID de reporte inválido'),
    validationMiddleware
  ],
  createAnimal
);

/**
 * @route   GET /api/animals
 * @desc    Obtener todos los animales con filtros
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
    query('species')
      .optional()
      .isIn(['dog', 'cat', 'bird', 'rabbit', 'other'])
      .withMessage('Especie inválida'),
    query('size')
      .optional()
      .isIn(['small', 'medium', 'large'])
      .withMessage('Tamaño inválido'),
    query('status')
      .optional()
      .isIn(['available', 'pending_adoption', 'adopted', 'deceased'])
      .withMessage('Estado inválido'),
    validationMiddleware
  ],
  getAllAnimals
);

/**
 * @route   GET /api/animals/:id
 * @desc    Obtener animal por ID
 * @access  Public
 */
router.get(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('ID de animal inválido'),
    validationMiddleware
  ],
  getAnimalById
);

/**
 * @route   PUT /api/animals/:id
 * @desc    Actualizar animal
 * @access  Private (Organization/Admin)
 */
router.put(
  '/:id',
  [
    authMiddleware,
    roleMiddleware(['organization', 'admin']),
    param('id')
      .isMongoId()
      .withMessage('ID de animal inválido'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('El nombre no puede exceder 50 caracteres'),
    body('species')
      .optional()
      .isIn(['dog', 'cat', 'bird', 'rabbit', 'other'])
      .withMessage('Especie inválida'),
    body('size')
      .optional()
      .isIn(['small', 'medium', 'large'])
      .withMessage('Tamaño inválido'),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'unknown'])
      .withMessage('Género inválido'),
    body('status')
      .optional()
      .isIn(['available', 'pending_adoption', 'adopted', 'deceased'])
      .withMessage('Estado inválido'),
    validationMiddleware
  ],
  updateAnimal
);

/**
 * @route   DELETE /api/animals/:id
 * @desc    Eliminar animal (soft delete)
 * @access  Private (Organization/Admin)
 */
router.delete(
  '/:id',
  [
    authMiddleware,
    roleMiddleware(['organization', 'admin']),
    param('id')
      .isMongoId()
      .withMessage('ID de animal inválido'),
    validationMiddleware
  ],
  deleteAnimal
);

module.exports = router;
