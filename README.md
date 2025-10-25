# 🐾 ePaws API

API RESTful completa para una aplicación de rescate y adopción de animales que conecta ciudadanos, organizaciones de rescate, veterinarias y adoptantes potenciales.

## 🚀 Características

- ✅ Autenticación JWT con bcrypt
- ✅ Control de acceso basado en roles (User, Organization, Veterinary, Admin)
- ✅ CRUD completo para reportes, animales, adopciones y registros médicos
- ✅ Búsquedas geoespaciales (reportes y veterinarias cercanas)
- ✅ Sistema de notificaciones in-app
- ✅ Validación de datos con express-validator
- ✅ Manejo de errores centralizado
- ✅ Paginación en todas las listas
- ✅ MongoDB Atlas con Mongoose ODM

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MongoDB Atlas (cuenta gratuita)
- npm o yarn

## 🔧 Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
El archivo `.env` ya está configurado con tu conexión a MongoDB Atlas.

4. **Crear carpeta de uploads**
```bash
mkdir uploads
```

## 🏃‍♂️ Ejecutar la Aplicación

**Modo desarrollo (con auto-reload):**
```bash
npm run dev
```

**Modo producción:**
```bash
npm start
```

La API estará disponible en: `http://localhost:5000`

## 📚 Estructura del Proyecto

```
epaws-api/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración MongoDB
│   ├── models/
│   │   ├── User.js              # Usuarios (ciudadanos, orgs, veterinarias)
│   │   ├── Report.js            # Reportes de animales
│   │   ├── Animal.js            # Animales para adopción
│   │   ├── MedicalRecord.js     # Registros médicos
│   │   ├── Adoption.js          # Solicitudes de adopción
│   │   └── Notification.js      # Notificaciones
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── report.controller.js
│   │   ├── animal.controller.js
│   │   ├── medicalRecord.controller.js
│   │   ├── adoption.controller.js
│   │   ├── notification.controller.js
│   │   ├── organization.controller.js
│   │   └── veterinary.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── report.routes.js
│   │   ├── animal.routes.js
│   │   ├── medicalRecord.routes.js
│   │   ├── adoption.routes.js
│   │   ├── notification.routes.js
│   │   ├── organization.routes.js
│   │   └── veterinary.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js       # Verificación JWT
│   │   ├── role.middleware.js       # Control de acceso por roles
│   │   ├── validation.middleware.js # Validación de datos
│   │   └── error.middleware.js      # Manejo de errores
│   ├── utils/
│   │   ├── jwt.js                   # Utilidades JWT
│   │   └── helpers.js               # Funciones auxiliares
│   └── app.js                       # Configuración Express
├── .env                             # Variables de entorno
├── .env.example                     # Plantilla de variables
├── .gitignore
├── package.json
├── server.js                        # Punto de entrada
└── README.md
```

## 🔐 Autenticación

La API usa JWT (JSON Web Tokens) para autenticación. Incluye el token en el header `Authorization`:

```
Authorization: Bearer <tu_token_jwt>
```

## 👥 Roles de Usuario

1. **user**: Ciudadanos que reportan animales y aplican para adoptar
2. **organization**: Organizaciones de rescate que gestionan animales
3. **veterinary**: Clínicas veterinarias que crean registros médicos
4. **admin**: Administradores con acceso completo

## 📡 Endpoints Principales

### 🔑 Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/register` | Registrar usuario | Público |
| POST | `/login` | Iniciar sesión | Público |
| GET | `/me` | Perfil actual | Privado |
| PUT | `/profile` | Actualizar perfil | Privado |
| PUT | `/change-password` | Cambiar contraseña | Privado |

### 📢 Reportes (`/api/reports`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/` | Crear reporte | Privado |
| GET | `/` | Listar reportes (con filtros) | Público |
| GET | `/:id` | Obtener reporte | Público |
| PUT | `/:id` | Actualizar reporte | Org/Admin |
| GET | `/nearby` | Reportes cercanos | Público |
| GET | `/my-reports` | Mis reportes | Privado |

