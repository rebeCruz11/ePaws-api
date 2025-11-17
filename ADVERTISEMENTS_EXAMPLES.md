# 🧪 Ejemplos de Prueba - Módulo de Publicidad

## 📝 Paso a Paso para Probar en Postman

### PASO 1: Registrar una Organización

**POST** `http://localhost:5000/api/auth/register`

```json
{
  "email": "refugio@patitas.com",
  "password": "123456",
  "name": "María González",
  "role": "organization",
  "phone": "70123456",
  "organizationName": "Refugio Patitas Felices",
  "description": "Organización dedicada al rescate de animales",
  "website": "https://refugiopatitas.com",
  "capacity": 50
}
```

**Guardar el token de la respuesta:**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### PASO 2: Crear Publicidad Mensual

**POST** `http://localhost:5000/api/advertisements`

**Headers:**
```
Authorization: Bearer {TOKEN_DEL_PASO_1}
Content-Type: application/json
```

**Body - Ejemplo con Tarjeta de Crédito:**
```json
{
  "title": "¡Ayúdanos a Rescatar Más Animales!",
  "description": "Refugio Patitas Felices - Tenemos cachorros y gatos disponibles para adopción responsable. Visítanos y conoce a tu nuevo mejor amigo.",
  "imageUrl": "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800",
  "linkUrl": "https://refugiopatitas.com/adopciones",
  "plan": "monthly",
  "paymentMethod": "credit_card",
  "cardholderName": "María González",
  "last4Digits": "4242",
  "transactionId": "ch_3OKxyz123456789"
}
```

**Respuesta Esperada (201) - Para Organización:**
```json
{
  "success": true,
  "message": "Publicidad creada exitosamente",
  "data": {
    "_id": "673e1234567890abcdef",
    "title": "¡Ayúdanos a Rescatar Más Animales!",
    "plan": "monthly",
    "price": 15,
    "status": "active",
    "isActive": true,
    "expirationDate": "2025-12-17T10:00:00.000Z",
    "daysRemaining": 30
  }
}
```

---

### PASO 3: Ver Publicidades Activas (Sin Autenticación)

**GET** `http://localhost:5000/api/advertisements/active`

**No requiere Headers de autorización**

**Respuesta:**
```json
{
  "success": true,
  "message": "Publicidades activas obtenidas exitosamente",
  "data": [
    {
      "_id": "673e1234567890abcdef",
      "userId": {
        "name": "María González",
        "organizationDetails": {
          "organizationName": "Refugio Patitas Felices"
        }
      },
      "title": "¡Ayúdanos a Rescatar Más Animales!",
      "description": "Refugio Patitas Felices - Tenemos cachorros...",
      "imageUrl": "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800",
      "linkUrl": "https://refugiopatitas.com/adopciones",
      "impressions": 1,
      "clicks": 0
    }
  ]
}
```

---

### PASO 4: Registrar Click en Publicidad

**POST** `http://localhost:5000/api/advertisements/{ID_DE_LA_PUBLICIDAD}/click`

**No requiere autenticación**

**Ejemplo:**
```
POST http://localhost:5000/api/advertisements/673e1234567890abcdef/click
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Click registrado exitosamente",
  "data": {
    "clicks": 1
  }
}
```

---

### PASO 5: Ver Mis Publicidades

**GET** `http://localhost:5000/api/advertisements/my/ads`

**Headers:**
```
Authorization: Bearer {TOKEN}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Tus publicidades obtenidas exitosamente",
  "data": [
    {
      "_id": "673e1234567890abcdef",
      "title": "¡Ayúdanos a Rescatar Más Animales!",
      "plan": "monthly",
      "status": "active",
      "daysRemaining": 30,
      "impressions": 1,
      "clicks": 1,
      "ctr": "100.00"
    }
  ]
}
```

---

### PASO 6: Ver Estadísticas Detalladas

**GET** `http://localhost:5000/api/advertisements/{ID}/stats`

**Headers:**
```
Authorization: Bearer {TOKEN}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "impressions": 1,
    "clicks": 1,
    "ctr": "100.00",
    "daysRemaining": 30,
    "status": "active",
    "plan": "monthly",
    "startDate": "2025-11-17T10:00:00.000Z",
    "expirationDate": "2025-12-17T10:00:00.000Z",
    "renewalsCount": 0
  }
}
```

---

### PASO 7: Actualizar Publicidad

**PUT** `http://localhost:5000/api/advertisements/{ID}`

**Headers:**
```
Authorization: Bearer {TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "🐾 Adopta un Cachorro Hoy - Refugio Patitas",
  "description": "Nueva descripción actualizada con mejores detalles sobre nuestro refugio",
  "imageUrl": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800"
}
```

---

### PASO 8: Renovar Publicidad (Cambiar a Plan Anual)

**POST** `http://localhost:5000/api/advertisements/{ID}/renew`

**Headers:**
```
Authorization: Bearer {TOKEN}
Content-Type: application/json
```

