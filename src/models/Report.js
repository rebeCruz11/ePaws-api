const mongoose = require('mongoose');

/**
 * Schema para reportes de animales abandonados o heridos
 * Conecta ciudadanos con organizaciones y veterinarias
 */
const reportSchema = new mongoose.Schema({
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El reportero es requerido']
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  veterinaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    minlength: 10,
    maxlength: 2000
  },
  urgencyLevel: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: '{VALUE} no es un nivel de urgencia válido'
    },
    required: [true, 'El nivel de urgencia es requerido'],
    default: 'medium'
  },
  animalType: {
    type: String,
    enum: {
      values: ['dog', 'cat', 'bird', 'rabbit', 'other'],
      message: '{VALUE} no es un tipo de animal válido'
    },
    required: [true, 'El tipo de animal es requerido']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'assigned', 'rescued', 'in_veterinary', 'recovered', 'adopted', 'closed'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'pending'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Las coordenadas son requeridas'],
      validate: {
        validator: function(v) {
          return v.length === 2 && v[0] >= -180 && v[0] <= 180 && v[1] >= -90 && v[1] <= 90;
        },
        message: 'Coordenadas inválidas. Formato: [longitude, latitude]'
      }
    }
  },
  locationAddress: {
    type: String,
    trim: true,
    maxlength: 300
  },
  photoUrls: [{
    type: String,
    trim: true
  }],
  // Timestamps específicos del flujo de trabajo
  rescuedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar queries
reportSchema.index({ location: '2dsphere' }); // Para búsquedas geoespaciales
reportSchema.index({ reporterId: 1 });
reportSchema.index({ organizationId: 1 });
reportSchema.index({ veterinaryId: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ urgencyLevel: 1 });
reportSchema.index({ animalType: 1 });
reportSchema.index({ createdAt: -1 });

// Virtual para calcular el tiempo desde el reporte
reportSchema.virtual('elapsedTime').get(function() {
  return Date.now() - this.createdAt;
});

// Middleware para actualizar timestamps específicos
reportSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'rescued' && !this.rescuedAt) {
      this.rescuedAt = new Date();
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
