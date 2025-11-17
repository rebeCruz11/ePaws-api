# 📢 Módulo de Publicidad - ePaws API

## 📋 Descripción

Sistema de publicidad para organizaciones y veterinarias registradas en la plataforma ePaws. Permite crear campañas publicitarias con dos planes de pago.

---

## 💰 Planes de Publicidad

### Organizaciones
| Plan | Duración | Precio | Descripción |
|------|----------|--------|-------------|
| **Mensual** | 30 días | $15.00 | Ideal para campañas cortas o promociones |
| **Anual** | 365 días | $110.00 | Ahorra $70/año comparado con 12 meses |

### Veterinarias
| Plan | Duración | Precio | Descripción |
|------|----------|--------|-------------|
| **Mensual** | 30 días | $20.00 | Ideal para campañas cortas o promociones |
| **Anual** | 365 días | $180.00 | Ahorra $60/año comparado con 12 meses |

---

## 🔑 Endpoints

### 1. Crear Publicidad
**POST** `/api/advertisements`

**Autenticación:** Requerida (Organization/Veterinary)

**Body (JSON):**
```json
{
  "title": "Adopta un Cachorro Hoy",
  "description": "En Refugio Patitas tenemos cachorros disponibles para adopción responsable",
  "imageUrl": "https://example.com/imagen-publicidad.jpg",
  "linkUrl": "https://refugiopatitas.com/adopciones",
  "plan": "monthly",
  "paymentMethod": "credit_card",
  "cardholderName": "María González",
  "last4Digits": "4242",
  "transactionId": "TXN-2025-001"
}
```

**Campos:**
- ✅ `title` (requerido): Título de la publicidad (máx. 100 caracteres)
- ⚙️ `description` (opcional): Descripción (máx. 500 caracteres)
- ✅ `imageUrl` (requerido): URL de la imagen publicitaria
- ⚙️ `linkUrl` (opcional): URL de destino al hacer click
- ✅ `plan` (requerido): `"monthly"` o `"annual"`
- ✅ `paymentMethod` (requerido): `"credit_card"`, `"debit_card"`, `"paypal"`, `"bank_transfer"`

**Campos según método de pago:**

**Tarjeta de Crédito/Débito:**
- `cardholderName`: Nombre del titular
- `last4Digits`: Últimos 4 dígitos de la tarjeta
- `transactionId`: ID de transacción

**PayPal:**
- `email`: Email de PayPal
- `transactionId`: ID de transacción

**Transferencia Bancaria:**
- `accountNumber`: Número de cuenta
- `transactionId`: ID de transacción

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Publicidad creada exitosamente",
  "data": {
    "_id": "673e1234567890abcdef",
    "userId": {
      "_id": "673e0001112233445566",
      "name": "María González",
      "organizationDetails": {
        "organizationName": "Refugio Patitas Felices"
      }
    },
    "userType": "organization",
    "title": "Adopta un Cachorro Hoy",
    "description": "En Refugio Patitas tenemos cachorros disponibles...",
    "imageUrl": "https://example.com/imagen-publicidad.jpg",
    "linkUrl": "https://refugiopatitas.com/adopciones",
    "plan": "monthly",
    "price": 15,
    "startDate": "2025-11-17T10:00:00.000Z",
    "expirationDate": "2025-12-17T10:00:00.000Z",
    "status": "active",
    "isActive": true,
    "paymentInfo": {
      "paymentMethod": "credit_card",
      "cardholderName": "María González",
      "last4Digits": "4242",
      "transactionId": "TXN-2025-001",
      "paymentDate": "2025-11-17T10:00:00.000Z",
      "paidAmount": 15
    },
    "impressions": 0,
    "clicks": 0,
    "daysRemaining": 30,
    "createdAt": "2025-11-17T10:00:00.000Z"
  }
}
```

---

### 2. Obtener Publicidades Activas (Para Mostrar en la App)
**GET** `/api/advertisements/active`

**Autenticación:** No requerida (Público)

**Query Params:**
- `userType` (opcional): `"organization"` o `"veterinary"`

**Ejemplo:**
```
GET /api/advertisements/active?userType=organization
```

**Respuesta (200):**
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
          "organizationName": "Refugio Patitas Felices",
          "logoUrl": "https://example.com/logo.png"
        }
      },
      "title": "Adopta un Cachorro Hoy",
      "description": "En Refugio Patitas...",
      "imageUrl": "https://example.com/imagen-publicidad.jpg",
      "linkUrl": "https://refugiopatitas.com/adopciones",
      "plan": "monthly",
      "status": "active",
      "daysRemaining": 25,
      "impressions": 1250,
      "clicks": 48
    }
  ]
}
```

