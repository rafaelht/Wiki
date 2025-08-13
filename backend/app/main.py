"""
Wikipedia Graph Explorer - Backend Application

FastAPI backend para explorar artículos de Wikipedia como un grafo interactivo.
Proporciona endpoints para búsqueda, exploración y gestión de grafos guardados.
"""

from fastapi import FastAPI, HTTPException, Query, Path, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import uvicorn
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Imports locales
from app.routers import search, explore, explorations, auth
from app.database.connection import get_database
from app.models.responses import HealthResponse
from app.services.auth_service import auth_service

# Crear instancia de FastAPI
app = FastAPI(
    title="Wikipedia Graph Explorer API",
    description="API para explorar artículos de Wikipedia como un grafo de conocimiento conectado",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS para el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(explore.router, prefix="/api", tags=["explore"])
app.include_router(explorations.router, prefix="/api", tags=["explorations"])

@app.on_event("startup")
async def startup_event():
    """
    Initialize default admin user on startup
    """
    try:
        await auth_service.create_admin_user()
        logger.info("Application startup completed")
    except Exception as e:
        logger.error(f"Error during startup: {str(e)}")

@app.get("/", response_model=HealthResponse)
async def root():
    """
    Endpoint de salud de la API
    """
    return HealthResponse(
        message="Wikipedia Graph Explorer API está funcionando",
        status="healthy",
        version="1.0.0"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Endpoint de verificación de salud más detallado
    """
    try:
        # Verificar conexión a la base de datos
        db = await get_database()
        await db.command("ismaster")
        
        return HealthResponse(
            message="API y base de datos funcionando correctamente",
            status="healthy",
            version="1.0.0"
        )
    except Exception as e:
        logger.error(f"Error en health check: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Error de conectividad con la base de datos"
        )

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """
    Manejador personalizado para errores 404
    """
    return JSONResponse(
        status_code=404,
        content={
            "detail": "Endpoint no encontrado",
            "message": "Verifica la URL y método HTTP",
            "available_endpoints": [
                "/docs",
                "/api/search",
                "/api/explore/{article_title}",
                "/api/explorations"
            ]
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """
    Manejador personalizado para errores internos
    """
    logger.error(f"Error interno del servidor: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor",
            "message": "Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo."
        }
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
