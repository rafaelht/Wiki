# Guía de Comandos - Wikipedia Graph Explorer

## 🚀 Comandos de Inicio Rápido

### Método Más Fácil: Script Automático
```bash
./start.sh
```
**¿Qué hace?**
- Verifica e instala dependencias automáticamente
- Configura entornos virtuales
- Inicia backend (puerto 8001) y frontend (puerto 3000)
- Monitorea servicios en tiempo real

### Usando Make
```bash
make dev        # Instalar + iniciar todo
make start      # Solo iniciar (si ya está instalado)
make stop       # Detener servicios
make status     # Ver estado de servicios
```

### Docker (Producción)
```bash
docker-compose up -d    # Iniciar en background
docker-compose logs -f  # Ver logs
docker-compose down     # Detener todo
```

## 🔧 Comandos por Servicio

### Backend (Puerto 8001)
```bash
# Iniciar solo backend
cd backend
PYTHONPATH=$(pwd) ./venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001

# Con Make
make start-backend

# Verificar health
curl http://127.0.0.1:8001/health
```

### Frontend (Puerto 3000)
```bash
# Iniciar solo frontend
cd frontend
npm run dev

# Con Make
make start-frontend

# Build para producción
npm run build
```

## 📋 URLs de la Aplicación

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:3000 | Interfaz de usuario principal |
| **Backend** | http://127.0.0.1:8001 | API REST |
| **API Docs** | http://127.0.0.1:8001/docs | Documentación interactiva |
| **Health** | http://127.0.0.1:8001/health | Estado del servidor |

## 🛠️ Comandos de Desarrollo

### Gestión de Dependencias
```bash
# Instalar todo
make install

# Reinstalar (limpia todo primero)
make reinstall

# Solo backend
cd backend && pip install -r requirements.txt

# Solo frontend
cd frontend && npm install
```

### Testing
```bash
# Todos los tests
make test

# Solo backend
cd backend && ./venv/bin/python -m pytest tests/ -v

# Con coverage
cd backend && ./venv/bin/python -m pytest tests/ --cov=app --cov-report=html
```

### Limpieza
```bash
# Limpiar archivos temporales
make clean

# Limpiar todo (incluye node_modules y venv)
make clean-all
```

## 🐳 Comandos Docker

### Desarrollo con Docker
```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs específicos
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Reiniciar un servicio
docker-compose restart backend

# Ejecutar comandos en contenedor
docker-compose exec backend python -m pytest
docker-compose exec frontend npm run test
```

### Docker sin Compose
```bash
# Backend
docker build -t wiki-backend ./backend
docker run -p 8001:8000 wiki-backend

# Frontend
docker build -t wiki-frontend ./frontend
docker run -p 3000:3000 wiki-frontend
```

## 🔍 Comandos de Diagnóstico

### Verificar Estado
```bash
# Estado completo
make status

# Verificar puertos manualmente
lsof -i :8001  # Backend
lsof -i :3000  # Frontend
lsof -i :27017 # MongoDB

# Procesos activos
ps aux | grep uvicorn
ps aux | grep node
```

### Logs
```bash
# Ver logs en tiempo real
make logs

# Logs específicos
tail -f backend.log
tail -f frontend.log

# Docker logs
docker-compose logs -f backend
```

### Solución de Problemas
```bash
# Matar procesos en puertos
pkill -f "uvicorn.*8001"
pkill -f "vite.*3000"

# O con Make
make stop

# Limpiar y reiniciar
make clean
make reinstall
make start
```

## 📊 Comandos de Monitoreo

### Rendimiento
```bash
# Uso de CPU y memoria
top -p $(pgrep -f uvicorn)
top -p $(pgrep -f node)

# Espacio en disco
df -h
du -sh backend/
du -sh frontend/
```

### Conectividad
```bash
# Test de endpoints
curl -X GET "http://127.0.0.1:8001/health"
curl -X GET "http://127.0.0.1:8001/api/search?term=Einstein"

# Con httpie (más bonito)
http GET 127.0.0.1:8001/health
http GET 127.0.0.1:8001/api/search term==Einstein
```

## 🔧 Variables de Entorno

### Configuración Principal
```bash
# Copiar configuración de ejemplo
cp .env.example .env

# Variables importantes
BACKEND_PORT=8001
FRONTEND_PORT=3000
MONGODB_URL=mongodb://localhost:27017/wikipedia_explorer
LOG_LEVEL=INFO
DEBUG=false
```

### Configuración por Entorno
```bash
# Desarrollo
export ENVIRONMENT=development
export DEBUG=true
export LOG_LEVEL=DEBUG

# Producción
export ENVIRONMENT=production
export DEBUG=false
export LOG_LEVEL=INFO
```

## 🚀 Scripts Personalizados

### Crear tus propios scripts
```bash
# Script de backup
#!/bin/bash
mongodump --uri="mongodb://localhost:27017/wikipedia_explorer" --out=./backups/$(date +%Y%m%d)

# Script de deploy
#!/bin/bash
git pull origin main
make clean
make install
make build
docker-compose up -d --build
```

## 💡 Tips de Productividad

### Aliases útiles
```bash
# Agregar a tu .bashrc o .zshrc
alias wiki-start="cd /path/to/Wiki && ./start.sh"
alias wiki-stop="cd /path/to/Wiki && make stop"
alias wiki-logs="cd /path/to/Wiki && make logs"
alias wiki-status="cd /path/to/Wiki && make status"
```

### VS Code Tasks
```json
// .vscode/tasks.json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start Wiki App",
            "type": "shell",
            "command": "./start.sh",
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always"
            }
        }
    ]
}
```

Esta guía te permitirá trabajar eficientemente con la aplicación Wikipedia Graph Explorer. ¡Mantén este archivo como referencia rápida!
