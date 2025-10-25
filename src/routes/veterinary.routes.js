const express = require('express');
const { param, query } = require('express-validator');
const router = express.Router();

const {
  getAllVeterinaries,
  getNearbyVeterinaries,
  getVeterinaryById,
  searchVeterinaries
} = require('../controllers/veterinary.controller');

const validationMiddleware = require('../middleware/validation.middleware');

/**
 * @route   GET /api/veterinaries
 * @desc    Obtener todas las veterinarias verificadas
 * @access  Public
 */
router.get('/', getAllVeterinaries);

/**
 * @route   GET /api/veterinaries/nearby
 * @desc    Obtener veterinarias cercanas
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
  getNearbyVeterinaries
);

/**
 * @route   GET /api/veterinaries/search
 * @desc    Buscar veterinarias por especialidad
 * @access  Public
 */
router.get(
  '/search',
  [
    query('specialty')
      .notEmpty()
      .withMessage('La especialidad es requerida'),
    validationMiddleware
  ],
  searchVeterinaries
);

/**
 * @route   GET /api/veterinaries/:id
 * @desc    Obtener detalles de una veterinaria
 * @access  Public
 */
router.get(
  '/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('ID de veterinaria inválido'),
    validationMiddleware
  ],
  getVeterinaryById
);

module.exports = router;
