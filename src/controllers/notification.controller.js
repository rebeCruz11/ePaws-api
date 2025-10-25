const Notification = require('../models/Notification');
const { successResponse, errorResponse, getPaginationOptions, paginatedResponse } = require('../utils/helpers');

/**
 * Obtener notificaciones del usuario actual
 * GET /api/notifications
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead, type } = req.query;
    const { skip, limit: limitNum, page: pageNum } = getPaginationOptions(page, limit);

    const filters = { userId: req.user._id };
    
    if (isRead !== undefined) {
      filters.isRead = isRead === 'true';
    }
    
    if (type) {
      filters.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(filters),
      Notification.countDocuments({ userId: req.user._id, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Marcar notificación como leída
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json(
        errorResponse('Notificación no encontrada')
      );
    }

    // Verificar que la notificación pertenezca al usuario
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('No tienes permisos para acceder a esta notificación')
      );
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json(
      successResponse(notification, 'Notificación marcada como leída')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Marcar todas las notificaciones como leídas
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.markAllAsRead(req.user._id);

    res.status(200).json(
      successResponse(
        { modifiedCount: result.modifiedCount },
        'Todas las notificaciones han sido marcadas como leídas'
      )
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar notificación
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json(
        errorResponse('Notificación no encontrada')
      );
    }

    // Verificar que la notificación pertenezca al usuario
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json(
        errorResponse('No tienes permisos para eliminar esta notificación')
      );
    }

    await notification.deleteOne();

    res.status(200).json(
      successResponse(null, 'Notificación eliminada exitosamente')
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Eliminar todas las notificaciones leídas
 * DELETE /api/notifications/clear-read
 */
const clearReadNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({
      userId: req.user._id,
      isRead: true
    });

    res.status(200).json(
      successResponse(
        { deletedCount: result.deletedCount },
        'Notificaciones leídas eliminadas exitosamente'
      )
    );

  } catch (error) {
    next(error);
  }
};

/**
 * Obtener contador de notificaciones no leídas
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false
    });

    res.status(200).json(
      successResponse({ unreadCount: count })
    );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
  getUnreadCount
};
