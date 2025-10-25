const mongoose = require('mongoose');

/**
 * Schema para registros médicos de animales
 * Gestionado por veterinarias
 */
const medicalRecordSchema = new mongoose.Schema({
  animalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    required: [true, 'El ID del animal es requerido']
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null
  },
  veterinaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID de la veterinaria es requerido']
  },
  visitType: {
    type: String,
    enum: {
      values: ['initial_exam', 'treatment', 'surgery', 'follow_up', 'vaccination', 'discharge'],
      message: '{VALUE} no es un tipo de visita válido'
    },
    required: [true, 'El tipo de visita es requerido']
  },
  diagnosis: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  treatment: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  medications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      trim: true
    },
    frequency: {
      type: String,
      trim: true
    },
    duration: {
      type: String,
      trim: true
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  estimatedCost: {
    type: Number,
    min: 0,
    default: 0
  },
  actualCost: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'scheduled'
  },
  photoUrls: [{
    type: String,
    trim: true
  }],
  documents: [{
    name: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  visitDate: {
    type: Date,
    required: [true, 'La fecha de visita es requerida'],
    default: Date.now
  },
  dischargeDate: {
    type: Date,
    default: null
  },
  nextAppointment: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar queries
medicalRecordSchema.index({ animalId: 1 });
medicalRecordSchema.index({ veterinaryId: 1 });
medicalRecordSchema.index({ reportId: 1 });
medicalRecordSchema.index({ status: 1 });
medicalRecordSchema.index({ visitDate: -1 });
medicalRecordSchema.index({ createdAt: -1 });

// Virtual para calcular el costo total si no está definido
medicalRecordSchema.virtual('totalCost').get(function() {
  return this.actualCost || this.estimatedCost;
});

// Middleware para actualizar fecha de alta
medicalRecordSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && this.visitType === 'discharge' && !this.dischargeDate) {
    this.dischargeDate = new Date();
  }
  next();
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

module.exports = MedicalRecord;
