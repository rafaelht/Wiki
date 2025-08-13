# Makefile para Wikipedia Graph Explorer
# Compatible con macOS y Linux
# Facilita el desarrollo y deployment de la aplicación

.PHONY: help install start start-dev stop clean test build docker-build docker-up docker-down logs

# Variables
BACKEND_DIR = backend
FRONTEND_DIR = frontend
BACKEND_PORT = 8001
FRONTEND_PORT = 3000
DOCKER_COMPOSE = docker-compose

# Detectar sistema operativo
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
    OS = Mac
    PYTHON_CMD = python3
else
    OS = Linux
    PYTHON_CMD = python3
endif

# Colores para output (compatible con Mac)
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
BLUE = \033[0;34m
NC = \033[0m # No Color

# Ayuda por defecto
help: ## Mostrar ayuda disponible
	@echo "$(GREEN)Wikipedia Graph Explorer - Comandos disponibles ($(OS)):$(NC)"
	@echo ""
	@echo "$(YELLOW)Desarrollo:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(YELLOW)Ejemplos:$(NC)"
	@echo "  make install    # Instalar todas las dependencias"
	@echo "  make start      # Iniciar aplicación completa"
	@echo "  make docker-up  # Usar Docker Compose"
	@echo ""

# Instalación de dependencias
install: ## Instalar dependencias del backend y frontend
	@echo "$(GREEN)📦 Instalando dependencias en $(OS)...$(NC)"
	@echo "Configurando backend..."
	cd $(BACKEND_DIR) && $(PYTHON_CMD) -m venv venv && venv/bin/pip install -r requirements.txt
	@echo "Configurando frontend..."
	cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✅ Dependencias instaladas$(NC)"

# Iniciar aplicación en desarrollo
start: ## Iniciar backend y frontend en modo desarrollo
	@echo "$(GREEN)🚀 Iniciando Wikipedia Graph Explorer...$(NC)"
	@./start.sh

# Iniciar solo backend
start-backend: ## Iniciar solo el backend
	@echo "$(GREEN)🔧 Iniciando backend en puerto $(BACKEND_PORT)...$(NC)"
	cd $(BACKEND_DIR) && PYTHONPATH=$(PWD)/$(BACKEND_DIR) ./venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port $(BACKEND_PORT)

# Iniciar solo frontend
start-frontend: ## Iniciar solo el frontend
	@echo "$(GREEN)🌐 Iniciando frontend en puerto $(FRONTEND_PORT)...$(NC)"
	cd $(FRONTEND_DIR) && npm run dev

# Desarrollo con hot reload
start-dev: ## Iniciar en modo desarrollo con hot reload
	@echo "$(GREEN)🔥 Iniciando en modo desarrollo...$(NC)"
	@./start.sh

# Detener servicios
stop: ## Detener todos los servicios
	@echo "$(YELLOW)🛑 Deteniendo servicios en $(OS)...$(NC)"
ifeq ($(OS),Mac)
	@pkill -f "uvicorn.*$(BACKEND_PORT)" || true
	@pkill -f "vite.*$(FRONTEND_PORT)" || true
	@pkill -f "node.*$(FRONTEND_PORT)" || true
else
	@pkill -f "uvicorn.*$(BACKEND_PORT)" || true
	@pkill -f "vite.*$(FRONTEND_PORT)" || true
	@pkill -f "node.*$(FRONTEND_PORT)" || true
endif
	@echo "$(GREEN)✅ Servicios detenidos$(NC)"

# Limpiar archivos temporales
clean: ## Limpiar archivos temporales y logs
	@echo "$(YELLOW)🧹 Limpiando archivos temporales...$(NC)"
	@rm -f backend.log frontend.log
	@rm -rf $(BACKEND_DIR)/__pycache__/
	@rm -rf $(BACKEND_DIR)/app/__pycache__/
	@rm -rf $(FRONTEND_DIR)/dist/
	@rm -rf $(FRONTEND_DIR)/node_modules/.cache/
	@echo "$(GREEN)✅ Limpieza completada$(NC)"

# Tests
test: ## Ejecutar tests del backend
	@echo "$(GREEN)🧪 Ejecutando tests...$(NC)"
	cd $(BACKEND_DIR) && venv/bin/python -m pytest tests/ -v

test-backend: ## Ejecutar solo tests del backend
	@echo "$(GREEN)🧪 Ejecutando tests del backend...$(NC)"
	cd $(BACKEND_DIR) && venv/bin/python -m pytest tests/ -v

# Build para producción
build: ## Build para producción
	@echo "$(GREEN)🏗️ Building para producción...$(NC)"
	@echo "Building frontend..."
	cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)✅ Build completado$(NC)"

# Docker commands
docker-build: ## Construir imágenes Docker
	@echo "$(GREEN)🐳 Construyendo imágenes Docker...$(NC)"
	$(DOCKER_COMPOSE) build

docker-up: ## Iniciar con Docker Compose
	@echo "$(GREEN)🐳 Iniciando con Docker Compose...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Servicios Docker iniciados$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8001"
	@echo "MongoDB: localhost:27017"

docker-down: ## Detener Docker Compose
	@echo "$(YELLOW)🐳 Deteniendo Docker Compose...$(NC)"
	$(DOCKER_COMPOSE) down

docker-logs: ## Ver logs de Docker
	@echo "$(GREEN)📋 Logs de Docker Compose:$(NC)"
	$(DOCKER_COMPOSE) logs -f

# Logs en desarrollo
logs: ## Ver logs de la aplicación
	@echo "$(GREEN)📋 Logs de la aplicación:$(NC)"
	@echo "$(YELLOW)Backend logs:$(NC)"
	@tail -f backend.log 2>/dev/null || echo "No hay logs del backend"
	@echo "$(YELLOW)Frontend logs:$(NC)"
	@tail -f frontend.log 2>/dev/null || echo "No hay logs del frontend"

# Verificar estado de servicios
status: ## Verificar estado de los servicios
	@echo "$(GREEN)📊 Estado de servicios en $(OS):$(NC)"
	@echo "Backend (puerto $(BACKEND_PORT)):"
ifeq ($(OS),Mac)
	@curl -s --max-time 3 http://127.0.0.1:$(BACKEND_PORT)/health && echo " ✅ OK" || echo " ❌ No responde"
else
	@curl -s http://127.0.0.1:$(BACKEND_PORT)/health && echo " ✅ OK" || echo " ❌ No responde"
endif
	@echo "Frontend (puerto $(FRONTEND_PORT)):"
ifeq ($(OS),Mac)
	@curl -s --max-time 3 http://localhost:$(FRONTEND_PORT) > /dev/null && echo " ✅ OK" || echo " ❌ No responde"
else
	@curl -s http://localhost:$(FRONTEND_PORT) > /dev/null && echo " ✅ OK" || echo " ❌ No responde"
endif

# Reinstalar dependencias
reinstall: clean ## Reinstalar todas las dependencias
	@echo "$(YELLOW)🔄 Reinstalando dependencias...$(NC)"
	@rm -rf $(BACKEND_DIR)/venv/
	@rm -rf $(FRONTEND_DIR)/node_modules/
	@make install

# Desarrollo rápido (instalar + iniciar)
dev: install start ## Instalar dependencias e iniciar en modo desarrollo

# Información del proyecto
info: ## Mostrar información del proyecto
	@echo "$(GREEN)📋 Información del proyecto:$(NC)"
	@echo "Nombre: Wikipedia Graph Explorer"
	@echo "Backend: FastAPI + Python"
	@echo "Frontend: React + TypeScript + Vite"
	@echo "Base de datos: MongoDB"
	@echo ""
	@echo "$(YELLOW)Puertos:$(NC)"
	@echo "Frontend: http://localhost:$(FRONTEND_PORT)"
	@echo "Backend: http://127.0.0.1:$(BACKEND_PORT)"
	@echo "API Docs: http://127.0.0.1:$(BACKEND_PORT)/docs"
	@echo ""
	@echo "$(YELLOW)Directorios:$(NC)"
	@echo "Backend: ./$(BACKEND_DIR)/"
	@echo "Frontend: ./$(FRONTEND_DIR)/"