### 🐕 Animales (`/api/animals`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/` | Crear animal | Organization |
| GET | `/` | Listar animales (con filtros) | Público |
| GET | `/:id` | Obtener animal + historial médico | Público |
| PUT | `/:id` | Actualizar animal | Org/Admin |
| DELETE | `/:id` | Eliminar animal (soft) | Org/Admin |

### 💊 Registros Médicos (`/api/medical-records`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/` | Crear registro | Veterinary |
| GET | `/animal/:animalId` | Historial de animal | Privado |
| GET | `/:id` | Obtener registro | Privado |
| PUT | `/:id` | Actualizar registro | Vet/Admin |
| GET | `/my-cases` | Mis casos | Veterinary |

### 🏠 Adopciones (`/api/adoptions`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| POST | `/` | Aplicar para adoptar | User |
| GET | `/animal/:animalId` | Solicitudes de un animal | Org/Admin |
| GET | `/:id` | Obtener solicitud | Privado |
| PUT | `/:id/status` | Actualizar estado | Org/Admin |
| GET | `/my-applications` | Mis solicitudes | User |
| GET | `/organization/:orgId` | Solicitudes de org | Org/Admin |
| PUT | `/:id/cancel` | Cancelar solicitud | User |

### 🔔 Notificaciones (`/api/notifications`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| GET | `/` | Mis notificaciones | Privado |
| GET | `/unread-count` | Contador no leídas | Privado |
| PUT | `/:id/read` | Marcar como leída | Privado |
| PUT | `/read-all` | Marcar todas leídas | Privado |
| DELETE | `/:id` | Eliminar notificación | Privado |
| DELETE | `/clear-read` | Limpiar leídas | Privado |

### 🏢 Organizaciones (`/api/organizations`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| GET | `/` | Listar organizaciones | Público |
| GET | `/:id` | Detalles + stats | Público |
| GET | `/:id/animals` | Animales de org | Público |
| GET | `/:id/stats` | Estadísticas completas | Org/Admin |

### 🏥 Veterinarias (`/api/veterinaries`)

| Método | Endpoint | Descripción | Acceso |
|--------|----------|-------------|--------|
| GET | `/` | Listar veterinarias | Público |
| GET | `/nearby` | Veterinarias cercanas | Público |
| GET | `/search` | Buscar por especialidad | Público |
| GET | `/:id` | Detalles de veterinaria | Público |

## 📝 Ejemplos de Uso

### 1. Registrar Usuario

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "123456",
  "name": "Juan Pérez",
  "role": "user",
  "phone": "12345678"
}
```

### 2. Iniciar Sesión

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "123456"
}
```

### 3. Crear Reporte (requiere token)

```bash
POST http://localhost:5000/api/reports
Authorization: Bearer <tu_token>
Content-Type: application/json

{
  "description": "Perro abandonado en el parque, parece herido",
  "urgencyLevel": "high",
  "animalType": "dog",
  "latitude": 13.7002,
  "longitude": -89.2243,
  "locationAddress": "Parque Cuscatlán, San Salvador",
  "photoUrls": ["https://example.com/photo1.jpg"]
}
```

### 4. Registrar Organización

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "rescate@proteccion.org",
  "password": "123456",
  "name": "María González",
  "role": "organization",
  "organizationName": "Protección Animal SV",
  "description": "Organización dedicada al rescate de animales",
  "phone": "22334455",
  "capacity": 50
}
```

### 5. Crear Animal para Adopción

```bash
POST http://localhost:5000/api/animals
Authorization: Bearer <token_organizacion>
Content-Type: application/json

{
  "name": "Max",
  "species": "dog",
  "breed": "Labrador Mestizo",
  "gender": "male",
  "ageEstimate": "2 años",
  "size": "large",
  "color": "Café claro",
  "story": "Max fue rescatado del parque. Es muy amigable y juguetón.",
  "personalityTraits": ["Amigable", "Juguetón", "Obediente"],
  "photoUrls": ["https://example.com/max1.jpg", "https://example.com/max2.jpg"],
  "healthInfo": {
    "isVaccinated": true,
    "isSterilized": true,
    "isDewormed": true
  }
}
```

### 6. Aplicar para Adopción

```bash
POST http://localhost:5000/api/adoptions
Authorization: Bearer <token_usuario>
Content-Type: application/json

