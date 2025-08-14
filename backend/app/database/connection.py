"""
Conexión y configuración de la base de datos MongoDB

Este módulo maneja la conexión asíncrona a MongoDB usando Motor,
el driver oficial de MongoDB para aplicaciones asyncio/FastAPI.
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class DatabaseManager:
    """
    Administrador de conexiones a la base de datos MongoDB
    
    Implementa el patrón Singleton para garantizar una sola instancia
    de conexión durante el ciclo de vida de la aplicación.
    """
    
    _instance: Optional['DatabaseManager'] = None
    _client: Optional[AsyncIOMotorClient] = None
    _database: Optional[AsyncIOMotorDatabase] = None
    
    def __new__(cls) -> 'DatabaseManager':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    async def connect(self) -> None:
        """
        Establece la conexión con MongoDB
        """
        if self._client is None:
            # Configuración de conexión desde variables de entorno
            mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
            database_name = os.getenv("DATABASE_NAME", "wikipedia_graph_explorer")
            
            try:
                # Configuración SSL/TLS optimizada para producción (Render + Atlas)
                connection_options = {
                    "tls": True,                         # Habilitar TLS
                    "serverSelectionTimeoutMS": 30000,  # 30 segundos timeout
                    "connectTimeoutMS": 30000,           # 30 segundos para conectar
                    "socketTimeoutMS": 45000,            # 45 segundos para operaciones
                    "maxPoolSize": 10,                   # Máximo 10 conexiones en el pool
                    "minPoolSize": 1,                    # Mínimo 1 conexión en el pool
                    "retryWrites": True,                 # Reintentar escrituras
                    "w": "majority",                     # Write concern
                }
                
                # Configuración SSL adicional para Atlas en producción
                if "mongodb+srv://" in mongodb_url:
                    import certifi
                    connection_options.update({
                        "tlsCAFile": certifi.where(),    # Usar certificados de certifi
                        "tlsAllowInvalidCertificates": False,  # Validar certificados
                        "tlsAllowInvalidHostnames": False,     # Validar hostnames
                        "authSource": "admin",           # Fuente de autenticación
                    })
                
                # Crear cliente de MongoDB
                self._client = AsyncIOMotorClient(mongodb_url, **connection_options)
                
                # Verificar conexión
                await self._client.admin.command('ismaster')
                
                # Seleccionar base de datos
                self._database = self._client[database_name]
                
                logger.info(f"Conectado exitosamente a MongoDB: {database_name}")
                
                # Crear índices necesarios
                await self._create_indexes()
                
            except ConnectionFailure as e:
                logger.error(f"Error conectando a MongoDB: {str(e)}")
                raise
            except Exception as e:
                logger.error(f"Error inesperado conectando a MongoDB: {str(e)}")
                raise
    
    async def _create_indexes(self) -> None:
        """
        Crea los índices necesarios para optimizar las consultas
        """
        try:
            # Índices para la colección de exploraciones
            explorations_collection = self._database.explorations
            
            # Índice para búsquedas por nombre
            await explorations_collection.create_index("name")
            
            # Índice para búsquedas por nodo raíz
            await explorations_collection.create_index("root_node")
            
            # Índice para búsquedas por fecha de creación
            await explorations_collection.create_index("created_at")
            
            # Índice para búsquedas por tags
            await explorations_collection.create_index("tags")
            
            # Índice compuesto para paginación eficiente
            await explorations_collection.create_index([
                ("created_at", -1),
                ("name", 1)
            ])
            
            logger.info("Índices de base de datos creados exitosamente")
            
        except Exception as e:
            logger.warning(f"Error creando índices: {str(e)}")
    
    async def disconnect(self) -> None:
        """
        Cierra la conexión con MongoDB
        """
        if self._client:
            self._client.close()
            self._client = None
            self._database = None
            logger.info("Desconectado de MongoDB")
    
    def get_database(self) -> AsyncIOMotorDatabase:
        """
        Retorna la instancia de la base de datos
        
        Returns:
            AsyncIOMotorDatabase: Instancia de la base de datos MongoDB
            
        Raises:
            RuntimeError: Si no hay conexión establecida
        """
        if self._database is None:
            raise RuntimeError("No hay conexión establecida con la base de datos")
        return self._database
    
    def get_client(self) -> AsyncIOMotorClient:
        """
        Retorna el cliente de MongoDB
        
        Returns:
            AsyncIOMotorClient: Cliente de MongoDB
            
        Raises:
            RuntimeError: Si no hay conexión establecida
        """
        if self._client is None:
            raise RuntimeError("No hay conexión establecida con MongoDB")
        return self._client

# Instancia global del administrador de base de datos
db_manager = DatabaseManager()

async def get_database() -> AsyncIOMotorDatabase:
    """
    Función de dependencia para FastAPI
    
    Retorna una instancia de la base de datos para usar en endpoints.
    Asegura que la conexión esté establecida antes de retornar.
    
    Returns:
        AsyncIOMotorDatabase: Instancia de la base de datos
    """
    if db_manager._database is None:
        await db_manager.connect()
    return db_manager.get_database()

async def startup_database():
    """
    Función para inicializar la base de datos al arranque de la aplicación
    """
    try:
        await db_manager.connect()
        logger.info("Base de datos inicializada correctamente")
    except Exception as e:
        logger.error(f"Error inicializando la base de datos: {str(e)}")
        raise

async def shutdown_database():
    """
    Función para cerrar la conexión al finalizar la aplicación
    """
    try:
        await db_manager.disconnect()
        logger.info("Conexión a base de datos cerrada correctamente")
    except Exception as e:
        logger.error(f"Error cerrando la conexión: {str(e)}")

# Configuración de eventos para el ciclo de vida de la aplicación
async def lifespan_startup():
    """Inicialización al arranque"""
    await startup_database()

async def lifespan_shutdown():
    """Limpieza al cierre"""
    await shutdown_database()
