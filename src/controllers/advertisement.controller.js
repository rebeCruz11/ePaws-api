const Advertisement = require('../models/Advertisement');
const User = require('../models/User');
const { successResponse, errorResponse, getPaginationOptions, paginatedResponse } = require('../utils/helpers');

/**
 * Crear nueva publicidad
 * POST /api/advertisements
 */
const createAdvertisement = async (req, res, next) => {
  try {
    const {
      title,
      description,
      imageUrl,
      linkUrl,
      plan,
      paymentMethod,
      cardholderName,
      last4Digits,
      email,
      accountNumber,
      transactionId
    } = req.body;

    // Verificar que el usuario sea organización o veterinaria
    if (!['organization', 'veterinary'].includes(req.user.role)) {
      return res.status(403).json(
        errorResponse('Solo organizaciones y veterinarias pueden crear publicidad')
      );
    }

    // Verificar si ya tiene una publicidad activa
    const existingAd = await Advertisement.findOne({
      userId: req.user._id,
      status: 'active',
      isActive: true
    });

    if (existingAd) {
      return res.status(400).json(
        errorResponse('Ya tienes una publicidad activa. Renueva o espera a que expire.')
      );
    }

    // Calcular precio según plan y tipo de usuario
    const price = req.user.role === 'organization'
      ? (plan === 'monthly' ? 15 : 110)
      : (plan === 'monthly' ? 20 : 180);

    // Crear objeto de información de pago
    const paymentInfo = {
      paymentMethod,
      paymentDate: new Date(),
      paidAmount: price
    };

    // Agregar campos específicos según método de pago
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      paymentInfo.cardholderName = cardholderName;
      paymentInfo.last4Digits = last4Digits;
    } else if (paymentMethod === 'paypal') {
      paymentInfo.email = email;
    } else if (paymentMethod === 'bank_transfer') {
      paymentInfo.accountNumber = accountNumber;
    }

    if (transactionId) {
      paymentInfo.transactionId = transactionId;
    }

    // Crear publicidad
    const advertisementData = {
      userId: req.user._id,
      userType: req.user.role,
      title,
      description,
      imageUrl,
      linkUrl,
      plan,
      price,
      paymentInfo
    };

    const advertisement = await Advertisement.create(advertisementData);
    await advertisement.populate('userId', 'name email organizationDetails.organizationName veterinaryDetails.clinicName');

    res.status(201).json(
      successResponse(advertisement, 'Publicidad creada exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todas las publicidades (con filtros)
 * GET /api/advertisements
 */
const getAllAdvertisements = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      userType, 
      isActive,
      userId 
    } = req.query;
    
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    // Construir filtros
    const filters = { isDeleted: false };
    if (status) filters.status = status;
    if (userType) filters.userType = userType;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (userId) filters.userId = userId;

    // Ejecutar query con paginación
    const [advertisements, total] = await Promise.all([
      Advertisement.find(filters)
        .populate('userId', 'name email phone organizationDetails.organizationName organizationDetails.logoUrl veterinaryDetails.clinicName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Advertisement.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(advertisements, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener publicidades activas para mostrar en la app
 * GET /api/advertisements/active
 */
const getActiveAdvertisements = async (req, res, next) => {
  try {
    const { userType } = req.query;

    const advertisements = await Advertisement.getActiveAds(userType);

    // Incrementar impresiones
    const adIds = advertisements.map(ad => ad._id);
    await Advertisement.updateMany(
      { _id: { $in: adIds } },
      { $inc: { impressions: 1 } }
    );

    res.status(200).json(
      successResponse(advertisements, 'Publicidades activas obtenidas exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener publicidad por ID
 * GET /api/advertisements/:id
 */
const getAdvertisementById = async (req, res, next) => {
  try {
    const advertisement = await Advertisement.findOne({
      _id: req.params.id,
      isDeleted: false
    }).populate('userId', 'name email phone organizationDetails veterinaryDetails');

    if (!advertisement) {
      return res.status(404).json(
        errorResponse('Publicidad no encontrada')
      );
    }

    res.status(200).json(
      successResponse(advertisement, 'Publicidad obtenida exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener mis publicidades (del usuario autenticado)
 * GET /api/advertisements/my/ads
 */
const getMyAdvertisements = async (req, res, next) => {
  try {
    const advertisements = await Advertisement.find({
      userId: req.user._id,
      isDeleted: false
    }).sort({ createdAt: -1 });

    res.status(200).json(
      successResponse(advertisements, 'Tus publicidades obtenidas exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar publicidad
 * PUT /api/advertisements/:id
 */
const updateAdvertisement = async (req, res, next) => {
  try {
    const { title, description, imageUrl, linkUrl } = req.body;

    const advertisement = await Advertisement.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!advertisement) {
      return res.status(404).json(
        errorResponse('Publicidad no encontrada')
      );
    }

    // Verificar permisos
    if (advertisement.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json(
        errorResponse('No tienes permiso para actualizar esta publicidad')
      );
    }

    // Actualizar campos
    if (title) advertisement.title = title;
    if (description) advertisement.description = description;
    if (imageUrl) advertisement.imageUrl = imageUrl;
    if (linkUrl !== undefined) advertisement.linkUrl = linkUrl;

    await advertisement.save();
    await advertisement.populate('userId', 'name email organizationDetails.organizationName veterinaryDetails.clinicName');

    res.status(200).json(
      successResponse(advertisement, 'Publicidad actualizada exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Renovar publicidad
 * POST /api/advertisements/:id/renew
 */
const renewAdvertisement = async (req, res, next) => {
  try {
    const { plan, transactionId } = req.body;

    const advertisement = await Advertisement.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!advertisement) {
      return res.status(404).json(
        errorResponse('Publicidad no encontrada')
      );
    }

    // Verificar permisos
    if (advertisement.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('No tienes permiso para renovar esta publicidad')
      );
    }

    // Renovar
    await advertisement.renew(plan, transactionId);
    await advertisement.populate('userId', 'name email organizationDetails.organizationName veterinaryDetails.clinicName');

    res.status(200).json(
      successResponse(advertisement, 'Publicidad renovada exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Registrar click en publicidad
 * POST /api/advertisements/:id/click
 */
const registerClick = async (req, res, next) => {
  try {
    const advertisement = await Advertisement.findOne({
      _id: req.params.id,
      isActive: true,
      status: 'active'
    });

    if (!advertisement) {
      return res.status(404).json(
        errorResponse('Publicidad no encontrada o no está activa')
      );
    }

    // Incrementar clicks
    advertisement.clicks += 1;
    await advertisement.save();

    res.status(200).json(
      successResponse({ clicks: advertisement.clicks }, 'Click registrado exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Cancelar publicidad
 * POST /api/advertisements/:id/cancel
 */
const cancelAdvertisement = async (req, res, next) => {
  try {
    const advertisement = await Advertisement.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!advertisement) {
      return res.status(404).json(
        errorResponse('Publicidad no encontrada')
      );
    }

    // Verificar permisos
    if (advertisement.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json(
        errorResponse('No tienes permiso para cancelar esta publicidad')
      );
    }

    advertisement.status = 'cancelled';
    advertisement.isActive = false;
    await advertisement.save();

    res.status(200).json(
      successResponse(advertisement, 'Publicidad cancelada exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar publicidad (soft delete)
 * DELETE /api/advertisements/:id
 */
const deleteAdvertisement = async (req, res, next) => {
  try {
    const advertisement = await Advertisement.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!advertisement) {
      return res.status(404).json(
        errorResponse('Publicidad no encontrada')
      );
    }

    // Verificar permisos
    if (advertisement.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json(
        errorResponse('No tienes permiso para eliminar esta publicidad')
      );
    }

    advertisement.isDeleted = true;
    advertisement.isActive = false;
    await advertisement.save();

    res.status(200).json(
      successResponse(null, 'Publicidad eliminada exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener estadísticas de publicidad
 * GET /api/advertisements/:id/stats
 */
const getAdvertisementStats = async (req, res, next) => {
  try {
    const advertisement = await Advertisement.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!advertisement) {
      return res.status(404).json(
        errorResponse('Publicidad no encontrada')
      );
    }

    // Verificar permisos
    if (advertisement.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json(
        errorResponse('No tienes permiso para ver estas estadísticas')
      );
    }

    const stats = {
      impressions: advertisement.impressions,
      clicks: advertisement.clicks,
      ctr: advertisement.ctr,
      daysRemaining: advertisement.daysRemaining,
      status: advertisement.status,
      plan: advertisement.plan,
      startDate: advertisement.startDate,
      expirationDate: advertisement.expirationDate,
      renewalsCount: advertisement.renewals.length
    };

    res.status(200).json(
      successResponse(stats, 'Estadísticas obtenidas exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAdvertisement,
  getAllAdvertisements,
  getActiveAdvertisements,
  getAdvertisementById,
  getMyAdvertisements,
  updateAdvertisement,
  renewAdvertisement,
  registerClick,
  cancelAdvertisement,
  deleteAdvertisement,
  getAdvertisementStats
};
