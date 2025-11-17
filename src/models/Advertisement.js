const mongoose = require('mongoose');

/**
 * Schema para publicidad de organizaciones y veterinarias
 * Planes: Mensual ($20) o Anual ($180)
 */
const advertisementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
  },
  userType: {
    type: String,
    enum: {
      values: ['organization', 'veterinary'],
      message: '{VALUE} no es un tipo válido'
    },
    required: [true, 'El tipo de usuario es requerido']
  },
  title: {
    type: String,
    required: [true, 'El título de la publicidad es requerido'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  imageUrl: {
    type: String,
    required: [true, 'La imagen de la publicidad es requerida'],
    trim: true
  },
  linkUrl: {
    type: String,
    trim: true,
    default: null
  },
  plan: {
    type: String,
    enum: {
      values: ['monthly', 'annual'],
      message: '{VALUE} no es un plan válido'
    },
    required: [true, 'El plan es requerido']
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  startDate: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida'],
    default: Date.now
  },
  expirationDate: {
    type: Date,
    required: [true, 'La fecha de expiración es requerida']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'active', 'expired', 'cancelled'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  // Información de pago
  paymentInfo: {
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
      required: [true, 'El método de pago es requerido']
    },
    cardholderName: {
      type: String,
      trim: true,
      required: function() {
        return this.paymentInfo.paymentMethod === 'credit_card' || 
               this.paymentInfo.paymentMethod === 'debit_card';
      }
    },
    last4Digits: {
      type: String,
      trim: true,
      minlength: 4,
      maxlength: 4,
      required: function() {
        return this.paymentInfo.paymentMethod === 'credit_card' || 
               this.paymentInfo.paymentMethod === 'debit_card';
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: function() {
        return this.paymentInfo.paymentMethod === 'paypal';
      }
    },
    accountNumber: {
      type: String,
      trim: true,
      required: function() {
        return this.paymentInfo.paymentMethod === 'bank_transfer';
      }
    },
    transactionId: {
      type: String,
      trim: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paidAmount: {
      type: Number,
      required: [true, 'El monto pagado es requerido']
    }
  },
  // Estadísticas
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  // Historial de renovaciones
  renewals: [{
    renewalDate: Date,
    plan: String,
    price: Number,
    newExpirationDate: Date,
    transactionId: String
  }],
  isDeleted: {
    type: Boolean,
    default: false,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar queries
advertisementSchema.index({ userId: 1 });
advertisementSchema.index({ userType: 1 });
advertisementSchema.index({ status: 1 });
advertisementSchema.index({ isActive: 1 });
advertisementSchema.index({ expirationDate: 1 });
advertisementSchema.index({ createdAt: -1 });

// Virtual para calcular días restantes
advertisementSchema.virtual('daysRemaining').get(function() {
  if (!this.expirationDate) return 0;
  const now = new Date();
  const diff = this.expirationDate - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Virtual para calcular CTR (Click Through Rate)
advertisementSchema.virtual('ctr').get(function() {
  if (this.impressions === 0) return 0;
  return ((this.clicks / this.impressions) * 100).toFixed(2);
});

// Middleware pre-save para calcular fecha de expiración
advertisementSchema.pre('save', function(next) {
  if (this.isNew && !this.expirationDate) {
    const startDate = this.startDate || new Date();
    const expirationDate = new Date(startDate);
    
    if (this.plan === 'monthly') {
      expirationDate.setMonth(expirationDate.getMonth() + 1);
    } else if (this.plan === 'annual') {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    }
    
    this.expirationDate = expirationDate;
  }
  next();
});

// Middleware pre-save para establecer precio según plan y tipo de usuario
advertisementSchema.pre('save', function(next) {
  if (this.isNew && !this.price) {
    if (this.userType === 'organization') {
      this.price = this.plan === 'monthly' ? 15 : 110;
    } else if (this.userType === 'veterinary') {
      this.price = this.plan === 'monthly' ? 20 : 180;
    }
  }
  next();
});

// Middleware pre-save para activar publicidad si el pago está completo
advertisementSchema.pre('save', function(next) {
  if (this.isNew && this.paymentInfo && this.paymentInfo.transactionId) {
    this.status = 'active';
    this.isActive = true;
  }
  next();
});

// Método para verificar si está expirada
advertisementSchema.methods.checkExpiration = function() {
  const now = new Date();
  if (now > this.expirationDate && this.status === 'active') {
    this.status = 'expired';
    this.isActive = false;
    return true;
  }
  return false;
};

// Método para renovar publicidad
advertisementSchema.methods.renew = async function(plan, transactionId) {
  const renewalDate = new Date();
  const newExpirationDate = new Date(this.expirationDate || renewalDate);
  
  if (plan === 'monthly') {
    newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);
    this.price = this.userType === 'organization' ? 15 : 20;
  } else if (plan === 'annual') {
    newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);
    this.price = this.userType === 'organization' ? 110 : 180;
  }
  
  this.renewals.push({
    renewalDate,
    plan,
    price: this.price,
    newExpirationDate,
    transactionId
  });
  
  this.expirationDate = newExpirationDate;
  this.plan = plan;
  this.status = 'active';
  this.isActive = true;
  
  if (transactionId) {
    this.paymentInfo.transactionId = transactionId;
    this.paymentInfo.paymentDate = renewalDate;
    this.paymentInfo.paidAmount = this.price;
  }
  
  await this.save();
  return this;
};

// Método estático para obtener publicidades activas
advertisementSchema.statics.getActiveAds = function(userType = null) {
  const filter = {
    isActive: true,
    status: 'active',
    expirationDate: { $gt: new Date() }
  };
  
  if (userType) {
    filter.userType = userType;
  }
  
  return this.find(filter)
    .populate('userId', 'name email organizationDetails.organizationName veterinaryDetails.clinicName')
    .sort({ createdAt: -1 });
};

// Query helper para excluir publicidades eliminadas
advertisementSchema.query.notDeleted = function() {
  return this.where({ isDeleted: false });
};

const Advertisement = mongoose.model('Advertisement', advertisementSchema);

module.exports = Advertisement;
