const Report = require('../models/Report');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, getPaginationOptions, paginatedResponse } = require('../utils/helpers');

/**
 * Crear nuevo reporte
 * POST /api/reports
 */
const createReport = async (req, res, next) => {
  try {
    const {
      description,
      urgencyLevel,
      animalType,
      latitude,
      longitude,
      locationAddress,
      photoUrls,
      organizationId
    } = req.body;

    const reportData = {
      reporterId: req.user._id,
      description,
      urgencyLevel,
      animalType,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      locationAddress,
      photoUrls: photoUrls || [],
      organizationId: organizationId || null,
      status: 'pending'
    };

    const report = await Report.create(reportData);
    
    // Popular información del reportero
    await report.populate('reporterId', 'name email phone');

    res.status(201).json(
      successResponse(report, 'Reporte creado exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todos los reportes con filtros
 * GET /api/reports
 */
const getAllReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, urgencyLevel, animalType, organizationId } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    // Construir filtros
    const filters = {};
    if (status) filters.status = status;
    if (urgencyLevel) filters.urgencyLevel = urgencyLevel;
    if (animalType) filters.animalType = animalType;
    if (organizationId) filters.organizationId = organizationId;

    // Ejecutar query con paginación
    const [reports, total] = await Promise.all([
      Report.find(filters)
        .populate('reporterId', 'name email phone')
        .populate('organizationId', 'name organizationDetails.organizationName')
        .populate('veterinaryId', 'name veterinaryDetails.clinicName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(reports, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un reporte por ID
 * GET /api/reports/:id
 */
const getReportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate('reporterId', 'name email phone profilePhotoUrl')
      .populate('organizationId', 'name email phone organizationDetails')
      .populate('veterinaryId', 'name email phone veterinaryDetails');

    if (!report) {
      return res.status(404).json(
        errorResponse('Reporte no encontrado')
      );
    }

    res.status(200).json(
      successResponse(report)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar reporte
 * PUT /api/reports/:id
 */
const updateReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      organizationId,
      veterinaryId,
      notes,
      description,
      urgencyLevel,
      animalType,
      latitude,
      longitude,
      locationAddress,
      photoUrls
    } = req.body;

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json(
        errorResponse('Reporte no encontrado')
      );
    }

    // Permitir actualizar a admin, organizaciones y veterinarias
    if (!['admin', 'organization', 'veterinary'].includes(req.user.role)) {
      return res.status(403).json(
        errorResponse('No tienes permisos para actualizar este reporte')
      );
    }

    // Permitir que veterinarias editen cualquier campo: asignar valores si se proporcionan
    if (description !== undefined) report.description = description;
    if (urgencyLevel) report.urgencyLevel = urgencyLevel;
    if (animalType) report.animalType = animalType;

    if (latitude !== undefined && longitude !== undefined) {
      report.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
    }

    if (locationAddress !== undefined) report.locationAddress = locationAddress;
    if (photoUrls !== undefined) report.photoUrls = photoUrls;

    // Manejo de status (mantener lógica existente)
    if (status) {
      const previousStatus = report.status;
      report.status = status;

      // Actualizar totalRescues si el estado cambia a 'rescued'
      if (status === 'rescued' && previousStatus !== 'rescued' && report.organizationId) {
        await User.findByIdAndUpdate(
          report.organizationId,
          { $inc: { 'organizationDetails.totalRescues': 1 } }
        );
      }

      // Crear notificación para el reportero
      await Notification.createNotification({
        userId: report.reporterId,
        type: 'report_update',
        title: 'Actualización de reporte',
        body: `Tu reporte ha cambiado de estado a: ${status}`,
        relatedId: report._id,
        relatedType: 'Report'
      });
    }

    if (organizationId !== undefined) {
      report.organizationId = organizationId;
      
      // Notificar a la organización solo si se está asignando (no null)
      if (organizationId) {
        await Notification.createNotification({
          userId: organizationId,
          type: 'new_case',
          title: 'Nuevo caso asignado',
          body: `Se te ha asignado un nuevo caso de ${report.animalType}`,
          relatedId: report._id,
          relatedType: 'Report'
        });
      }
    }

    if (veterinaryId !== undefined) {
      report.veterinaryId = veterinaryId;
      
      // Notificar a la veterinaria solo si se está asignando (no null)
      if (veterinaryId) {
        await Notification.createNotification({
          userId: veterinaryId,
          type: 'new_case',
          title: 'Nuevo caso veterinario',
          body: `Se te ha asignado un nuevo caso médico`,
          relatedId: report._id,
          relatedType: 'Report'
        });
      }
    }

    if (notes !== undefined) report.notes = notes;

    await report.save();
    await report.populate([
      { path: 'reporterId', select: 'name email phone' },
      { path: 'organizationId', select: 'name organizationDetails.organizationName' },
      { path: 'veterinaryId', select: 'name veterinaryDetails.clinicName' }
    ]);

    res.status(200).json(
      successResponse(report, 'Reporte actualizado exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener reportes cercanos a una ubicación
 * GET /api/reports/nearby
 */
const getNearbyReports = async (req, res, next) => {
  try {
    const { latitude, longitude, maxDistance = 10000 } = req.query; // maxDistance en metros

    if (!latitude || !longitude) {
      return res.status(400).json(
        errorResponse('Se requieren las coordenadas (latitude, longitude)')
      );
    }

    const reports = await Report.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      status: { $in: ['pending', 'assigned'] } // Solo reportes activos
    })
      .populate('reporterId', 'name phone')
      .populate('organizationId', 'name organizationDetails.organizationName')
      .limit(50);

    res.status(200).json(
      successResponse(reports)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener reportes del usuario actual
 * GET /api/reports/my-reports
 */
const getMyReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    const filters = { reporterId: req.user._id };

    const [reports, total] = await Promise.all([
      Report.find(filters)
        .populate('organizationId', 'name organizationDetails.organizationName')
        .populate('veterinaryId', 'name veterinaryDetails.clinicName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(reports, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener reportes asignados a la organización actual
 * GET /api/reports/organization/assigned
 */
const getOrganizationReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    const filters = { organizationId: req.user._id };
    if (status) filters.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filters)
        .populate('reporterId', 'name email phone')
        .populate('veterinaryId', 'name veterinaryDetails.clinicName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(reports, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};
/**
 * Obtener reportes asignados a la veterinaria actual
 * GET /api/reports/veterinary/assigned
 */
const getVeterinaryReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    // Filtrar por veterinaria actual (usuario autenticado)
    const filters = { veterinaryId: req.user._id };
    if (status) filters.status = status;

    const [reports, total] = await Promise.all([
      Report.find(filters)
        .populate('reporterId', 'name email phone')
        .populate('organizationId', 'name organizationDetails.organizationName')
        .sort({ urgencyLevel: -1, createdAt: -1 })  // Ordena por urgencia primero
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(reports, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  getNearbyReports,
  getMyReports,
  getOrganizationReports,
  getVeterinaryReports
};
