const User = require('../models/User');
const Animal = require('../models/Animal');
const Report = require('../models/Report');
const { successResponse, errorResponse, getPaginationOptions, paginatedResponse } = require('../utils/helpers');

/**
 * Obtener todas las organizaciones verificadas
 * GET /api/organizations
 */
const getAllOrganizations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    const filters = {
      role: 'organization',
      verified: true,
      isActive: true
    };

    const [organizations, total] = await Promise.all([
      User.find(filters)
        .select('name email phone address profilePhotoUrl organizationDetails')
        .sort({ 'organizationDetails.totalRescues': -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(organizations, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener detalles de una organización
 * GET /api/organizations/:id
 */
const getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await User.findOne({
      _id: id,
      role: 'organization',
      isActive: true
    }).select('-passwordHash');

    if (!organization) {
      return res.status(404).json(
        errorResponse('Organización no encontrada')
      );
    }

    // Obtener estadísticas adicionales
    const [animalsCount, availableAnimalsCount, adoptedAnimalsCount, reportsCount] = await Promise.all([
      Animal.countDocuments({ organizationId: id, isDeleted: false }),
      Animal.countDocuments({ organizationId: id, status: 'available', isDeleted: false }),
      Animal.countDocuments({ organizationId: id, status: 'adopted', isDeleted: false }),
      Report.countDocuments({ organizationId: id })
    ]);

    const stats = {
      totalAnimals: animalsCount,
      availableAnimals: availableAnimalsCount,
      adoptedAnimals: adoptedAnimalsCount,
      totalReports: reportsCount
    };

    res.status(200).json(
      successResponse({
        organization,
        stats
      })
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener animales de una organización
 * GET /api/organizations/:id/animals
 */
const getOrganizationAnimals = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status = 'available' } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    // Verificar que la organización exista
    const organization = await User.findOne({
      _id: id,
      role: 'organization',
      isActive: true
    });

    if (!organization) {
      return res.status(404).json(
        errorResponse('Organización no encontrada')
      );
    }

    const filters = { organizationId: id, isDeleted: false };
    if (status) filters.status = status;

    const [animals, total] = await Promise.all([
      Animal.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Animal.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(animals, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener estadísticas de la organización actual
 * GET /api/organizations/:id/stats
 */
const getOrganizationStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar permisos
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return res.status(403).json(
        errorResponse('No tienes permisos para ver estas estadísticas')
      );
    }

    const organization = await User.findOne({
      _id: id,
      role: 'organization'
    });

    if (!organization) {
      return res.status(404).json(
        errorResponse('Organización no encontrada')
      );
    }

    // Obtener estadísticas detalladas
    const [
      totalAnimals,
      availableAnimals,
      pendingAdoptionAnimals,
      adoptedAnimals,
      totalReports,
      pendingReports,
      rescuedReports,
      recentAnimals,
      recentReports
    ] = await Promise.all([
      Animal.countDocuments({ organizationId: id, isDeleted: false }),
      Animal.countDocuments({ organizationId: id, status: 'available', isDeleted: false }),
      Animal.countDocuments({ organizationId: id, status: 'pending_adoption', isDeleted: false }),
      Animal.countDocuments({ organizationId: id, status: 'adopted', isDeleted: false }),
      Report.countDocuments({ organizationId: id }),
      Report.countDocuments({ organizationId: id, status: { $in: ['pending', 'assigned'] } }),
      Report.countDocuments({ organizationId: id, status: 'rescued' }),
      Animal.find({ organizationId: id, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name species photoUrls status createdAt'),
      Report.find({ organizationId: id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('reporterId', 'name')
        .select('description animalType urgencyLevel status createdAt')
    ]);

    // Estadísticas por especie
    const animalsBySpecies = await Animal.aggregate([
      { $match: { organizationId: organization._id, isDeleted: false } },
      { $group: { _id: '$species', count: { $sum: 1 } } }
    ]);

    const stats = {
      animals: {
        total: totalAnimals,
        available: availableAnimals,
        pendingAdoption: pendingAdoptionAnimals,
        adopted: adoptedAnimals,
        bySpecies: animalsBySpecies
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        rescued: rescuedReports
      },
      recent: {
        animals: recentAnimals,
        reports: recentReports
      },
      capacity: {
        max: organization.organizationDetails.capacity,
        current: organization.organizationDetails.currentAnimals,
        available: Math.max(0, organization.organizationDetails.capacity - organization.organizationDetails.currentAnimals)
      }
    };

    res.status(200).json(
      successResponse(stats)
    );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrganizations,
  getOrganizationById,
  getOrganizationAnimals,
  getOrganizationStats
};
