# ePaws API - Ejemplos de Peticiones HTTP

## 🔗 Base URL
```
http://localhost:5000
```

---

## 1️⃣ AUTENTICACIÓN

### Registrar Usuario Ciudadano
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "juan.perez@example.com",
  "password": "123456",
  "name": "Juan Pérez",
  "role": "user",
  "phone": "12345678",
  "address": "San Salvador, El Salvador"
}
```

### Registrar Organización
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "rescate@proteccion.org",
  "password": "123456",
  "name": "María González",
  "role": "organization",
  "organizationName": "Protección Animal SV",
  "description": "Organización dedicada al rescate y protección de animales abandonados en El Salvador",
  "phone": "22334455",
  "address": "San Salvador, El Salvador",
  "capacity": 50,
  "website": "https://proteccionanimal.org",
  "socialMedia": {
    "facebook": "proteccionanimalsv",
    "instagram": "@proteccionanimalsv"
  }
}
```

### Registrar Veterinaria
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "clinica@vetpets.com",
  "password": "123456",
  "name": "Dr. Carlos Martínez",
  "role": "veterinary",
  "clinicName": "Clínica Veterinaria VetPets",
  "licenseNumber": "VET-2024-001",
  "phone": "22556677",
  "address": "Colonia Escalón, San Salvador",
  "specialties": ["Cirugía", "Medicina General", "Emergencias"],
  "latitude": 13.7002,
  "longitude": -89.2243,
  "locationAddress": "Calle Principal #123, San Salvador",
  "businessHours": "Lunes a Viernes 8:00 AM - 6:00 PM, Sábados 9:00 AM - 2:00 PM"
}
```

### Iniciar Sesión
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "juan.perez@example.com",
  "password": "123456"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "juan.perez@example.com",
      "name": "Juan Pérez",
      "role": "user"
    }
  }
}
```

### Obtener Perfil Actual
```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer <TU_TOKEN>
```

### Actualizar Perfil
```http
PUT http://localhost:5000/api/auth/profile
Authorization: Bearer <TU_TOKEN>
Content-Type: application/json

{
  "name": "Juan Carlos Pérez",
  "phone": "87654321",
  "address": "Nueva dirección"
}
```

### Cambiar Contraseña
```http
PUT http://localhost:5000/api/auth/change-password
Authorization: Bearer <TU_TOKEN>
Content-Type: application/json

{
  "currentPassword": "123456",
  "newPassword": "nuevaPassword123"
}
```

---

## 2️⃣ REPORTES

### Crear Reporte de Animal
```http
POST http://localhost:5000/api/reports
Authorization: Bearer <TOKEN_USUARIO>
Content-Type: application/json

{
  "description": "Perro herido encontrado cerca del Parque Cuscatlán. Tiene una lesión en la pata trasera derecha y parece tener hambre. Es amigable pero necesita atención urgente.",
  "urgencyLevel": "high",
  "animalType": "dog",
  "latitude": 13.6999,
  "longitude": -89.2243,
  "locationAddress": "Parque Cuscatlán, Final Avenida La Revolución, San Salvador",
  "photoUrls": [
    "https://example.com/perro-rescate-1.jpg",
    "https://example.com/perro-rescate-2.jpg"
  ]
}
```

### Listar Todos los Reportes
```http
GET http://localhost:5000/api/reports?page=1&limit=10
```

### Listar Reportes con Filtros
```http
GET http://localhost:5000/api/reports?status=pending&urgencyLevel=high&animalType=dog&page=1&limit=20
```

### Obtener Reportes Cercanos
```http
GET http://localhost:5000/api/reports/nearby?latitude=13.7002&longitude=-89.2243&maxDistance=5000
```

### Obtener Mis Reportes
```http
GET http://localhost:5000/api/reports/my-reports
Authorization: Bearer <TOKEN_USUARIO>
```

### Obtener Reportes de Mi Organización
```http
GET http://localhost:5000/api/reports/organization/assigned?status=assigned
Authorization: Bearer <TOKEN_ORGANIZACION>
```

### Obtener Reporte por ID
```http
GET http://localhost:5000/api/reports/64a1b2c3d4e5f6789012345a
```

