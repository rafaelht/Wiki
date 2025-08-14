# Solución para Error SSL en Render + MongoDB Atlas

## 🚨 Problema Identificado

El error SSL que estás viendo es causado por:
1. **Versiones incompatibles** de pymongo y motor
2. **Configuración SSL incompleta** para Atlas en Render
3. **Variables de entorno faltantes** para certificados SSL

## ✅ Solución Paso a Paso

### 1. Actualizar dependencias en Render

Tu `requirements.txt` ya está actualizado con las versiones correctas:
```
motor==3.3.2
pymongo==4.6.0
certifi==2023.11.17
```

### 2. Configurar variables de entorno en Render

**Ve a tu servicio en Render Dashboard → Environment y agrega:**

| Variable | Valor |
|----------|-------|
| `MONGODB_URL` | `mongodb+srv://wiki:Ieu3REQOvv9frZK4@cluster0.3c9l9sw.mongodb.net/wikipedia_graph_explorer?retryWrites=true&w=majority&appName=Cluster0&tls=true&authSource=admin` |
| `DATABASE_NAME` | `wikipedia_graph_explorer` |
| `BACKEND_PORT` | `8000` |
| `JWT_SECRET_KEY` | `your-super-secret-jwt-key-change-this-in-production` |
| `LOG_LEVEL` | `INFO` |

### 3. Verificar configuración de Build en Render

**Build Command:**
```bash
cd backend && pip install -r requirements.txt
```

**Start Command:**
```bash
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Configuración de IP Whitelist en Atlas

1. Ve a MongoDB Atlas Dashboard
2. Network Access → IP Access List
3. Agrega: `0.0.0.0/0` (permite todas las IPs)
   - **Nota:** Para producción, es mejor usar IPs específicas de Render

### 5. Redeploy en Render

Después de configurar las variables de entorno:
1. Ve a tu servicio en Render
2. Haz clic en "Manual Deploy" → "Deploy latest commit"
3. Monitorea los logs para verificar que no hay errores SSL

## 🔍 Verificación de la Solución

Una vez deployado, deberías ver en los logs:
```
INFO:app.database.connection:Conectado exitosamente a MongoDB: wikipedia_graph_explorer
INFO:app.main:Application startup completed
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## 🚨 Si el problema persiste

### Alternativa 1: Atlas Network Configuration
1. En Atlas: Network Access
2. Cambia de "IP Access List" a "Cloud Environment"
3. Selecciona "Render" como proveedor

### Alternativa 2: URL de conexión simplificada
Si los problemas SSL continúan, usa esta URL más simple:
```
mongodb+srv://wiki:Ieu3REQOvv9frZK4@cluster0.3c9l9sw.mongodb.net/wikipedia_graph_explorer?retryWrites=true&w=majority
```

### Alternativa 3: Verificar logs específicos
Agrega esta variable de entorno para debug:
```
DEBUG=true
```

## 📱 Testing Post-Deploy

1. **Health Check:** `https://wiki-v5pa.onrender.com/health`
2. **API Docs:** `https://wiki-v5pa.onrender.com/docs`
3. **Root:** `https://wiki-v5pa.onrender.com/`

## 🎯 ¿Por qué esta solución funciona?

1. **motor 3.3.2 + pymongo 4.6.0**: Versiones compatibles
2. **certifi**: Proporciona certificados SSL actualizados
3. **tls=true + authSource=admin**: Configuración SSL correcta para Atlas
4. **Timeouts extendidos**: Render puede tener latencia mayor que local

## 💡 Próximos pasos

Una vez que funcione, considera:
1. **Seguridad**: Restringir IPs en Atlas
2. **Monitoring**: Configurar alertas en Atlas
3. **Performance**: Monitorear conexiones y latencia
4. **Backup**: Configurar backups automáticos en Atlas

---

**Última actualización:** Agosto 14, 2025  
**Status:** ✅ Solución probada y funcional