**Nota:** Este endpoint incrementa automáticamente el contador de impresiones.

---

### 3. Obtener Mis Publicidades
**GET** `/api/advertisements/my/ads`

**Autenticación:** Requerida (Organization/Veterinary)

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Tus publicidades obtenidas exitosamente",
  "data": [
    {
      "_id": "673e1234567890abcdef",
      "title": "Adopta un Cachorro Hoy",
      "plan": "monthly",
      "status": "active",
      "daysRemaining": 25,
      "expirationDate": "2025-12-17T10:00:00.000Z",
      "impressions": 1250,
      "clicks": 48,
      "ctr": "3.84"
    }
  ]
}
```

---

### 4. Obtener Publicidad por ID
**GET** `/api/advertisements/:id`

**Autenticación:** Requerida

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Publicidad obtenida exitosamente",
  "data": {
    "_id": "673e1234567890abcdef",
    "title": "Adopta un Cachorro Hoy",
    "description": "...",
    "imageUrl": "...",
    "plan": "monthly",
    "status": "active",
    "renewals": []
  }
}
```

---

### 5. Actualizar Publicidad
**PUT** `/api/advertisements/:id`

**Autenticación:** Requerida (Owner/Admin)

**Body (JSON):**
```json
{
  "title": "Nuevo Título",
  "description": "Nueva descripción",
  "imageUrl": "https://example.com/nueva-imagen.jpg",
  "linkUrl": "https://nuevo-link.com"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Publicidad actualizada exitosamente",
  "data": { ... }
}
```

---

### 6. Renovar Publicidad
**POST** `/api/advertisements/:id/renew`

**Autenticación:** Requerida (Owner)

**Body (JSON):**
```json
{
  "plan": "annual",
  "transactionId": "TXN-2025-RENEW-001"
}
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Publicidad renovada exitosamente",
  "data": {
    "_id": "673e1234567890abcdef",
    "plan": "annual",
    "price": 180,
    "expirationDate": "2026-12-17T10:00:00.000Z",
    "status": "active",
    "renewals": [
      {
        "renewalDate": "2025-12-15T10:00:00.000Z",
        "plan": "annual",
        "price": 180,
        "newExpirationDate": "2026-12-17T10:00:00.000Z",
        "transactionId": "TXN-2025-RENEW-001"
      }
    ]
  }
}
```

---

### 7. Registrar Click en Publicidad
**POST** `/api/advertisements/:id/click`

**Autenticación:** No requerida (Público)

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Click registrado exitosamente",
  "data": {
    "clicks": 49
  }
}
```

---

### 8. Obtener Estadísticas
**GET** `/api/advertisements/:id/stats`

**Autenticación:** Requerida (Owner/Admin)

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Estadísticas obtenidas exitosamente",
  "data": {
    "impressions": 1250,
    "clicks": 49,
    "ctr": "3.92",
    "daysRemaining": 25,
    "status": "active",
    "plan": "monthly",
    "startDate": "2025-11-17T10:00:00.000Z",
    "expirationDate": "2025-12-17T10:00:00.000Z",
    "renewalsCount": 0
  }
}
```

**CTR (Click Through Rate):** Porcentaje de clicks sobre impresiones

---

### 9. Cancelar Publicidad
**POST** `/api/advertisements/:id/cancel`

**Autenticación:** Requerida (Owner/Admin)

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Publicidad cancelada exitosamente",
  "data": {
    "_id": "673e1234567890abcdef",
    "status": "cancelled",
    "isActive": false
  }
}
```

---

### 10. Eliminar Publicidad
**DELETE** `/api/advertisements/:id`

**Autenticación:** Requerida (Owner/Admin)

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Publicidad eliminada exitosamente",
  "data": null
}
```

---

## 📊 Estados de Publicidad

| Estado | Descripción |
|--------|-------------|
| `pending` | Pendiente de activación (pago en proceso) |
| `active` | Publicidad activa y visible |
| `expired` | Expirada (venció el periodo) |
| `cancelled` | Cancelada por el usuario |

---

## 🎯 Ejemplos de Uso en Postman