### Actualizar Reporte (Organización)
```http
PUT http://localhost:5000/api/reports/64a1b2c3d4e5f6789012345a
Authorization: Bearer <TOKEN_ORGANIZACION>
Content-Type: application/json

{
  "status": "rescued",
  "notes": "Animal rescatado exitosamente. Será trasladado a nuestro refugio para evaluación médica."
}
```

---

## 3️⃣ ANIMALES

### Crear Animal para Adopción
```http
POST http://localhost:5000/api/animals
Authorization: Bearer <TOKEN_ORGANIZACION>
Content-Type: application/json

{
  "name": "Max",
  "species": "dog",
  "breed": "Labrador Mestizo",
  "gender": "male",
  "ageEstimate": "2 años aproximadamente",
  "size": "large",
  "color": "Café claro con manchas blancas",
  "story": "Max fue rescatado de la calle donde vivía como callejero. A pesar de su difícil pasado, es un perro extremadamente cariñoso y leal. Le encanta jugar con pelotas y nadar. Es perfecto para familias activas.",
  "personalityTraits": ["Amigable", "Juguetón", "Obediente", "Sociable", "Energético"],
  "specialNeeds": "Requiere ejercicio diario y espacio amplio para correr",
  "photoUrls": [
    "https://example.com/max-frontal.jpg",
    "https://example.com/max-jugando.jpg",
    "https://example.com/max-perfil.jpg"
  ],
  "videoUrl": "https://example.com/videos/max-playing.mp4",
  "healthInfo": {
    "isVaccinated": true,
    "isSterilized": true,
    "isDewormed": true,
    "medicalNotes": "Completamente sano, todas las vacunas al día"
  },
  "reportId": "64a1b2c3d4e5f6789012345a"
}
```

### Listar Animales Disponibles
```http
GET http://localhost:5000/api/animals?status=available&page=1&limit=12
```

### Buscar Animales por Filtros
```http
GET http://localhost:5000/api/animals?species=dog&size=medium&status=available
```

### Obtener Animal por ID (con historial médico)
```http
GET http://localhost:5000/api/animals/64b2c3d4e5f6789012345abc
```

### Actualizar Animal
```http
PUT http://localhost:5000/api/animals/64b2c3d4e5f6789012345abc
Authorization: Bearer <TOKEN_ORGANIZACION>
Content-Type: application/json

{
  "story": "Actualización: Max ha demostrado ser excelente con niños",
  "personalityTraits": ["Amigable", "Juguetón", "Obediente", "Sociable", "Energético", "Bueno con niños"],
  "healthInfo": {
    "isVaccinated": true,
    "isSterilized": true,
    "isDewormed": true,
    "medicalNotes": "Completamente sano, revisión veterinaria mensual al día"
  }
}
```

### Cambiar Estado de Animal
```http
PUT http://localhost:5000/api/animals/64b2c3d4e5f6789012345abc
Authorization: Bearer <TOKEN_ORGANIZACION>
Content-Type: application/json

{
  "status": "adopted"
}
```

### Eliminar Animal (Soft Delete)
```http
DELETE http://localhost:5000/api/animals/64b2c3d4e5f6789012345abc
Authorization: Bearer <TOKEN_ORGANIZACION>
```

---

## 4️⃣ REGISTROS MÉDICOS

### Crear Registro Médico
```http
POST http://localhost:5000/api/medical-records
Authorization: Bearer <TOKEN_VETERINARIA>
Content-Type: application/json

{
  "animalId": "64b2c3d4e5f6789012345abc",
  "reportId": "64a1b2c3d4e5f6789012345a",
  "visitType": "initial_exam",
  "diagnosis": "Animal en condición general buena. Presenta leve desnutrición y deshidratación. Sin fracturas ni lesiones graves.",
  "treatment": "Rehidratación con suero, alimentación controlada, vitaminas y antibióticos preventivos.",
  "medications": [
    {
      "name": "Amoxicilina",
      "dosage": "250mg",
      "frequency": "Cada 12 horas",
      "duration": "7 días"
    },
    {
      "name": "Complejo Vitamínico",
      "dosage": "5ml",
      "frequency": "Una vez al día",
      "duration": "15 días"
    }
  ],
  "notes": "Se recomienda seguimiento en 7 días para evaluar progreso",
  "estimatedCost": 75.00,
  "photoUrls": [
    "https://example.com/radiografia-max.jpg"
  ],
  "visitDate": "2024-10-24T10:30:00.000Z",
  "nextAppointment": "2024-10-31T10:30:00.000Z"
}
```

