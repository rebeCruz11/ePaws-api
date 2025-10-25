const mongoose = require('mongoose');

/**
 * Schema para solicitudes de adopción
 * Conecta adoptantes potenciales con animales y organizaciones
 */
const adoptionSchema = new mongoose.Schema({
  animalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    required: [true, 'El ID del animal es requerido']
  },
  adopterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del adoptante es requerido']
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID de la organización es requerido']
  },
  applicationMessage: {
    type: String,
    required: [true, 'El mensaje de solicitud es requerido'],
    trim: true,
    minlength: 50,
    maxlength: 2000
  },
  adopterInfo: {
    hasExperience: {
      type: Boolean,
      required: true
    },
    experienceDetails: {
      type: String,
      trim: true,
      maxlength: 500
    },
    hasOtherPets: {
      type: Boolean,
      required: true
    },
    otherPetsDetails: {
      type: String,
      trim: true,
      maxlength: 500
    },
    homeType: {
      type: String,
      enum: {
        values: ['house', 'apartment', 'farm', 'other'],
        message: '{VALUE} no es un tipo de hogar válido'
      },
      required: true
    },
    hasYard: {
      type: Boolean,
      required: true
    },
    householdMembers: {
      type: Number,
      required: true,
      min: 1
    },
    householdDetails: {
      type: String,
      trim: true,
      maxlength: 500
    },
    workSchedule: {
      type: String,
      trim: true,
      maxlength: 300
    },
    reasonForAdoption: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'under_review', 'approved', 'rejected', 'completed', 'cancelled'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'pending'
  },
  reviewNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  // Timestamps específicos del proceso
  appliedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar queries
adoptionSchema.index({ animalId: 1 });
adoptionSchema.index({ adopterId: 1 });
adoptionSchema.index({ organizationId: 1 });
adoptionSchema.index({ status: 1 });
adoptionSchema.index({ appliedAt: -1 });
adoptionSchema.index({ createdAt: -1 });

// Índice compuesto para prevenir duplicados
adoptionSchema.index({ animalId: 1, adopterId: 1, status: 1 });

// Virtual para calcular el tiempo de procesamiento
adoptionSchema.virtual('processingTime').get(function() {
  if (this.reviewedAt) {
    return this.reviewedAt - this.appliedAt;
  }
  return null;
});

// Middleware para actualizar timestamps
adoptionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    // Actualizar reviewedAt cuando cambia de pending a under_review
    if ((this.status === 'under_review' || this.status === 'approved' || this.status === 'rejected') && !this.reviewedAt) {
      this.reviewedAt = new Date();
    }
    // Actualizar completedAt cuando se completa la adopción
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    }
  }
  next();
});

// Validar que no haya múltiples solicitudes activas para el mismo animal
adoptionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const activeStatuses = ['pending', 'under_review', 'approved'];
    const existingApplication = await this.constructor.findOne({
      animalId: this.animalId,
      adopterId: this.adopterId,
      status: { $in: activeStatuses }
    });
    
    if (existingApplication) {
      const error = new Error('Ya tienes una solicitud activa para este animal');
      error.statusCode = 400;
      return next(error);
    }
  }
  next();
});

const Adoption = mongoose.model('Adoption', adoptionSchema);

module.exports = Adoption;
