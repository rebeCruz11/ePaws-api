const mongoose = require('mongoose');

/**
 * Schema para usuarios del sistema (ciudadanos, organizaciones y veterinarias)
 * Implementa role-based access control con detalles específicos según el rol
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido']
  },
  passwordHash: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: 6,
    select: false // No incluir en queries por defecto
  },
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'organization', 'veterinary', 'admin'],
      message: '{VALUE} no es un rol válido'
    },
    default: 'user'
  },
  verified: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{8,15}$/, 'Por favor ingrese un número de teléfono válido']
  },
  address: {
    type: String,
    trim: true,
    maxlength: 200
  },
  profilePhotoUrl: {
    type: String,
    default: null
  },
  // Detalles específicos para organizaciones
  organizationDetails: {
    organizationName: {
      type: String,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    website: {
      type: String,
      trim: true
    },
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    },
    logoUrl: {
      type: String,
      default: null
    },
    capacity: {
      type: Number,
      min: 0,
      default: 0
    },
    currentAnimals: {
      type: Number,
      min: 0,
      default: 0
    },
    totalRescues: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  // Detalles específicos para veterinarias
  veterinaryDetails: {
    clinicName: {
      type: String,
      trim: true,
      maxlength: 150
    },
    licenseNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true // Permite múltiples valores null
    },
    specialties: [{
      type: String,
      trim: true
    }],
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number] // [longitude, latitude]
    },
    locationAddress: {
      type: String,
      trim: true
    },
    businessHours: {
      type: String,
      trim: true
    },
    totalCasesHandled: {
      type: Number,
      min: 0,
      default: 0
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar queries
userSchema.index({ role: 1 });
userSchema.index({ 'veterinaryDetails.location': '2dsphere' }, { sparse: true }); // Solo para veterinarias con location

// Virtual para ocultar campos sensibles en respuestas
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

// Método para verificar si el usuario tiene un rol específico
userSchema.methods.hasRole = function(role) {
  return this.role === role;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
