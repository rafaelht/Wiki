#!/bin/bash

# Script para iniciar Wikipedia Graph Explorer
# Compatible con Linux y macOS
# Ejecuta tanto el backend como el frontend con un solo comando

set -e

# Detectar sistema operativo
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

# Colores para output (compatible con Mac y Linux)
if [[ "$TERM" != "dumb" ]] && [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# Función para logging
log() {
    if [[ "$MACHINE" == "Mac" ]]; then
        echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    else
        echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    fi
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Función para cleanup al salir (compatible con Mac)
cleanup() {
    log "Deteniendo servicios..."
    if [ ! -z "$BACKEND_PID" ]; then
        # En Mac, usar kill con manejo de errores más robusto
        if kill -0 "$BACKEND_PID" 2>/dev/null; then
            kill "$BACKEND_PID" 2>/dev/null || true
            wait "$BACKEND_PID" 2>/dev/null || true
        fi
        log "Backend detenido"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        if kill -0 "$FRONTEND_PID" 2>/dev/null; then
            kill "$FRONTEND_PID" 2>/dev/null || true
            wait "$FRONTEND_PID" 2>/dev/null || true
        fi
        log "Frontend detenido"
    fi
    exit 0
}

# Trap para cleanup
trap cleanup SIGINT SIGTERM

log "🚀 Iniciando Wikipedia Graph Explorer en $MACHINE..."

# Verificar que estamos en el directorio correcto
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    error "Asegúrate de estar en el directorio que contiene las carpetas 'backend' y 'frontend'"
    exit 1
fi

# Detectar comandos de Python (Mac puede tener python3 en diferentes ubicaciones)
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    # Verificar que sea Python 3
    PYTHON_VERSION=$(python --version 2>&1 | grep -o "3\.")
    if [[ "$PYTHON_VERSION" == "3." ]]; then
        PYTHON_CMD="python"
    fi
fi

if [[ -z "$PYTHON_CMD" ]]; then
    error "Python 3 no está instalado o no se encuentra en PATH"
    if [[ "$MACHINE" == "Mac" ]]; then
        error "En Mac, intenta: brew install python3"
        error "O descarga desde: https://www.python.org/downloads/"
    fi
    exit 1
fi

# Verificar Node.js y npm
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado"
    if [[ "$MACHINE" == "Mac" ]]; then
        error "En Mac, intenta: brew install node"
        error "O descarga desde: https://nodejs.org/"
    fi
    exit 1
fi

if ! command -v npm &> /dev/null; then
    error "npm no está instalado"
    exit 1
fi

log "📋 Verificando dependencias..."

# Configurar Backend
info "Configurando backend..."
cd backend

# Verificar/crear entorno virtual
if [ ! -d "venv" ]; then
    log "Creando entorno virtual de Python..."
    $PYTHON_CMD -m venv venv
fi

# Detectar script de activación según el sistema
if [[ "$MACHINE" == "Mac" ]] || [[ "$MACHINE" == "Linux" ]]; then
    VENV_ACTIVATE="venv/bin/activate"
    VENV_PYTHON="venv/bin/python"
    VENV_PIP="venv/bin/pip"
else
    # Para Windows en caso de que alguien use Git Bash
    VENV_ACTIVATE="venv/Scripts/activate"
    VENV_PYTHON="venv/Scripts/python"
    VENV_PIP="venv/Scripts/pip"
fi

# Verificar si las dependencias están instaladas
if [ ! -f "venv/bin/uvicorn" ] && [ ! -f "venv/Scripts/uvicorn.exe" ]; then
    log "Instalando dependencias de Python..."
    $VENV_PIP install -r requirements.txt
fi

cd ..

# Configurar Frontend
info "Configurando frontend..."
cd frontend

# Verificar si node_modules existe
if [ ! -d "node_modules" ]; then
    log "Instalando dependencias de Node.js..."
    npm install
fi

cd ..

log "✅ Dependencias verificadas"

# Verificar y configurar MongoDB
log "🗄️ Verificando base de datos MongoDB..."

# Función para verificar si MongoDB está corriendo
check_mongodb() {
    if [[ "$MACHINE" == "Mac" ]]; then
        # Verificar si MongoDB está corriendo como servicio de Homebrew
        if brew services list | grep mongodb-community | grep -q started; then
            return 0  # MongoDB corriendo
        fi
        # Verificar proceso manual
        if pgrep mongod > /dev/null; then
            return 0  # MongoDB corriendo
        fi
    else
        # En Linux, verificar proceso
        if pgrep mongod > /dev/null; then
            return 0  # MongoDB corriendo
        fi
        # Verificar servicio systemd
        if systemctl is-active --quiet mongod; then
            return 0  # MongoDB corriendo
        fi
    fi
    return 1  # MongoDB no está corriendo
}

# Verificar si MongoDB está instalado y corriendo
if check_mongodb; then
    log "✅ MongoDB está corriendo"
else
    warning "MongoDB no está corriendo. Intentando iniciar..."
    
    if [[ "$MACHINE" == "Mac" ]]; then
        # Intentar iniciar con Homebrew
        if command -v brew &> /dev/null; then
            if brew services start mongodb-community 2>/dev/null; then
                log "✅ MongoDB iniciado con Homebrew"
                sleep 3  # Esperar a que se inicie completamente
            else
                error "No se pudo iniciar MongoDB con Homebrew"
                error "Intenta manualmente: brew services start mongodb-community"
                error "O verifica que MongoDB esté instalado: brew install mongodb-community"
                exit 1
            fi
        else
            error "Homebrew no está disponible para iniciar MongoDB"
            error "Inicia MongoDB manualmente o instala Homebrew"
            exit 1
        fi
    else
        # En Linux, intentar con systemd
        if command -v systemctl &> /dev/null; then
            if sudo systemctl start mongod 2>/dev/null; then
                log "✅ MongoDB iniciado con systemctl"
                sleep 3
            else
                error "No se pudo iniciar MongoDB con systemctl"
                error "Intenta manualmente: sudo systemctl start mongod"
                exit 1
            fi
        else
            error "No se puede iniciar MongoDB automáticamente en este sistema"
            error "Inicia MongoDB manualmente antes de ejecutar este script"
            exit 1
        fi
    fi
fi

# Verificar conectividad a MongoDB
if command -v mongosh &> /dev/null; then
    # Verificar conexión con mongosh (versión moderna)
    if timeout 5 mongosh --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1; then
        log "✅ Conectividad a MongoDB verificada"
    else
        warning "MongoDB está corriendo pero no responde a conexiones"
        info "Esto puede ser normal durante el arranque inicial"
    fi
elif command -v mongo &> /dev/null; then
    # Verificar conexión con mongo (versión legacy)
    if timeout 5 mongo --eval "db.runCommand('ping')" --quiet > /dev/null 2>&1; then
        log "✅ Conectividad a MongoDB verificada"
    else
        warning "MongoDB está corriendo pero no responde a conexiones"
        info "Esto puede ser normal durante el arranque inicial"
    fi
else
    info "Cliente de MongoDB no encontrado, asumiendo que la conexión funcionará"
fi

# Función para verificar si un puerto está en uso (compatible con Mac)
check_port() {
    local port=$1
    if [[ "$MACHINE" == "Mac" ]]; then
        # En Mac, usar lsof de manera más robusta
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 0  # Puerto en uso
        else
            return 1  # Puerto libre
        fi
    else
        # En Linux
        if ss -tuln | grep -q ":$port "; then
            return 0  # Puerto en uso
        else
            return 1  # Puerto libre
        fi
    fi
}

# Verificar puertos
BACKEND_PORT=8001
FRONTEND_PORT=3000

if check_port $BACKEND_PORT; then
    warning "Puerto $BACKEND_PORT ya está en uso. Intentando detener proceso..."
    if [[ "$MACHINE" == "Mac" ]]; then
        pkill -f "uvicorn.*$BACKEND_PORT" || true
    else
        pkill -f "uvicorn.*$BACKEND_PORT" || true
    fi
    sleep 2
fi

if check_port $FRONTEND_PORT; then
    warning "Puerto $FRONTEND_PORT ya está en uso. Intentando detener proceso..."
    if [[ "$MACHINE" == "Mac" ]]; then
        pkill -f "vite.*$FRONTEND_PORT" || true
        pkill -f "node.*$FRONTEND_PORT" || true
    else
        pkill -f "vite.*$FRONTEND_PORT" || true
        pkill -f "node.*$FRONTEND_PORT" || true
    fi
    sleep 2
fi

log "🔧 Iniciando servicios..."

# Iniciar Backend
info "Iniciando backend en puerto $BACKEND_PORT..."
cd backend

# Usar la ruta absoluta del directorio actual para PYTHONPATH
BACKEND_DIR=$(pwd)
PYTHONPATH="$BACKEND_DIR" $VENV_PYTHON -m uvicorn app.main:app --reload --host 127.0.0.1 --port $BACKEND_PORT > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Esperar a que el backend se inicie
sleep 3

# Verificar que el backend se inició correctamente
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    error "Falló al iniciar el backend. Revisa backend.log para más detalles."
    cat backend.log
    exit 1
fi

log "✅ Backend iniciado (PID: $BACKEND_PID)"

# Iniciar Frontend
info "Iniciando frontend en puerto $FRONTEND_PORT..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Esperar a que el frontend se inicie
sleep 5

# Verificar que el frontend se inició correctamente
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    error "Falló al iniciar el frontend. Revisa frontend.log para más detalles."
    cat frontend.log
    cleanup
    exit 1
fi

log "✅ Frontend iniciado (PID: $FRONTEND_PID)"

# Verificar conectividad (con comandos compatibles con Mac)
log "🔍 Verificando servicios..."

# Verificar backend con varios intentos
BACKEND_READY=false
for i in {1..10}; do
    if command -v curl &> /dev/null; then
        if curl -s --max-time 5 "http://127.0.0.1:$BACKEND_PORT/api/search?term=test&limit=1" > /dev/null; then
            log "✅ Backend respondiendo en http://127.0.0.1:$BACKEND_PORT"
            BACKEND_READY=true
            break
        fi
    fi
    sleep 1
done

if [ "$BACKEND_READY" = false ]; then
    warning "Backend no responde correctamente (puede estar iniciando...)"
    info "Puedes verificar manualmente: http://127.0.0.1:$BACKEND_PORT/docs"
fi

# Verificar frontend (puede tomar más tiempo)
sleep 2
if command -v curl &> /dev/null; then
    if curl -s --max-time 3 http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        log "✅ Frontend respondiendo en http://localhost:$FRONTEND_PORT"
    else
        info "Frontend aún iniciando... (esto es normal)"
    fi
fi

log "🎉 Wikipedia Graph Explorer iniciado exitosamente!"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📱 APLICACIÓN LISTA${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Frontend:${NC}  http://localhost:$FRONTEND_PORT"
echo -e "${BLUE}🔧 Backend:${NC}   http://127.0.0.1:$BACKEND_PORT"
echo -e "${BLUE}📚 API Docs:${NC}  http://127.0.0.1:$BACKEND_PORT/docs"
echo -e "${BLUE}🗄️ MongoDB:${NC}   mongodb://localhost:27017"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
info "Presiona Ctrl+C para detener todos los servicios"
echo ""

# Mantener el script corriendo y mostrar logs
log "📊 Monitoreando servicios... (logs en backend.log y frontend.log)"

while true; do
    # Verificar que ambos procesos siguen corriendo
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        error "Backend se detuvo inesperadamente"
        cleanup
        exit 1
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        error "Frontend se detuvo inesperadamente"
        cleanup
        exit 1
    fi
    
    sleep 10
done
