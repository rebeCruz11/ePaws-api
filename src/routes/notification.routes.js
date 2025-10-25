const express = require('express');
const { param } = require('express-validator');
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getUnreadCount
} = require('../controllers/notification.controller');

const { authMiddleware } = require('../middleware/auth.middleware');
const validationMiddleware = require('../middleware/validation.middleware');

/**
 * @route   GET /api/notifications
 * @desc    Obtener notificaciones del usuario actual
 * @access  Private
 */
router.get('/', authMiddleware, getMyNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Obtener contador de notificaciones no leídas
 * @access  Private
 */
router.get('/unread-count', authMiddleware, getUnreadCount);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Marcar todas las notificaciones como leídas
 * @access  Private
 */
router.put('/read-all', authMiddleware, markAllAsRead);

/**
 * @route   DELETE /api/notifications/clear-read
 * @desc    Eliminar todas las notificaciones leídas
 * @access  Private
 */
router.delete('/clear-read', authMiddleware, clearReadNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Marcar notificación como leída
 * @access  Private
 */
router.put(
  '/:id/read',
  [
    authMiddleware,
    param('id')
      .isMongoId()
      .withMessage('ID de notificación inválido'),
    validationMiddleware
  ],
  markAsRead
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Eliminar notificación
 * @access  Private
 */
router.delete(
  '/:id',
  [
    authMiddleware,
    param('id')
      .isMongoId()
      .withMessage('ID de notificación inválido'),
    validationMiddleware
  ],
  deleteNotification
);

module.exports = router;
