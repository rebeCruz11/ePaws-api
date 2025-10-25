const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();

const {
  createMedicalRecord,
  getAnimalMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  getMyCases
} = require('../controllers/medicalRecord.controller');

const { authMiddleware } = require('../middleware/auth.middleware');
const { roleMiddleware } = require('../middleware/role.middleware');
const validationMiddleware = require('../middleware/validation.middleware');

/**
 * @route   POST /api/medical-records
 * @desc    Crear registro médico
 * @access  Private (Veterinary)
 */
router.post(
  '/',
  [
    authMiddleware,
    roleMiddleware('veterinary'),
    body('animalId')
      .notEmpty()
      .withMessage('El ID del animal es requerido')
      .isMongoId()
      .withMessage('ID de animal inválido'),
    body('visitType')
      .notEmpty()
      .withMessage('El tipo de visita es requerido')
      .isIn(['initial_exam', 'treatment', 'surgery', 'follow_up', 'vaccination', 'discharge'])
      .withMessage('Tipo de visita inválido'),
    body('diagnosis')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('El diagnóstico no puede exceder 1000 caracteres'),
    body('treatment')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('El tratamiento no puede exceder 2000 caracteres'),
    body('medications')
      .optional()
      .isArray()
      .withMessage('medications debe ser un array'),
    body('estimatedCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El costo estimado debe ser un número positivo'),
    body('actualCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El costo actual debe ser un número positivo'),
    body('reportId')
      .optional()
      .isMongoId()
      .withMessage('ID de reporte inválido'),
    validationMiddleware
  ],
  createMedicalRecord
);

/**
 * @route   GET /api/medical-records/animal/:animalId
 * @desc    Obtener registros médicos de un animal
 * @access  Private
 */
router.get(
  '/animal/:animalId',
  [
    authMiddleware,
    param('animalId')
      .isMongoId()
      .withMessage('ID de animal inválido'),
    validationMiddleware
  ],
  getAnimalMedicalRecords
);

/**
 * @route   GET /api/medical-records/my-cases
 * @desc    Obtener casos de la veterinaria actual
 * @access  Private (Veterinary)
 */
router.get(
  '/my-cases',
  [authMiddleware, roleMiddleware('veterinary')],
  getMyCases
);

/**
 * @route   GET /api/medical-records/:id
 * @desc    Obtener registro médico por ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    authMiddleware,
    param('id')
      .isMongoId()
      .withMessage('ID de registro médico inválido'),
    validationMiddleware
  ],
  getMedicalRecordById
);

/**
 * @route   PUT /api/medical-records/:id
 * @desc    Actualizar registro médico
 * @access  Private (Veterinary/Admin)
 */
router.put(
  '/:id',
  [
    authMiddleware,
    roleMiddleware(['veterinary', 'admin']),
    param('id')
      .isMongoId()
      .withMessage('ID de registro médico inválido'),
    body('visitType')
      .optional()
      .isIn(['initial_exam', 'treatment', 'surgery', 'follow_up', 'vaccination', 'discharge'])
      .withMessage('Tipo de visita inválido'),
    body('status')
      .optional()
      .isIn(['scheduled', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Estado inválido'),
    body('estimatedCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El costo estimado debe ser un número positivo'),
    body('actualCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('El costo actual debe ser un número positivo'),
    validationMiddleware
  ],
  updateMedicalRecord
);

module.exports = router;
