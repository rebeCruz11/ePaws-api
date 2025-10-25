const mongoose = require('mongoose');

/**
 * Schema para animales disponibles para adopción
 * Conectado a un reporte y gestionado por una organización
 */
const animalSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    default: null
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'La organización es requerida']
  },
  name: {
    type: String,
    required: [true, 'El nombre del animal es requerido'],
    trim: true,
    maxlength: 50
  },
  species: {
    type: String,
    enum: {
      values: ['dog', 'cat', 'bird', 'rabbit', 'other'],
      message: '{VALUE} no es una especie válida'
    },
    required: [true, 'La especie es requerida']
  },
  breed: {
    type: String,
    trim: true,
    maxlength: 100,
    default: 'Mestizo'
  },
  gender: {
    type: String,
    enum: {
      values: ['male', 'female', 'unknown'],
      message: '{VALUE} no es un género válido'
    },
    default: 'unknown'
  },
  ageEstimate: {
    type: String,
    trim: true,
    maxlength: 50
  },
  size: {
    type: String,
    enum: {
      values: ['small', 'medium', 'large'],
      message: '{VALUE} no es un tamaño válido'
    },
    required: [true, 'El tamaño es requerido']
  },
  color: {
    type: String,
    trim: true,
    maxlength: 100
  },
  story: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  personalityTraits: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  specialNeeds: {
    type: String,
    trim: true,
    maxlength: 500
  },
  photoUrls: {
    type: [{
      type: String,
      trim: true
    }],
    required: [true, 'Se requiere al menos una foto'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'Debe proporcionar al menos una foto del animal'
    }
  },
  videoUrl: {
    type: String,
    trim: true,
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['available', 'pending_adoption', 'adopted', 'deceased'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'available'
  },
  // Información de salud
  healthInfo: {
    isVaccinated: {
      type: Boolean,
      default: false
    },
    isSterilized: {
      type: Boolean,
      default: false
    },
    isDewormed: {
      type: Boolean,
      default: false
    },
    medicalNotes: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  // Timestamps específicos
  adoptedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false // No incluir en queries por defecto
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar queries
animalSchema.index({ organizationId: 1 });
animalSchema.index({ reportId: 1 });
animalSchema.index({ status: 1 });
animalSchema.index({ species: 1 });
animalSchema.index({ size: 1 });
animalSchema.index({ createdAt: -1 });
animalSchema.index({ isDeleted: 1 });

// Virtual para obtener edad estimada en formato legible
animalSchema.virtual('displayAge').get(function() {
  return this.ageEstimate || 'Edad desconocida';
});

// Middleware para actualizar timestamp de adopción
animalSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'adopted' && !this.adoptedAt) {
    this.adoptedAt = new Date();
  }
  next();
});

// Query helper para excluir animales eliminados
animalSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

const Animal = mongoose.model('Animal', animalSchema);

module.exports = Animal;
