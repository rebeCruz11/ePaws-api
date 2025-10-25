const Adoption = require('../models/Adoption');
const Animal = require('../models/Animal');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, getPaginationOptions, paginatedResponse } = require('../utils/helpers');

/**
 * Enviar solicitud de adopción
 * POST /api/adoptions
 */
const submitAdoption = async (req, res, next) => {
  try {
    const {
      animalId,
      applicationMessage,
      adopterInfo
    } = req.body;

    // Verificar que el usuario sea un adoptante (user role)
    if (req.user.role !== 'user') {
      return res.status(403).json(
        errorResponse('Solo los usuarios pueden enviar solicitudes de adopción')
      );
    }

    // Verificar que el animal exista y esté disponible
    const animal = await Animal.findOne({ _id: animalId, isDeleted: false });
    
    if (!animal) {
      return res.status(404).json(
        errorResponse('Animal no encontrado')
      );
    }

    if (animal.status !== 'available') {
      return res.status(400).json(
        errorResponse('Este animal no está disponible para adopción')
      );
    }

    const adoptionData = {
      animalId,
      adopterId: req.user._id,
      organizationId: animal.organizationId,
      applicationMessage,
      adopterInfo,
      status: 'pending'
    };

    const adoption = await Adoption.create(adoptionData);

    // Notificar a la organización
    await Notification.createNotification({
      userId: animal.organizationId,
      type: 'adoption_update',
      title: 'Nueva solicitud de adopción',
      body: `${req.user.name} ha enviado una solicitud para adoptar a ${animal.name}`,
      relatedId: adoption._id,
      relatedType: 'Adoption'
    });

    await adoption.populate([
      { path: 'animalId', select: 'name species photoUrls' },
      { path: 'adopterId', select: 'name email phone' },
      { path: 'organizationId', select: 'name organizationDetails.organizationName' }
    ]);

    res.status(201).json(
      successResponse(adoption, 'Solicitud de adopción enviada exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todas las solicitudes para un animal
 * GET /api/adoptions/animal/:animalId
 */
const getAnimalAdoptions = async (req, res, next) => {
  try {
    const { animalId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    // Verificar que el animal exista
    const animal = await Animal.findById(animalId);
    if (!animal) {
      return res.status(404).json(
        errorResponse('Animal no encontrado')
      );
    }

    // Verificar que el usuario sea la organización propietaria o admin
    if (req.user.role !== 'admin' && animal.organizationId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('No tienes permisos para ver estas solicitudes')
      );
    }

    const [adoptions, total] = await Promise.all([
      Adoption.find({ animalId })
        .populate('adopterId', 'name email phone profilePhotoUrl')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Adoption.countDocuments({ animalId })
    ]);

    res.status(200).json(
      paginatedResponse(adoptions, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener una solicitud de adopción por ID
 * GET /api/adoptions/:id
 */
const getAdoptionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const adoption = await Adoption.findById(id)
      .populate('animalId', 'name species breed photoUrls organizationId')
      .populate('adopterId', 'name email phone address profilePhotoUrl')
      .populate('organizationId', 'name email phone organizationDetails');

    if (!adoption) {
      return res.status(404).json(
        errorResponse('Solicitud de adopción no encontrada')
      );
    }

    // Verificar permisos
    const isAdopter = adoption.adopterId._id.toString() === req.user._id.toString();
    const isOrganization = adoption.organizationId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAdopter && !isOrganization && !isAdmin) {
      return res.status(403).json(
        errorResponse('No tienes permisos para ver esta solicitud')
      );
    }

    res.status(200).json(
      successResponse(adoption)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar estado de solicitud de adopción
 * PUT /api/adoptions/:id/status
 */
const updateAdoptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, rejectionReason } = req.body;

    const adoption = await Adoption.findById(id).populate('animalId');

    if (!adoption) {
      return res.status(404).json(
        errorResponse('Solicitud de adopción no encontrada')
      );
    }

    // Verificar que el usuario sea la organización propietaria o admin
    if (req.user.role !== 'admin' && adoption.organizationId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('No tienes permisos para actualizar esta solicitud')
      );
    }

    const previousStatus = adoption.status;
    adoption.status = status;

    if (reviewNotes) adoption.reviewNotes = reviewNotes;
    if (rejectionReason) adoption.rejectionReason = rejectionReason;

    await adoption.save();

    // Actualizar estado del animal si la adopción es aprobada o completada
    if (status === 'approved' && adoption.animalId) {
      await Animal.findByIdAndUpdate(
        adoption.animalId._id,
        { status: 'pending_adoption' }
      );
    }

    if (status === 'completed' && adoption.animalId) {
      await Animal.findByIdAndUpdate(
        adoption.animalId._id,
        { status: 'adopted' }
      );
    }

    // Si se rechaza o cancela después de aprobación, volver animal a disponible
    if ((status === 'rejected' || status === 'cancelled') && 
        (previousStatus === 'approved' || previousStatus === 'under_review') && 
        adoption.animalId) {
      const animal = await Animal.findById(adoption.animalId._id);
      if (animal && animal.status === 'pending_adoption') {
        animal.status = 'available';
        await animal.save();
      }
    }

    // Notificar al adoptante
    let notificationBody = '';
    switch (status) {
      case 'under_review':
        notificationBody = `Tu solicitud de adopción está siendo revisada`;
        break;
      case 'approved':
        notificationBody = `¡Tu solicitud de adopción ha sido aprobada!`;
        break;
      case 'rejected':
        notificationBody = `Tu solicitud de adopción ha sido rechazada`;
        break;
      case 'completed':
        notificationBody = `¡Felicidades! La adopción se ha completado`;
        break;
      default:
        notificationBody = `Tu solicitud de adopción ha sido actualizada`;
    }

    await Notification.createNotification({
      userId: adoption.adopterId,
      type: 'adoption_update',
      title: 'Actualización de adopción',
      body: notificationBody,
      relatedId: adoption._id,
      relatedType: 'Adoption'
    });

    await adoption.populate([
      { path: 'animalId', select: 'name species photoUrls' },
      { path: 'adopterId', select: 'name email phone' },
      { path: 'organizationId', select: 'name organizationDetails.organizationName' }
    ]);

    res.status(200).json(
      successResponse(adoption, 'Estado de adopción actualizado exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener solicitudes del usuario actual
 * GET /api/adoptions/my-applications
 */
const getMyApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    const filters = { adopterId: req.user._id };
    if (status) filters.status = status;

    const [adoptions, total] = await Promise.all([
      Adoption.find(filters)
        .populate('animalId', 'name species breed photoUrls status')
        .populate('organizationId', 'name organizationDetails.organizationName')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Adoption.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(adoptions, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener solicitudes de una organización
 * GET /api/adoptions/organization/:orgId
 */
const getOrganizationAdoptions = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    // Verificar permisos
    if (req.user.role !== 'admin' && req.user._id.toString() !== orgId) {
      return res.status(403).json(
        errorResponse('No tienes permisos para ver estas solicitudes')
      );
    }

    const filters = { organizationId: orgId };
    if (status) filters.status = status;

    const [adoptions, total] = await Promise.all([
      Adoption.find(filters)
        .populate('animalId', 'name species breed photoUrls status')
        .populate('adopterId', 'name email phone profilePhotoUrl')
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Adoption.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(adoptions, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Cancelar solicitud de adopción (por el adoptante)
 * PUT /api/adoptions/:id/cancel
 */
const cancelAdoption = async (req, res, next) => {
  try {
    const { id } = req.params;

    const adoption = await Adoption.findById(id);

    if (!adoption) {
      return res.status(404).json(
        errorResponse('Solicitud de adopción no encontrada')
      );
    }

    // Verificar que el usuario sea el adoptante
    if (adoption.adopterId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('No tienes permisos para cancelar esta solicitud')
      );
    }

    // Solo se puede cancelar si está pending o under_review
    if (!['pending', 'under_review', 'approved'].includes(adoption.status)) {
      return res.status(400).json(
        errorResponse('No se puede cancelar una solicitud en este estado')
      );
    }

    adoption.status = 'cancelled';
    await adoption.save();

    // Si el animal estaba en pending_adoption, volver a available
    const animal = await Animal.findById(adoption.animalId);
    if (animal && animal.status === 'pending_adoption') {
      animal.status = 'available';
      await animal.save();
    }

    // Notificar a la organización
    await Notification.createNotification({
      userId: adoption.organizationId,
      type: 'adoption_update',
      title: 'Adopción cancelada',
      body: `${req.user.name} ha cancelado su solicitud de adopción`,
      relatedId: adoption._id,
      relatedType: 'Adoption'
    });

    res.status(200).json(
      successResponse(adoption, 'Solicitud de adopción cancelada')
    );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitAdoption,
  getAnimalAdoptions,
  getAdoptionById,
  updateAdoptionStatus,
  getMyApplications,
  getOrganizationAdoptions,
  cancelAdoption
};