### Obtener Historial Médico de un Animal
```http
GET http://localhost:5000/api/medical-records/animal/64b2c3d4e5f6789012345abc
Authorization: Bearer <TOKEN>
```

### Obtener Registro Médico por ID
```http
GET http://localhost:5000/api/medical-records/64c3d4e5f6789012345abcd
Authorization: Bearer <TOKEN>
```

### Actualizar Registro Médico
```http
PUT http://localhost:5000/api/medical-records/64c3d4e5f6789012345abcd
Authorization: Bearer <TOKEN_VETERINARIA>
Content-Type: application/json

{
  "status": "completed",
  "actualCost": 80.00,
  "notes": "Animal respondió excelentemente al tratamiento. Se le dio de alta."
}
```

### Obtener Casos de la Veterinaria
```http
GET http://localhost:5000/api/medical-records/my-cases?status=in_progress
Authorization: Bearer <TOKEN_VETERINARIA>
```

---

## 5️⃣ ADOPCIONES

### Aplicar para Adopción
```http
POST http://localhost:5000/api/adoptions
Authorization: Bearer <TOKEN_USUARIO>
Content-Type: application/json

{
  "animalId": "64b2c3d4e5f6789012345abc",
  "applicationMessage": "Hola, me llamo Juan y estoy muy interesado en adoptar a Max. Tengo amplia experiencia con perros grandes ya que tuve un Labrador durante 10 años. Actualmente vivo en una casa con un gran patio donde Max podrá correr y jugar. Trabajo desde casa por lo que podré dedicarle mucho tiempo y atención. Mi familia está muy emocionada de darle un hogar lleno de amor a Max.",
  "adopterInfo": {
    "hasExperience": true,
    "experienceDetails": "Tuve un Labrador durante 10 años, también he cuidado perros de amigos y familiares",
    "hasOtherPets": false,
    "otherPetsDetails": "",
    "homeType": "house",
    "hasYard": true,
    "householdMembers": 4,
    "householdDetails": "Vivo con mi esposa, dos hijos (8 y 12 años) y mi madre",
    "workSchedule": "Trabajo desde casa de lunes a viernes",
    "reasonForAdoption": "Queremos darle un hogar amoroso a un perro rescatado y enseñarles a nuestros hijos sobre la responsabilidad y el amor por los animales"
  }
}
```

### Obtener Mis Solicitudes de Adopción
```http
GET http://localhost:5000/api/adoptions/my-applications?page=1&limit=10
Authorization: Bearer <TOKEN_USUARIO>
```

### Obtener Solicitudes para un Animal (Organización)
```http
GET http://localhost:5000/api/adoptions/animal/64b2c3d4e5f6789012345abc
Authorization: Bearer <TOKEN_ORGANIZACION>
```

### Obtener Solicitudes de la Organización
```http
GET http://localhost:5000/api/adoptions/organization/64org123456789abc?status=pending
Authorization: Bearer <TOKEN_ORGANIZACION>
```

### Obtener Solicitud por ID
```http
GET http://localhost:5000/api/adoptions/64d4e5f6789012345abcdef
Authorization: Bearer <TOKEN>
```

### Actualizar Estado de Solicitud (Aprobar)
```http
PUT http://localhost:5000/api/adoptions/64d4e5f6789012345abcdef/status
Authorization: Bearer <TOKEN_ORGANIZACION>
Content-Type: application/json

{
  "status": "approved",
  "reviewNotes": "Excelente perfil de adoptante. La familia cumple con todos los requisitos y tiene experiencia con perros. Se programará visita domiciliaria."
}
```

### Actualizar Estado de Solicitud (Rechazar)
```http
PUT http://localhost:5000/api/adoptions/64d4e5f6789012345abcdef/status
Authorization: Bearer <TOKEN_ORGANIZACION>
Content-Type: application/json

{
  "status": "rejected",
  "rejectionReason": "Lamentablemente el tipo de vivienda no es adecuado para un perro de tamaño grande como Max."
}
```

