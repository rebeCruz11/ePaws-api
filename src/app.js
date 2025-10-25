const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Importar middlewares
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const reportRoutes = require('./routes/report.routes');
const animalRoutes = require('./routes/animal.routes');
const medicalRecordRoutes = require('./routes/medicalRecord.routes');
const adoptionRoutes = require('./routes/adoption.routes');
const notificationRoutes = require('./routes/notification.routes');
const organizationRoutes = require('./routes/organization.routes');
const veterinaryRoutes = require('./routes/veterinary.routes');

/**
 * Inicializar aplicación Express
 */
const app = express();

// ==================== MIDDLEWARES GLOBALES ====================

// CORS - Permitir peticiones desde cualquier origen
app.use(cors({
  origin: '*', // En producción, especificar dominios permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser - Parsear JSON y URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger - Registrar peticiones HTTP
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==================== RUTAS ====================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ePaws API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/adoptions', adoptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/veterinaries', veterinaryRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenido a ePaws API',
    version: '1.0.0',
    description: 'API para la aplicación de rescate y adopción de animales',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      reports: '/api/reports',
      animals: '/api/animals',
      medicalRecords: '/api/medical-records',
      adoptions: '/api/adoptions',
      notifications: '/api/notifications',
      organizations: '/api/organizations',
      veterinaries: '/api/veterinaries'
    }
  });
});

// ==================== MANEJO DE ERRORES ====================

// Ruta no encontrada (404)
app.use(notFoundHandler);

// Manejador global de errores
app.use(errorHandler);

// ==================== EXPORTAR APP ====================

module.exports = app;
