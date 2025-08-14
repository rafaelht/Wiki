"""
Configuración específica para despliegue en Render
Incluye workarounds para problemas SSL con MongoDB Atlas
"""

import os
import ssl
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import logging

logger = logging.getLogger(__name__)

def create_render_mongo_client():
    """
    Crea un cliente de MongoDB específicamente configurado para Render
    que evita los problemas SSL comunes en este entorno
    """
    
    mongodb_url = os.getenv("MONGODB_URL")
    if not mongodb_url:
        raise ValueError("MONGODB_URL no está configurada")
    
    # Configuración específica para Render
    connection_options = {
        # Timeouts generosos para Render
        "serverSelectionTimeoutMS": 60000,  # 60 segundos
        "connectTimeoutMS": 60000,
        "socketTimeoutMS": 60000,
        
        # Pool de conexiones conservador
        "maxPoolSize": 5,
        "minPoolSize": 1,
        
        # Configuración de retry
        "retryWrites": True,
        "retryReads": True,
        
        # Configuración de heartbeat
        "heartbeatFrequencyMS": 30000,
        "maxIdleTimeMS": 45000,
        
        # SSL configurado para Render (sin verificación estricta)
        "ssl": True,
        "ssl_cert_reqs": ssl.CERT_NONE,
        "ssl_match_hostname": False,
        "authSource": "admin",
    }
    
    # Crear contexto SSL permisivo
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    connection_options["ssl_context"] = ssl_context
    
    logger.info("Creando cliente MongoDB para Render con SSL permisivo")
    
    return AsyncIOMotorClient(mongodb_url, **connection_options)

# Variable de entorno para detectar si estamos en Render
def is_render_environment():
    """Detecta si estamos ejecutando en Render"""
    return os.getenv("RENDER") is not None or os.getenv("RENDER_SERVICE_ID") is not None
