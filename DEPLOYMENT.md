# 🚀 Guía de Despliegue - ePaws API

Esta guía te ayudará a desplegar tu API en diferentes plataformas de hosting.

---

## 📋 Antes de Desplegar

### 1. Preparar el Código
```bash
# Asegúrate de que el código esté actualizado
git add .
git commit -m "Ready for deployment"
```

### 2. Variables de Entorno
Asegúrate de configurar estas variables en tu plataforma de hosting:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=tu_mongodb_uri
JWT_SECRET=un_secreto_muy_seguro_y_aleatorio_aqui
JWT_EXPIRE=7d
```

⚠️ **IMPORTANTE**: Genera un nuevo `JWT_SECRET` seguro para producción:
```javascript
// En Node.js console:
require('crypto').randomBytes(64).toString('hex')
```

---

## 🌐 Opción 1: Render (Recomendado - Gratis)

### Características
- ✅ Hosting gratuito
- ✅ Auto-deploy desde Git
- ✅ SSL incluido
- ✅ Logs en tiempo real

### Pasos

1. **Crear cuenta en Render**
   - Ve a https://render.com
   - Crea una cuenta gratuita

2. **Conectar repositorio**
   - New > Web Service
   - Conecta tu repositorio de GitHub/GitLab

3. **Configurar el servicio**
   ```
   Name: epaws-api
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Variables de entorno**
   - Click en "Environment"
   - Agrega las variables:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `NODE_ENV=production`

5. **Desplegar**
   - Click en "Create Web Service"
   - Espera a que termine el deploy
   - Tu API estará en: `https://epaws-api.onrender.com`

### Configuración Adicional

Crear archivo `render.yaml` en la raíz:
```yaml
services:
  - type: web
    name: epaws-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

---

## 🚂 Opción 2: Railway

### Características
- ✅ $5 gratis al mes
- ✅ Deploy fácil
- ✅ Variables de entorno seguras

### Pasos

1. **Crear cuenta en Railway**
   - Ve a https://railway.app
   - Conecta con GitHub

2. **Nuevo proyecto**
   - New Project > Deploy from GitHub repo
   - Selecciona tu repositorio

3. **Variables de entorno**
   - Variables > Add variable
   - Agrega todas las variables necesarias

4. **Deploy automático**
   - Railway detectará automáticamente Node.js
   - Iniciará el deploy

---

## ☁️ Opción 3: Heroku

### Características
- ✅ Plataforma establecida
- ✅ CLI poderoso
- ✅ Addons disponibles

### Pasos

1. **Instalar Heroku CLI**
```bash
# Windows (con Chocolatey)
choco install heroku-cli

# O descargar desde: https://devcenter.heroku.com/articles/heroku-cli
```

2. **Login y crear app**
```bash
heroku login
heroku create epaws-api
```

3. **Configurar variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="tu_mongodb_uri"
heroku config:set JWT_SECRET="tu_secreto"
heroku config:set JWT_EXPIRE="7d"
```

4. **Desplegar**
```bash
git push heroku main
```

5. **Ver logs**
```bash
heroku logs --tail
```

### Archivo Procfile
Crear `Procfile` en la raíz:
```
web: node server.js
```

---

## 🔥 Opción 4: Vercel

### Características
- ✅ Deploy súper rápido
- ✅ SSL automático
- ✅ Serverless functions

### Pasos

1. **Instalar Vercel CLI**
```bash
npm i -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Configurar**
Crear `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

4. **Desplegar**
```bash
vercel --prod
```

5. **Variables de entorno**
```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET
```

---

## 🐳 Opción 5: Docker + DigitalOcean/AWS

### Dockerfile
Crear `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
```

### Construir y ejecutar
```bash
docker build -t epaws-api .
docker run -p 5000:5000 --env-file .env epaws-api
```

---

## 🔒 Seguridad en Producción

### 1. Actualizar CORS
En `src/app.js`:
```javascript
app.use(cors({
  origin: [
    'https://tu-frontend.com',
    'https://tu-app-movil.com'
  ],
  credentials: true
}));
```