**Body:**
```json
{
  "plan": "annual",
  "transactionId": "ch_RENEW_2025_XYZ"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Publicidad renovada exitosamente",
  "data": {
    "_id": "673e1234567890abcdef",
    "plan": "annual",
    "price": 180,
    "expirationDate": "2026-12-17T10:00:00.000Z",
    "renewals": [
      {
        "renewalDate": "2025-11-17T11:00:00.000Z",
        "plan": "annual",
        "price": 180,
        "transactionId": "ch_RENEW_2025_XYZ"
      }
    ]
  }
}
```

---

### PASO 9: Cancelar Publicidad

**POST** `http://localhost:5000/api/advertisements/{ID}/cancel`

**Headers:**
```
Authorization: Bearer {TOKEN}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Publicidad cancelada exitosamente",
  "data": {
    "status": "cancelled",
    "isActive": false
  }
}
```

---

## 🏥 Ejemplo para Veterinaria

### Registrar Veterinaria

**POST** `http://localhost:5000/api/auth/register`

```json
{
  "email": "drcarlos@vetcentral.com",
  "password": "vet123456",
  "name": "Dr. Carlos Ramírez",
  "role": "veterinary",
  "phone": "78901234",
  "clinicName": "Veterinaria Central",
  "licenseNumber": "VET-2024-001",
  "specialties": ["Cirugía", "Medicina General", "Emergencias"],
  "businessHours": "Lunes a Domingo 24 horas",
  "latitude": 13.6929,
  "longitude": -89.2182,
  "locationAddress": "San Salvador, Centro"
}
```

### Crear Publicidad de Veterinaria con PayPal

**POST** `http://localhost:5000/api/advertisements`

**Headers:**
```
Authorization: Bearer {TOKEN_VETERINARIA}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Veterinaria Central - Atención 24/7",
  "description": "Especialistas en emergencias veterinarias. Cirugía, medicina interna, hospitalización. Atención las 24 horas del día.",
  "imageUrl": "https://images.unsplash.com/photo-1530041539828-114de669390e?w=800",
  "linkUrl": "https://vetcentral.com",
  "plan": "annual",
  "paymentMethod": "paypal",
  "email": "pagos@vetcentral.com",
  "transactionId": "PAYID-M1234567890ABCDEF"
}
```

---

## 💳 Ejemplos de Métodos de Pago

### 1. Tarjeta de Débito

```json
{
  "plan": "monthly",
  "paymentMethod": "debit_card",
  "cardholderName": "Ana Martínez",
  "last4Digits": "5678",
  "transactionId": "db_3PKabc987654321"
}
```

### 2. Transferencia Bancaria

```json
{
  "plan": "annual",
  "paymentMethod": "bank_transfer",
  "accountNumber": "0123456789",
  "transactionId": "TRANSFER-2025-11-17-001"
}
```

---

## 🚨 Casos de Error

### Error 1: Usuario ya tiene publicidad activa

**Request:**
```
POST /api/advertisements
```

**Respuesta (400):**
```json
{
  "success": false,
  "message": "Ya tienes una publicidad activa. Renueva o espera a que expire."
}
```

**Solución:** Esperar a que expire o renovar la actual.

---

### Error 2: Usuario no es organización ni veterinaria

**Request:**
```
POST /api/advertisements
(con token de usuario normal)
```

**Respuesta (403):**
```json
{
  "success": false,
  "message": "Solo organizaciones y veterinarias pueden crear publicidad"
}
```

**Solución:** Usar token de organización o veterinaria.

---

### Error 3: Faltan campos de pago

**Body:**
```json
{
  "title": "Publicidad",
  "imageUrl": "https://example.com/img.jpg",
  "plan": "monthly",
  "paymentMethod": "credit_card"
  // Faltan: cardholderName, last4Digits
}
```

**Respuesta (400):**
```json
{
  "success": false,
  "message": "Errores de validación",
  "errors": [
    {
      "field": "cardholderName",
      "message": "El nombre del titular es requerido"
    },
    {
      "field": "last4Digits",
      "message": "Los últimos 4 dígitos son requeridos"
    }
  ]
}
```

---

## 📊 Datos de Prueba Completos

### Organización 1
```json
{
  "email": "refugio1@test.com",
  "password": "123456",
  "name": "Laura Pérez",
  "role": "organization",
  "organizationName": "Refugio Animal San Salvador"
}
```

### Organización 2
```json
{
  "email": "refugio2@test.com",
  "password": "123456",
  "name": "Roberto Gómez",
  "role": "organization",
  "organizationName": "Fundación Amigos de los Animales"
}
```

### Veterinaria 1
```json
{
  "email": "vet1@test.com",
  "password": "123456",
  "name": "Dra. Ana López",
  "role": "veterinary",
  "clinicName": "Clínica Veterinaria Pets",
  "licenseNumber": "VET-2024-002"
}
```

---

## ✅ Checklist de Pruebas

- [ ] Registrar organización
- [ ] Crear publicidad mensual con tarjeta
- [ ] Ver publicidades activas
- [ ] Registrar clicks
- [ ] Ver mis publicidades
- [ ] Ver estadísticas
- [ ] Actualizar título e imagen
- [ ] Renovar a plan anual
- [ ] Registrar veterinaria
- [ ] Crear publicidad anual con PayPal
- [ ] Filtrar por tipo de usuario
- [ ] Cancelar publicidad
- [ ] Intentar crear segunda publicidad (debe fallar)

---

¡Listo para probar! 🚀
