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
py -3.9 --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python 3.9 no esta instalado
    echo Por favor instala Python 3.9 o superior desde https://python.org/
    pause
    exit /b 1
)

echo Configurando backend...
cd backend

REM Verificar que existe el archivo de requisitos
if not exist "requirements.txt" (
    echo ERROR: No se encontro el archivo requirements.txt en backend
    cd ..
    pause
    exit /b 1
)

REM Crear entorno virtual si no existe
if not exist "venv" (
    echo Creando entorno virtual con Python 3.9...
    py -3.9 -m venv venv
    if errorlevel 1 (
        echo ERROR: No se pudo crear el entorno virtual
        cd ..
        pause
        exit /b 1
    )
)

REM Verificar si necesitamos instalar dependencias de Python
set INSTALL_PYTHON_DEPS=0
if not exist "venv\Scripts\uvicorn.exe" set INSTALL_PYTHON_DEPS=1
if not exist "venv\Scripts\pip.exe" set INSTALL_PYTHON_DEPS=1

if %INSTALL_PYTHON_DEPS%==1 (
    echo Instalando dependencias de Python...
    venv\Scripts\python -m pip install --upgrade pip
    venv\Scripts\pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: No se pudieron instalar las dependencias de Python
        cd ..
        pause
        exit /b 1
    )
    echo Dependencias de Python instaladas correctamente.
) else (
    echo Dependencias de Python ya estan instaladas.
)

cd ..

echo Configurando frontend...
cd frontend

REM Verificar que existe el archivo package.json
if not exist "package.json" (
    echo ERROR: No se encontro el archivo package.json en frontend
    cd ..
    pause
    exit /b 1
)

REM Verificar si necesitamos instalar dependencias de Node.js
if not exist "node_modules" (
    echo Instalando dependencias de Node.js...
    npm install
    if errorlevel 1 (
        echo ERROR: No se pudieron instalar las dependencias de Node.js
        cd ..
        pause
        exit /b 1
    )
    echo Dependencias de Node.js instaladas correctamente.
) else (
    echo Dependencias de Node.js ya estan instaladas.
)

cd ..

echo.
echo Iniciando servicios...
echo.

REM Verificar que las dependencias esten realmente instaladas antes de iniciar
echo Verificando que todas las dependencias esten correctamente instaladas...

cd backend
if not exist "venv\Scripts\uvicorn.exe" (
    echo ERROR: uvicorn no esta instalado en el entorno virtual
    cd ..
    pause
    exit /b 1
)
cd ..

cd frontend
if not exist "node_modules" (
    echo ERROR: node_modules no existe en frontend
    cd ..
    pause
    exit /b 1
)
cd ..

echo Todas las dependencias estan correctamente instaladas.
echo.

REM Iniciar backend
echo Iniciando backend en puerto 8001...
cd backend
start "Wikipedia Graph Explorer - Backend" cmd /k "venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001"
cd ..

REM Esperar un poco mas para que el backend se inicie completamente
echo Esperando a que el backend se inicie completamente...
timeout /t 8 /nobreak >nul

REM Iniciar frontend
echo Iniciando frontend en puerto 3000...
cd frontend
start "Wikipedia Graph Explorer - Frontend" cmd /k "npm run dev"
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