{
  "animalId": "60d5ec49f1b2c72b8c8e4f3a",
  "applicationMessage": "Me encantaría adoptar a Max. Tengo experiencia con perros grandes y un amplio patio para que pueda jugar. Trabajo desde casa así que estaré con él la mayor parte del tiempo.",
  "adopterInfo": {
    "hasExperience": true,
    "experienceDetails": "He tenido perros toda mi vida",
    "hasOtherPets": false,
    "homeType": "house",
    "hasYard": true,
    "householdMembers": 3,
    "householdDetails": "Vivo con mi esposa e hijo de 10 años",
    "workSchedule": "Trabajo desde casa",
    "reasonForAdoption": "Queremos darle un hogar amoroso a un perro rescatado"
  }
}
```

### 7. Buscar Veterinarias Cercanas

```bash
GET http://localhost:5000/api/veterinaries/nearby?latitude=13.7002&longitude=-89.2243&maxDistance=5000
```

## 🔍 Búsquedas Geoespaciales

La API soporta búsquedas por ubicación usando índices geoespaciales de MongoDB:

- **Reportes cercanos**: `/api/reports/nearby?latitude=X&longitude=Y&maxDistance=Z`
- **Veterinarias cercanas**: `/api/veterinaries/nearby?latitude=X&longitude=Y&maxDistance=Z`

`maxDistance` se especifica en metros.

## 📊 Paginación

Todas las listas soportan paginación:

```
GET /api/animals?page=1&limit=10
```

Respuesta incluye metadata:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## 🎯 Filtros

### Reportes
- `status`: pending, assigned, rescued, in_veterinary, recovered, adopted, closed
- `urgencyLevel`: low, medium, high, critical
- `animalType`: dog, cat, bird, rabbit, other
- `organizationId`: ID de la organización

### Animales
- `species`: dog, cat, bird, rabbit, other
- `size`: small, medium, large
- `status`: available, pending_adoption, adopted, deceased
- `organizationId`: ID de la organización

## 🔔 Sistema de Notificaciones

Las notificaciones se crean automáticamente cuando:
- Un reporte cambia de estado
- Se asigna un caso a una organización o veterinaria
- Se actualiza un registro médico
- Cambia el estado de una solicitud de adopción

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt (salt rounds: 10)
- JWT con expiración de 7 días
- Validación de datos en todas las rutas
- Control de acceso basado en roles
- Sanitización de strings para prevenir inyecciones

## ⚠️ Manejo de Errores

La API retorna errores en formato estándar:

```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

Códigos de estado HTTP:
- `200`: Éxito
- `201`: Creado exitosamente
- `400`: Error de validación
- `401`: No autenticado
- `403`: Sin permisos
- `404`: No encontrado
- `500`: Error del servidor

## 🧪 Pruebas

Puedes probar la API con:
- **Postman**: Importa los endpoints
- **Thunder Client** (VS Code)
- **cURL**
- **Insomnia**

## 📦 Dependencias Principales

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.3",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "express-validator": "^7.0.1",
  "cors": "^2.8.5",
  "morgan": "^1.10.0",
  "multer": "^1.4.5-lts.1",
  "dotenv": "^16.3.1"
}
```

## 🚀 Despliegue

### Variables de Entorno para Producción

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=tu_mongodb_uri_produccion
JWT_SECRET=un_secreto_muy_seguro_y_aleatorio
JWT_EXPIRE=7d
```

### Recomendaciones

1. Cambiar `JWT_SECRET` por un valor aleatorio seguro
2. Configurar CORS para dominios específicos
3. Habilitar HTTPS
4. Configurar rate limiting
5. Implementar logs persistentes
6. Configurar respaldo automático de MongoDB

## 📄 Licencia

MIT

## 👨‍💻 Autor

Desarrollado para el proyecto ePaws - Sistema de Rescate y Adopción de Animales

---

**¡Gracias por usar ePaws API! 🐾**

Para soporte o preguntas, contacta al equipo de desarrollo.
