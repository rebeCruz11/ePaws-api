require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

/**
 * Configuración del puerto
 */
const PORT = process.env.PORT || 5000;

/**
 * Función principal para iniciar el servidor
 */
const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('════════════════════════════════════════════════════════');
      console.log('🐾  ePaws API Server');
      console.log('════════════════════════════════════════════════════════');
      console.log(`📡 Servidor ejecutándose en puerto: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`📖 Documentación: http://localhost:${PORT}/api/docs`);
      console.log('════════════════════════════════════════════════════════');
      console.log('');
      console.log('💡 Endpoints disponibles:');
      console.log('   - POST   /api/auth/register');
      console.log('   - POST   /api/auth/login');
      console.log('   - GET    /api/auth/me');
      console.log('   - GET    /api/reports');
      console.log('   - POST   /api/reports');
      console.log('   - GET    /api/animals');
      console.log('   - POST   /api/animals');
      console.log('   - POST   /api/adoptions');
      console.log('   - GET    /api/organizations');
      console.log('   - GET    /api/veterinaries');
      console.log('');
      console.log('✅ Servidor listo para recibir peticiones');
      console.log('════════════════════════════════════════════════════════');
      console.log('');
    });

    // Manejo de errores del servidor
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Error: El puerto ${PORT} ya está en uso`);
      } else {
        console.error('❌ Error del servidor:', error);
      }
      process.exit(1);
    });

    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('');
      console.log('⚠️  Señal SIGTERM recibida. Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('');
      console.log('⚠️  Señal SIGINT recibida. Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection en:', promise);
  console.error('Razón:', reason);
  // En producción, podrías querer cerrar el servidor aquí
  // process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer();
