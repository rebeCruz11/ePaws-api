const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();

const {
  submitAdoption,
  getAnimalAdoptions,
  getAdoptionById,
  updateAdoptionStatus,
  getMyApplications,
  getOrganizationAdoptions,
  cancelAdoption
} = require('../controllers/adoption.controller');

const { authMiddleware } = require('../middleware/auth.middleware');
const { roleMiddleware } = require('../middleware/role.middleware');
const validationMiddleware = require('../middleware/validation.middleware');

/**
 * @route   POST /api/adoptions
 * @desc    Enviar solicitud de adopción
 * @access  Private (User)
 */
router.post(
  '/',
  [
    authMiddleware,
    roleMiddleware('user'),
    body('animalId')
      .notEmpty()
      .withMessage('El ID del animal es requerido')
      .isMongoId()
      .withMessage('ID de animal inválido'),
    body('applicationMessage')
      .trim()
      .notEmpty()
      .withMessage('El mensaje de solicitud es requerido')
      .isLength({ min: 50, max: 2000 })
      .withMessage('El mensaje debe tener entre 50 y 2000 caracteres'),
    body('adopterInfo.hasExperience')
      .isBoolean()
      .withMessage('Debe indicar si tiene experiencia'),
    body('adopterInfo.hasOtherPets')
      .isBoolean()
      .withMessage('Debe indicar si tiene otras mascotas'),
    body('adopterInfo.homeType')
      .notEmpty()
      .withMessage('El tipo de hogar es requerido')
      .isIn(['house', 'apartment', 'farm', 'other'])
      .withMessage('Tipo de hogar inválido'),
    body('adopterInfo.hasYard')
      .isBoolean()
      .withMessage('Debe indicar si tiene patio'),
    body('adopterInfo.householdMembers')
      .isInt({ min: 1 })
      .withMessage('Debe indicar el número de miembros del hogar'),
    validationMiddleware
  ],
  submitAdoption
);

/**
 * @route   GET /api/adoptions/animal/:animalId
 * @desc    Obtener solicitudes para un animal
 * @access  Private (Organization/Admin)
 */
router.get(
  '/animal/:animalId',
  [
    authMiddleware,
    roleMiddleware(['organization', 'admin']),
    param('animalId')
      .isMongoId()
      .withMessage('ID de animal inválido'),
    validationMiddleware
  ],
  getAnimalAdoptions
);

/**
 * @route   GET /api/adoptions/my-applications
 * @desc    Obtener solicitudes del usuario actual
 * @access  Private (User)
 */
router.get(
  '/my-applications',
  [authMiddleware, roleMiddleware('user')],
  getMyApplications
);

/**
 * @route   GET /api/adoptions/organization/:orgId
 * @desc    Obtener solicitudes de una organización
 * @access  Private (Organization/Admin)
 */
router.get(
  '/organization/:orgId',
  [
    authMiddleware,
    roleMiddleware(['organization', 'admin']),
    param('orgId')
      .isMongoId()
      .withMessage('ID de organización inválido'),
    validationMiddleware
  ],
  getOrganizationAdoptions
);

/**
 * @route   GET /api/adoptions/:id
 * @desc    Obtener solicitud de adopción por ID
 * @access  Private
 */
router.get(
  '/:id',
  [
    authMiddleware,
    param('id')
      .isMongoId()
      .withMessage('ID de adopción inválido'),
    validationMiddleware
  ],
  getAdoptionById
);

/**
 * @route   PUT /api/adoptions/:id/status
 * @desc    Actualizar estado de adopción
 * @access  Private (Organization/Admin)
 */
router.put(
  '/:id/status',
  [
    authMiddleware,
    roleMiddleware(['organization', 'admin']),
    param('id')
      .isMongoId()
      .withMessage('ID de adopción inválido'),
    body('status')
      .notEmpty()
      .withMessage('El estado es requerido')
      .isIn(['pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled'])
      .withMessage('Estado inválido'),
    body('reviewNotes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Las notas no pueden exceder 1000 caracteres'),
    body('rejectionReason')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('La razón de rechazo no puede exceder 1000 caracteres'),
    validationMiddleware
  ],
  updateAdoptionStatus
);

/**
 * @route   PUT /api/adoptions/:id/cancel
 * @desc    Cancelar solicitud de adopción
 * @access  Private (User)
 */
router.put(
  '/:id/cancel',
  [
    authMiddleware,
    roleMiddleware('user'),
    param('id')
      .isMongoId()
      .withMessage('ID de adopción inválido'),
    validationMiddleware
  ],
  cancelAdoption
);

module.exports = router;
