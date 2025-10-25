const Animal = require('../models/Animal');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');
const { successResponse, errorResponse, getPaginationOptions, paginatedResponse } = require('../utils/helpers');

/**
 * Crear perfil de animal para adopción
 * POST /api/animals
 */
const createAnimal = async (req, res, next) => {
  try {
    const {
      reportId,
      name,
      species,
      breed,
      gender,
      ageEstimate,
      size,
      color,
      story,
      personalityTraits,
      specialNeeds,
      photoUrls,
      videoUrl,
      healthInfo
    } = req.body;

    // Verificar que el usuario sea una organización
    if (req.user.role !== 'organization') {
      return res.status(403).json(
        errorResponse('Solo las organizaciones pueden crear perfiles de animales')
      );
    }

    const animalData = {
      organizationId: req.user._id,
      reportId: reportId || null,
      name,
      species,
      breed,
      gender,
      ageEstimate,
      size,
      color,
      story,
      personalityTraits: personalityTraits || [],
      specialNeeds,
      photoUrls,
      videoUrl,
      healthInfo: healthInfo || {},
      status: 'available'
    };

    const animal = await Animal.create(animalData);
    
    // Incrementar currentAnimals de la organización
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { 'organizationDetails.currentAnimals': 1 } }
    );

    await animal.populate('organizationId', 'name organizationDetails.organizationName');

    res.status(201).json(
      successResponse(animal, 'Perfil de animal creado exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener todos los animales con filtros
 * GET /api/animals
 */
const getAllAnimals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, species, size, organizationId, status = 'available' } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    // Construir filtros
    const filters = { isDeleted: false };
    if (species) filters.species = species;
    if (size) filters.size = size;
    if (organizationId) filters.organizationId = organizationId;
    if (status) filters.status = status;

    // Ejecutar query con paginación
    const [animals, total] = await Promise.all([
      Animal.find(filters)
        .populate('organizationId', 'name organizationDetails.organizationName organizationDetails.logoUrl phone email')
        .populate('reportId', 'location locationAddress urgencyLevel')
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
 * Obtener animal por ID con historial médico
 * GET /api/animals/:id
 */
const getAnimalById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const animal = await Animal.findOne({ _id: id, isDeleted: false })
      .populate('organizationId', 'name email phone address organizationDetails')
      .populate('reportId', 'location locationAddress description urgencyLevel createdAt');

    if (!animal) {
      return res.status(404).json(
        errorResponse('Animal no encontrado')
      );
    }

    // Obtener historial médico
    const medicalRecords = await MedicalRecord.find({ animalId: id })
      .populate('veterinaryId', 'name veterinaryDetails.clinicName')
      .sort({ visitDate: -1 });

    res.status(200).json(
      successResponse({
        ...animal.toObject(),
        medicalRecords
      })
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar información del animal
 * PUT /api/animals/:id
 */
const updateAnimal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      breed,
      gender,
      ageEstimate,
      size,
      color,
      story,
      personalityTraits,
      specialNeeds,
      photoUrls,
      videoUrl,
      healthInfo,
      status
    } = req.body;

    const animal = await Animal.findOne({ _id: id, isDeleted: false });

    if (!animal) {
      return res.status(404).json(
        errorResponse('Animal no encontrado')
      );
    }

    // Verificar que el usuario sea la organización propietaria o admin
    if (req.user.role !== 'admin' && animal.organizationId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('No tienes permisos para actualizar este animal')
      );
    }

    // Actualizar campos
    if (name) animal.name = name;
    if (breed) animal.breed = breed;
    if (gender) animal.gender = gender;
    if (ageEstimate) animal.ageEstimate = ageEstimate;
    if (size) animal.size = size;
    if (color) animal.color = color;
    if (story !== undefined) animal.story = story;
    if (personalityTraits) animal.personalityTraits = personalityTraits;
    if (specialNeeds !== undefined) animal.specialNeeds = specialNeeds;
    if (photoUrls) animal.photoUrls = photoUrls;
    if (videoUrl !== undefined) animal.videoUrl = videoUrl;
    if (healthInfo) animal.healthInfo = { ...animal.healthInfo, ...healthInfo };
    
    if (status) {
      const previousStatus = animal.status;
      animal.status = status;

      // Si cambia de available a adopted, decrementar currentAnimals
      if (status === 'adopted' && previousStatus !== 'adopted') {
        await User.findByIdAndUpdate(
          animal.organizationId,
          { $inc: { 'organizationDetails.currentAnimals': -1 } }
        );
      }
      // Si cambia de adopted a available, incrementar currentAnimals
      if (previousStatus === 'adopted' && status !== 'adopted') {
        await User.findByIdAndUpdate(
          animal.organizationId,
          { $inc: { 'organizationDetails.currentAnimals': 1 } }
        );
      }
    }

    await animal.save();
    await animal.populate('organizationId', 'name organizationDetails.organizationName');

    res.status(200).json(
      successResponse(animal, 'Animal actualizado exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar animal (soft delete)
 * DELETE /api/animals/:id
 */
const deleteAnimal = async (req, res, next) => {
  try {
    const { id } = req.params;

    const animal = await Animal.findOne({ _id: id, isDeleted: false });

    if (!animal) {
      return res.status(404).json(
        errorResponse('Animal no encontrado')
      );
    }

    // Verificar que el usuario sea la organización propietaria o admin
    if (req.user.role !== 'admin' && animal.organizationId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('No tienes permisos para eliminar este animal')
      );
    }

    // Soft delete
    animal.isDeleted = true;
    await animal.save();

    // Decrementar currentAnimals si el animal no estaba adoptado
    if (animal.status !== 'adopted' && animal.status !== 'deceased') {
      await User.findByIdAndUpdate(
        animal.organizationId,
        { $inc: { 'organizationDetails.currentAnimals': -1 } }
      );
    }

    res.status(200).json(
      successResponse(null, 'Animal eliminado exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener animales de una organización específica
 * GET /api/organizations/:id/animals
 */
const getAnimalsByOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

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

module.exports = {
  createAnimal,
  getAllAnimals,
  getAnimalById,
  updateAnimal,
  deleteAnimal,
  getAnimalsByOrganization
};
