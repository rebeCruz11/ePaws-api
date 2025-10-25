const MedicalRecord = require('../models/MedicalRecord');
const Animal = require('../models/Animal');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { successResponse, errorResponse, getPaginationOptions, paginatedResponse } = require('../utils/helpers');

/**
 * Crear registro médico
 * POST /api/medical-records
 */
const createMedicalRecord = async (req, res, next) => {
  try {
    const {
      animalId,
      reportId,
      visitType,
      diagnosis,
      treatment,
      medications,
      notes,
      estimatedCost,
      actualCost,
      photoUrls,
      documents,
      visitDate,
      nextAppointment
    } = req.body;

    // Verificar que el usuario sea una veterinaria
    if (req.user.role !== 'veterinary') {
      return res.status(403).json(
        errorResponse('Solo las veterinarias pueden crear registros médicos')
      );
    }

    // Verificar que el animal exista
    const animal = await Animal.findById(animalId);
    if (!animal) {
      return res.status(404).json(
        errorResponse('Animal no encontrado')
      );
    }

    const recordData = {
      animalId,
      reportId: reportId || null,
      veterinaryId: req.user._id,
      visitType,
      diagnosis,
      treatment,
      medications: medications || [],
      notes,
      estimatedCost: estimatedCost || 0,
      actualCost: actualCost || 0,
      status: 'scheduled',
      photoUrls: photoUrls || [],
      documents: documents || [],
      visitDate: visitDate || new Date(),
      nextAppointment: nextAppointment || null
    };

    const medicalRecord = await MedicalRecord.create(recordData);
    
    // Incrementar totalCasesHandled de la veterinaria
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { 'veterinaryDetails.totalCasesHandled': 1 } }
    );

    // Notificar a la organización propietaria del animal
    await Notification.createNotification({
      userId: animal.organizationId,
      type: 'medical_update',
      title: 'Nuevo registro médico',
      body: `Se ha creado un nuevo registro médico para ${animal.name}`,
      relatedId: medicalRecord._id,
      relatedType: 'MedicalRecord'
    });

    await medicalRecord.populate([
      { path: 'animalId', select: 'name species' },
      { path: 'veterinaryId', select: 'name veterinaryDetails.clinicName' }
    ]);

    res.status(201).json(
      successResponse(medicalRecord, 'Registro médico creado exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener registros médicos de un animal
 * GET /api/medical-records/animal/:animalId
 */
const getAnimalMedicalRecords = async (req, res, next) => {
  try {
    const { animalId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    // Verificar que el animal exista
    const animal = await Animal.findById(animalId);
    if (!animal) {
      return res.status(404).json(
        errorResponse('Animal no encontrado')
      );
    }

    const [records, total] = await Promise.all([
      MedicalRecord.find({ animalId })
        .populate('veterinaryId', 'name email phone veterinaryDetails')
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(limitNum),
      MedicalRecord.countDocuments({ animalId })
    ]);

    res.status(200).json(
      paginatedResponse(records, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener un registro médico por ID
 * GET /api/medical-records/:id
 */
const getMedicalRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await MedicalRecord.findById(id)
      .populate('animalId', 'name species breed gender organizationId')
      .populate('veterinaryId', 'name email phone veterinaryDetails')
      .populate('reportId', 'description location');

    if (!record) {
      return res.status(404).json(
        errorResponse('Registro médico no encontrado')
      );
    }

    res.status(200).json(
      successResponse(record)
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Actualizar registro médico
 * PUT /api/medical-records/:id
 */
const updateMedicalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      visitType,
      diagnosis,
      treatment,
      medications,
      notes,
      estimatedCost,
      actualCost,
      status,
      photoUrls,
      documents,
      visitDate,
      dischargeDate,
      nextAppointment
    } = req.body;

    const record = await MedicalRecord.findById(id).populate('animalId');

    if (!record) {
      return res.status(404).json(
        errorResponse('Registro médico no encontrado')
      );
    }

    // Verificar que el usuario sea la veterinaria que creó el registro o admin
    if (req.user.role !== 'admin' && record.veterinaryId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('No tienes permisos para actualizar este registro')
      );
    }

    // Actualizar campos
    if (visitType) record.visitType = visitType;
    if (diagnosis) record.diagnosis = diagnosis;
    if (treatment) record.treatment = treatment;
    if (medications) record.medications = medications;
    if (notes !== undefined) record.notes = notes;
    if (estimatedCost !== undefined) record.estimatedCost = estimatedCost;
    if (actualCost !== undefined) record.actualCost = actualCost;
    if (photoUrls) record.photoUrls = photoUrls;
    if (documents) record.documents = documents;
    if (visitDate) record.visitDate = visitDate;
    if (dischargeDate !== undefined) record.dischargeDate = dischargeDate;
    if (nextAppointment !== undefined) record.nextAppointment = nextAppointment;
    
    if (status) {
      record.status = status;

      // Si se completa el registro, notificar a la organización
      if (status === 'completed' && record.animalId) {
        const animal = await Animal.findById(record.animalId);
        if (animal) {
          await Notification.createNotification({
            userId: animal.organizationId,
            type: 'medical_update',
            title: 'Registro médico completado',
            body: `El registro médico de ${animal.name} ha sido completado`,
            relatedId: record._id,
            relatedType: 'MedicalRecord'
          });
        }
      }
    }

    await record.save();
    await record.populate([
      { path: 'animalId', select: 'name species' },
      { path: 'veterinaryId', select: 'name veterinaryDetails.clinicName' }
    ]);

    res.status(200).json(
      successResponse(record, 'Registro médico actualizado exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener casos asignados a la veterinaria actual
 * GET /api/medical-records/my-cases
 */
const getMyCases = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    const filters = { veterinaryId: req.user._id };
    if (status) filters.status = status;

    const [records, total] = await Promise.all([
      MedicalRecord.find(filters)
        .populate('animalId', 'name species breed photoUrls organizationId')
        .populate('reportId', 'urgencyLevel location')
        .sort({ visitDate: -1 })
        .skip(skip)
        .limit(limitNum),
      MedicalRecord.countDocuments(filters)
    ]);

    res.status(200).json(
      paginatedResponse(records, total, pageNum, limitNum)
    );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMedicalRecord,
  getAnimalMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  getMyCases
};
