const mongoose = require('mongoose');

/**
 * Schema para notificaciones in-app
 * Sistema de notificaciones para mantener a los usuarios informados
 */
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El ID del usuario es requerido'],
    index: true
  },
  type: {
    type: String,
    enum: {
      values: [
        'report_update',
        'new_case',
        'medical_update',
        'adoption_update',
        'message',
        'system'
      ],
      message: '{VALUE} no es un tipo de notificación válido'
    },
    required: [true, 'El tipo de notificación es requerido']
  },
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: 100
  },
  body: {
    type: String,
    required: [true, 'El cuerpo es requerido'],
    trim: true,
    maxlength: 500
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  relatedType: {
    type: String,
    enum: ['Report', 'Animal', 'Adoption', 'MedicalRecord', null],
    default: null
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices compuestos para optimizar queries comunes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

// Método estático para crear notificación
notificationSchema.statics.createNotification = async function(data) {
  try {
    const notification = await this.create(data);
    return notification;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return null;
  }
};

// Método estático para marcar todas como leídas
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true } }
  );
};

// Método estático para eliminar notificaciones antiguas (más de 30 días)
notificationSchema.statics.cleanOldNotifications = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return await this.deleteMany({
    createdAt: { $lt: thirtyDaysAgo },
    isRead: true
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
