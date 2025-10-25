const User = require('../models/User');
const { successResponse, errorResponse, getPaginationOptions, paginatedResponse } = require('../utils/helpers');

/**
 * Obtener todas las veterinarias verificadas
 * GET /api/veterinaries
 */
const getAllVeterinaries = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    const filters = {
      role: 'veterinary',
      verified: true,
      isActive: true
    };

    const [veterinaries, total] = await Promise.all([
      User.find(filters)
        .select('name email phone address profilePhotoUrl veterinaryDetails')
        .sort({ 'veterinaryDetails.rating': -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(veterinaries, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener veterinarias cercanas a una ubicación
 * GET /api/veterinaries/nearby
 */
const getNearbyVeterinaries = async (req, res, next) => {
  try {
    const { latitude, longitude, maxDistance = 20000 } = req.query; // maxDistance en metros

    if (!latitude || !longitude) {
      return res.status(400).json(
        errorResponse('Se requieren las coordenadas (latitude, longitude)')
      );
    }

    const veterinaries = await User.find({
      role: 'veterinary',
      verified: true,
      isActive: true,
      'veterinaryDetails.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    })
      .select('name email phone address profilePhotoUrl veterinaryDetails')
      .limit(20);

    res.status(200).json(
      successResponse(veterinaries)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener detalles de una veterinaria
 * GET /api/veterinaries/:id
 */
const getVeterinaryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const veterinary = await User.findOne({
      _id: id,
      role: 'veterinary',
      isActive: true
    }).select('-passwordHash');

    if (!veterinary) {
      return res.status(404).json(
        errorResponse('Veterinaria no encontrada')
      );
    }

    res.status(200).json(
      successResponse(veterinary)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Buscar veterinarias por especialidad
 * GET /api/veterinaries/search
 */
const searchVeterinaries = async (req, res, next) => {
  try {
    const { specialty, page = 1, limit = 10 } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    if (!specialty) {
      return res.status(400).json(
        errorResponse('Se requiere especificar una especialidad')
      );
    }

    const filters = {
      role: 'veterinary',
      verified: true,
      isActive: true,
      'veterinaryDetails.specialties': { $regex: specialty, $options: 'i' }
    };

    const [veterinaries, total] = await Promise.all([
      User.find(filters)
        .select('name email phone address profilePhotoUrl veterinaryDetails')
        .sort({ 'veterinaryDetails.rating': -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(veterinaries, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVeterinaries,
  getNearbyVeterinaries,
  getVeterinaryById,
  searchVeterinaries
};