### Completar Adopción
```http
PUT http://localhost:5000/api/adoptions/64d4e5f6789012345abcdef/status
Authorization: Bearer <TOKEN_ORGANIZACION>
Content-Type: application/json

{
  "status": "completed",
  "reviewNotes": "Adopción completada exitosamente. El adoptante firmó todos los documentos y Max fue entregado a su nuevo hogar."
}
```

### Cancelar Solicitud (Usuario)
```http
PUT http://localhost:5000/api/adoptions/64d4e5f6789012345abcdef/cancel
Authorization: Bearer <TOKEN_USUARIO>
```

---

## 6️⃣ NOTIFICACIONES

### Obtener Mis Notificaciones
```http
GET http://localhost:5000/api/notifications?page=1&limit=20
Authorization: Bearer <TOKEN>
```

### Obtener Notificaciones No Leídas
```http
GET http://localhost:5000/api/notifications?isRead=false
Authorization: Bearer <TOKEN>
```

### Obtener Contador de No Leídas
```http
GET http://localhost:5000/api/notifications/unread-count
Authorization: Bearer <TOKEN>
```

### Marcar Notificación como Leída
```http
PUT http://localhost:5000/api/notifications/64e5f6789012345abcdef01/read
Authorization: Bearer <TOKEN>
```

### Marcar Todas como Leídas
```http
PUT http://localhost:5000/api/notifications/read-all
Authorization: Bearer <TOKEN>
```

### Eliminar Notificación
```http
DELETE http://localhost:5000/api/notifications/64e5f6789012345abcdef01
Authorization: Bearer <TOKEN>
```

### Limpiar Notificaciones Leídas
```http
DELETE http://localhost:5000/api/notifications/clear-read
Authorization: Bearer <TOKEN>
```

---

## 7️⃣ ORGANIZACIONES

### Listar Organizaciones
```http
GET http://localhost:5000/api/organizations?page=1&limit=10
```

### Obtener Organización por ID
```http
GET http://localhost:5000/api/organizations/64org123456789abc
```

### Obtener Animales de una Organización
```http
GET http://localhost:5000/api/organizations/64org123456789abc/animals?status=available&page=1&limit=12
```

### Obtener Estadísticas de la Organización
```http
GET http://localhost:5000/api/organizations/64org123456789abc/stats
Authorization: Bearer <TOKEN_ORGANIZACION>
```

---

## 8️⃣ VETERINARIAS

### Listar Veterinarias
```http
GET http://localhost:5000/api/veterinaries?page=1&limit=10
```

### Buscar Veterinarias Cercanas
```http
GET http://localhost:5000/api/veterinaries/nearby?latitude=13.7002&longitude=-89.2243&maxDistance=10000
```

### Buscar por Especialidad
```http
GET http://localhost:5000/api/veterinaries/search?specialty=Cirugía&page=1&limit=10
```

### Obtener Veterinaria por ID
```http
GET http://localhost:5000/api/veterinaries/64vet123456789abc
```

---

## 📝 NOTAS IMPORTANTES

1. **Reemplaza `<TOKEN>`, `<TOKEN_USUARIO>`, `<TOKEN_ORGANIZACION>`, `<TOKEN_VETERINARIA>`** con los tokens JWT reales obtenidos del login.

2. **IDs de ejemplo**: Los IDs como `64a1b2c3d4e5f6789012345a` son ejemplos. Usa los IDs reales devueltos por la API.

3. **Coordenadas de San Salvador**: 
   - Latitud: 13.7002
   - Longitud: -89.2243

4. **Estados válidos**:
   - Reportes: `pending`, `assigned`, `rescued`, `in_veterinary`, `recovered`, `adopted`, `closed`
   - Animales: `available`, `pending_adoption`, `adopted`, `deceased`
   - Adopciones: `pending`, `under_review`, `approved`, `rejected`, `completed`, `cancelled`

5. **Niveles de urgencia**: `low`, `medium`, `high`, `critical`

6. **Tipos de animales**: `dog`, `cat`, `bird`, `rabbit`, `other`

7. **Tamaños**: `small`, `medium`, `large`

---

## 🔧 Herramientas Recomendadas

- **Postman**: Para pruebas interactivas
- **Thunder Client** (VS Code): Extensión ligera
- **REST Client** (VS Code): Usando archivos .http
- **cURL**: Desde la terminal

---

¡Disfruta probando la API de ePaws! 🐾