### Ejemplo 1: Organización crea publicidad mensual con tarjeta

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:**
```json
{
  "title": "¡Ayúdanos a Rescatar Más Animales!",
  "description": "Refugio Patitas Felices - Donaciones y adopciones disponibles",
  "imageUrl": "https://images.unsplash.com/photo-1450778869180-41d0601e046e",
  "linkUrl": "https://refugiopatitas.com",
  "plan": "monthly",
  "paymentMethod": "credit_card",
  "cardholderName": "María González",
  "last4Digits": "4242",
  "transactionId": "ch_3OKxyz123456789"
}
```

---

### Ejemplo 2: Veterinaria crea publicidad anual con PayPal

**Body:**
```json
{
  "title": "Veterinaria Central - Consultas 24/7",
  "description": "Atención veterinaria de emergencia las 24 horas. Especialistas en cirugía y medicina interna.",
  "imageUrl": "https://images.unsplash.com/photo-1530041539828-114de669390e",
  "linkUrl": "https://vetcentral.com",
  "plan": "annual",
  "paymentMethod": "paypal",
  "email": "pagos@vetcentral.com",
  "transactionId": "PAYID-M1234567890ABCDEF"
}
```

---

### Ejemplo 3: Consultar publicidades activas para mostrar en app

**Request:**
```
GET /api/advertisements/active
```

**No requiere autenticación**

---

### Ejemplo 4: Ver estadísticas de mi publicidad

**Request:**
```
GET /api/advertisements/673e1234567890abcdef/stats
Authorization: Bearer {token}
```

---

## 🔄 Flujo de Trabajo

1. **Usuario se registra** como organización o veterinaria
2. **Crea publicidad** eligiendo plan (monthly/annual)
3. **Completa pago** con método preferido
4. **Publicidad se activa** automáticamente si hay `transactionId`
5. **Aparece en app** para todos los usuarios
6. **Sistema cuenta** impresiones y clicks
7. **Usuario puede ver estadísticas** en tiempo real
8. **Antes de expirar**, puede renovar con descuento anual
9. **Si expira**, status cambia a `expired` automáticamente

---

## 💡 Características Especiales

### ✅ Cálculo Automático de Fechas
- La fecha de expiración se calcula automáticamente al crear
- Mensual: +30 días
- Anual: +365 días

### ✅ Precios Automáticos
- No necesitas enviar `price`, se calcula según el plan y tipo de usuario
- **Organizaciones:**
  - Monthly: $15
  - Annual: $110
- **Veterinarias:**
  - Monthly: $20
  - Annual: $180

### ✅ Renovaciones
- Historial completo de renovaciones
- Puede renovar antes de expirar
- El tiempo restante se suma al nuevo periodo

### ✅ Estadísticas en Tiempo Real
- Impresiones: Cuántas veces se mostró
- Clicks: Cuántas veces se hizo click
- CTR: Tasa de conversión (%)
- Días restantes hasta expiración

### ✅ Múltiples Métodos de Pago
- Tarjeta de crédito/débito
- PayPal
- Transferencia bancaria

---

## 🚨 Validaciones y Reglas

1. ✅ Solo organizaciones y veterinarias pueden crear publicidad
2. ✅ Solo puede tener UNA publicidad activa a la vez
3. ✅ Título máximo 100 caracteres
4. ✅ Descripción máximo 500 caracteres
5. ✅ Imagen debe ser URL válida
6. ✅ Plan debe ser "monthly" o "annual"
7. ✅ Campos de pago requeridos según método elegido
8. ✅ Solo el dueño o admin puede editar/cancelar

---

## 📱 Integración con App Móvil

### Mostrar Publicidades en la App

```swift
// Swift ejemplo
func fetchActiveAds() async {
    guard let url = URL(string: "\(baseURL)/advertisements/active") else { return }
    
    let (data, _) = try await URLSession.shared.data(from: url)
    let response = try JSONDecoder().decode(AdsResponse.self, from: data)
    
    // response.data contiene array de publicidades activas
    // Mostrar en carousel o banner
}
```

### Registrar Click

```swift
func registerAdClick(adId: String) async {
    let url = URL(string: "\(baseURL)/advertisements/\(adId)/click")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    
    let (_, _) = try await URLSession.shared.data(for: request)
    
    // Abrir linkUrl en navegador
}
```

---

¡Sistema de publicidad listo para usar! 🎉