### 2. Rate Limiting
Instalar:
```bash
npm install express-rate-limit
```

Agregar en `src/app.js`:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por IP
});

app.use('/api/', limiter);
```

### 3. Helmet (Security Headers)
```bash
npm install helmet
```

En `src/app.js`:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 4. Compression
```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

---

## 📊 Monitoreo

### Logs
```bash
# Render
Ver en dashboard

# Heroku
heroku logs --tail

# Railway
Ver en dashboard

# PM2 (VPS)
pm2 logs epaws-api
```

### Health Check
Tu API ya tiene un endpoint de health check:
```
GET https://tu-api.com/health
```

---

## 🔄 Actualización Continua

### GitHub Actions
Crear `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: curl ${{ secrets.RENDER_DEPLOY_HOOK }}
```

---

## 🌍 Configurar Dominio Personalizado

### 1. Comprar dominio
- Namecheap
- GoDaddy
- Google Domains

### 2. Configurar DNS
```
Tipo: CNAME
Nombre: api
Valor: tu-app.render.com (o el hosting que uses)
```

### 3. Configurar en la plataforma
- Render: Settings > Custom Domains
- Heroku: Settings > Domains
- Railway: Settings > Domains

---

## ✅ Checklist Pre-Despliegue

- [ ] Variables de entorno configuradas
- [ ] JWT_SECRET generado de forma segura
- [ ] MongoDB Atlas permite conexiones desde cualquier IP (0.0.0.0/0)
- [ ] CORS configurado para tu frontend
- [ ] Rate limiting implementado
- [ ] Helmet instalado
- [ ] Logs configurados
- [ ] Health check funcionando
- [ ] Todas las rutas probadas localmente
- [ ] Documentación actualizada

---

## 🧪 Probar en Producción

Una vez desplegado:

```bash
# Health check
curl https://tu-api.com/health

# Registrar usuario
curl -X POST https://tu-api.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","name":"Test","role":"user","phone":"12345678"}'

# Login
curl -X POST https://tu-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

---

## 📈 Escalabilidad

### Base de Datos
- MongoDB Atlas escala automáticamente
- Considera cluster dedicado para producción

### API
- Load balancer (incluido en muchas plataformas)
- Horizontal scaling (múltiples instancias)
- Caching con Redis

### Archivos
- Para subida de fotos, usar:
  - AWS S3
  - Cloudinary
  - DigitalOcean Spaces

---

## 💰 Costos Aproximados

### Tier Gratuito
- **Render**: Gratis (con limitaciones)
- **Railway**: $5/mes gratis
- **MongoDB Atlas**: Gratis (512MB)

### Tier Básico ($10-20/mes)
- **Render**: $7/mes
- **Heroku**: $7/mes
- **Railway**: ~$5-10/mes
- **MongoDB Atlas**: $9/mes (2GB)

### Producción ($50-100/mes)
- **Hosting**: $25-50/mes
- **Database**: $25-50/mes
- **CDN/Storage**: $5-10/mes

---

## 🆘 Troubleshooting

### Error: Cannot connect to MongoDB
- Verifica IP whitelist en Atlas
- Comprueba la MONGODB_URI

### Error: Port already in use
- Asegúrate de usar process.env.PORT
- La plataforma asigna el puerto automáticamente

### Error: Module not found
- Ejecuta `npm install` en producción
- Verifica package.json

---

## 📚 Recursos Adicionales

- [Render Docs](https://render.com/docs)
- [Heroku Node.js](https://devcenter.heroku.com/articles/deploying-nodejs)
- [Railway Docs](https://docs.railway.app/)
- [MongoDB Atlas](https://docs.atlas.mongodb.com/)

---

## 🎯 Siguiente Nivel

Una vez desplegado:
1. Implementar tests automatizados
2. CI/CD pipeline
3. Documentación con Swagger
4. Versionado de API (/api/v1)
5. WebSockets para notificaciones en tiempo real
6. Sistema de caché

---

**¡Tu API está lista para el mundo! 🚀🌍**
