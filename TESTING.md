# 🧪 Script de Prueba Rápida - ePaws API

Este script te permite probar rápidamente los endpoints principales de la API.

## ⚡ Prueba Rápida desde PowerShell

```powershell
# 1. Verificar que el servidor esté corriendo
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET

# 2. Registrar un usuario de prueba
$registerBody = @{
    email = "test@example.com"
    password = "123456"
    name = "Usuario de Prueba"
    role = "user"
    phone = "12345678"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
$registerResponse

# 3. Iniciar sesión
$loginBody = @{
    email = "test@example.com"
    password = "123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.token
Write-Host "Token obtenido: $token" -ForegroundColor Green

# 4. Obtener perfil (con token)
$headers = @{
    "Authorization" = "Bearer $token"
}
$profile = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method GET -Headers $headers
$profile

# 5. Crear un reporte
$reportBody = @{
    description = "Perro callejero necesita ayuda - PRUEBA"
    urgencyLevel = "medium"
    animalType = "dog"
    latitude = 13.7002
    longitude = -89.2243
    locationAddress = "San Salvador - Prueba"
    photoUrls = @("https://example.com/test.jpg")
} | ConvertTo-Json

$reportResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/reports" -Method POST -Body $reportBody -ContentType "application/json" -Headers $headers
Write-Host "Reporte creado con ID: $($reportResponse.data._id)" -ForegroundColor Green

# 6. Listar reportes
$reports = Invoke-RestMethod -Uri "http://localhost:5000/api/reports?page=1&limit=5" -Method GET
Write-Host "Total de reportes: $($reports.pagination.totalItems)" -ForegroundColor Cyan

# 7. Listar animales disponibles
$animals = Invoke-RestMethod -Uri "http://localhost:5000/api/animals?status=available&page=1&limit=5" -Method GET
Write-Host "Animales disponibles: $($animals.pagination.totalItems)" -ForegroundColor Cyan

# 8. Listar organizaciones
$organizations = Invoke-RestMethod -Uri "http://localhost:5000/api/organizations" -Method GET
Write-Host "Total de organizaciones: $($organizations.pagination.totalItems)" -ForegroundColor Cyan

Write-Host "`n✅ Todas las pruebas completadas exitosamente!" -ForegroundColor Green
```

## 🌐 Prueba con cURL (Git Bash / Linux / Mac)

```bash
#!/bin/bash

# Colores
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

API_URL="http://localhost:5000"

echo "🧪 Iniciando pruebas de ePaws API..."
echo ""

# 1. Health check
echo "1️⃣ Verificando servidor..."
curl -s "$API_URL/health" | jq '.'
echo ""

# 2. Registrar usuario
echo "2️⃣ Registrando usuario de prueba..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "name": "Usuario de Prueba",
    "role": "user",
    "phone": "12345678"
  }')
echo "$REGISTER_RESPONSE" | jq '.'
echo ""

# 3. Login
echo "3️⃣ Iniciando sesión..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
echo -e "${GREEN}Token obtenido: $TOKEN${NC}"
echo ""

# 4. Obtener perfil
echo "4️⃣ Obteniendo perfil..."
curl -s "$API_URL/api/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
echo ""

# 5. Crear reporte
echo "5️⃣ Creando reporte..."
REPORT_RESPONSE=$(curl -s -X POST "$API_URL/api/reports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Perro callejero necesita ayuda - PRUEBA",
    "urgencyLevel": "medium",
    "animalType": "dog",
    "latitude": 13.7002,
    "longitude": -89.2243,
    "locationAddress": "San Salvador - Prueba",
    "photoUrls": ["https://example.com/test.jpg"]
  }')
REPORT_ID=$(echo "$REPORT_RESPONSE" | jq -r '.data._id')
echo "$REPORT_RESPONSE" | jq '.'
echo -e "${GREEN}Reporte creado con ID: $REPORT_ID${NC}"
echo ""

# 6. Listar reportes
echo "6️⃣ Listando reportes..."
curl -s "$API_URL/api/reports?page=1&limit=5" | jq '.pagination'
echo ""

# 7. Listar animales
echo "7️⃣ Listando animales disponibles..."
curl -s "$API_URL/api/animals?status=available&page=1&limit=5" | jq '.pagination'
echo ""

# 8. Listar organizaciones
echo "8️⃣ Listando organizaciones..."
curl -s "$API_URL/api/organizations" | jq '.pagination'
echo ""

echo -e "${GREEN}✅ Todas las pruebas completadas exitosamente!${NC}"
```

## 📱 Prueba con Postman

1. **Importar colección**:
   - Abre Postman
   - Crea una nueva colección llamada "ePaws API"
   - Agrega las requests del archivo `API_EXAMPLES.md`

2. **Configurar variable de entorno**:
   - Crea un entorno llamado "ePaws Local"
   - Agrega variable: `base_url` = `http://localhost:5000`
   - Agrega variable: `token` = (se llenará después del login)

3. **Flujo de prueba**:
   1. POST `/api/auth/register` → Registrar usuario
   2. POST `/api/auth/login` → Guardar token en variable de entorno
   3. GET `/api/auth/me` → Verificar autenticación
   4. POST `/api/reports` → Crear reporte
   5. GET `/api/reports` → Listar reportes

## 🔍 Verificar Base de Datos

Puedes verificar que los datos se guardan correctamente en MongoDB Atlas:

1. Ve a https://cloud.mongodb.com
2. Accede a tu cluster
3. Click en "Browse Collections"
4. Verás las colecciones: `users`, `reports`, `animals`, `adoptions`, etc.

## ⚠️ Limpiar Datos de Prueba

Si quieres eliminar el usuario de prueba creado:

```javascript
// En MongoDB Compass o Atlas:
db.users.deleteOne({ email: "test@example.com" })
db.reports.deleteMany({ "reporterId": ObjectId("ID_DEL_USUARIO_TEST") })
```

## 📊 Endpoints para Probar

### ✅ Sin Autenticación
- GET `/health`
- GET `/api/reports`
- GET `/api/animals`
- GET `/api/organizations`
- GET `/api/veterinaries`
- POST `/api/auth/register`
- POST `/api/auth/login`

### 🔐 Con Autenticación (User)
- GET `/api/auth/me`
- PUT `/api/auth/profile`
- POST `/api/reports`
- GET `/api/reports/my-reports`
- POST `/api/adoptions`
- GET `/api/adoptions/my-applications`
- GET `/api/notifications`

### 🏢 Con Autenticación (Organization)
- POST `/api/animals`
- PUT `/api/reports/:id`
- GET `/api/reports/organization/assigned`
- GET `/api/adoptions/organization/:orgId`
- PUT `/api/adoptions/:id/status`

### 🏥 Con Autenticación (Veterinary)
- POST `/api/medical-records`
- PUT `/api/medical-records/:id`
- GET `/api/medical-records/my-cases`

## 🎯 Resultados Esperados

### ✅ Éxito
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

### ❌ Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [...]
}
```

---

**💡 Tip**: Guarda el token del login en una variable de entorno para usarlo en todas las peticiones autenticadas.

**🔄 Nota**: El servidor debe estar corriendo (`npm run dev`) para ejecutar estas pruebas.
