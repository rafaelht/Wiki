@echo off
REM Script para iniciar Wikipedia Graph Explorer en Windows

echo ================================================
echo   Wikipedia Graph Explorer - Startup Script
echo ================================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "backend" (
    echo ERROR: No se encontro la carpeta 'backend'
    echo Este script debe ejecutarse desde el directorio raiz del proyecto
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: No se encontro la carpeta 'frontend'
    echo Este script debe ejecutarse desde el directorio raiz del proyecto
    pause
    exit /b 1
)

echo Verificando dependencias...

REM Verificar Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python no esta instalado
    echo Por favor instala Python desde https://python.org/
    pause
    exit /b 1
)

echo Configurando backend...
cd backend

REM Crear entorno virtual si no existe
if not exist "venv" (
    echo Creando entorno virtual...
    python -m venv venv
)

REM Activar entorno virtual e instalar dependencias
if not exist "venv\Scripts\uvicorn.exe" (
    echo Instalando dependencias de Python...
    venv\Scripts\pip install -r requirements.txt
)

cd ..

echo Configurando frontend...
cd frontend

REM Instalar dependencias de Node.js si no existen
if not exist "node_modules" (
    echo Instalando dependencias de Node.js...
    npm install
)

cd ..

echo.
echo Iniciando servicios...
echo.

REM Iniciar backend
echo Iniciando backend en puerto 8001...
cd backend
start "Backend" cmd /k "venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001"
cd ..

REM Esperar un poco para que el backend se inicie
timeout /t 5 /nobreak >nul

REM Iniciar frontend
echo Iniciando frontend en puerto 3000...
cd frontend
start "Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ================================================
echo   Aplicacion iniciada exitosamente!
echo ================================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://127.0.0.1:8001
echo API Docs:  http://127.0.0.1:8001/docs
echo.
echo Presiona cualquier tecla para continuar...
pause >nul
