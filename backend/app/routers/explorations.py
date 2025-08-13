"""
Router para endpoints CRUD de exploraciones guardadas

Maneja la persistencia y gestión de grafos de exploración en MongoDB.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Path
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import logging

from app.models.responses import (
    SavedExploration, 
    CreateExplorationRequest, 
    ExplorationListResponse,
    GraphData
)
from app.database.connection import get_database
from app.auth.dependencies import get_current_active_user, get_user_or_guest
from app.models.user import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/explorations", response_model=SavedExploration)
async def create_exploration(
    request: CreateExplorationRequest,
    current_user: UserResponse = Depends(get_current_active_user),
    db = Depends(get_database)
) -> SavedExploration:
    """
    Guarda una nueva exploración de grafo en la base de datos
    
    Permite a los usuarios persistir el estado de un grafo explorado
    para poder recuperarlo posteriormente.
    
    Args:
        request: Datos de la exploración a guardar
        db: Instancia de la base de datos MongoDB
    
    Returns:
        SavedExploration: Exploración guardada con ID generado
    
    Raises:
        HTTPException:
            - 400: Si los datos de entrada son inválidos
            - 500: Si hay error interno del servidor
    
    Example:
        POST /api/explorations
        Body:
        {
            "name": "Exploración de Física Cuántica",
            "description": "Grafo explorando conceptos de física cuántica desde Einstein",
            "root_node": "Albert_Einstein",
            "graph_data": { ... },
            "tags": ["physics", "science", "quantum"]
        }
        
        Response:
        {
            "id": "507f1f77bcf86cd799439011",
            "name": "Exploración de Física Cuántica",
            "description": "Grafo explorando conceptos...",
            "root_node": "Albert_Einstein", 
            "graph_data": { ... },
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z",
            "tags": ["physics", "science", "quantum"]
        }
    """
    
    try:
        logger.info(f"Creando nueva exploración: '{request.name}'")
        
        # Convertir graph_data a dict para MongoDB, convirtiendo URLs a strings
        graph_data_dict = request.graph_data.model_dump(mode='json') if request.graph_data else {}
        
        # Preparar documento para MongoDB
        now = datetime.utcnow()
        # Crear documento de exploración
        exploration_doc = {
            "name": request.name,
            "description": request.description or "",
            "user_id": current_user.id,  # Agregar user_id
            "root_node": request.root_node,
            "graph_data": graph_data_dict,
            "tags": request.tags or [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insertar en MongoDB
        collection = db.explorations
        result = await collection.insert_one(exploration_doc)
        
        if not result.inserted_id:
            raise HTTPException(
                status_code=500,
                detail="Error guardando la exploración en la base de datos"
            )
        
        # Recuperar documento insertado
        saved_doc = await collection.find_one({"_id": result.inserted_id})
        
        # Convertir a modelo de respuesta
        saved_exploration = SavedExploration(
            id=str(saved_doc["_id"]),
            name=saved_doc["name"],
            description=saved_doc.get("description"),
            root_node=saved_doc["root_node"],
            graph_data=GraphData(**saved_doc["graph_data"]),
            created_at=saved_doc["created_at"],
            updated_at=saved_doc["updated_at"],
            tags=saved_doc.get("tags", [])
        )
        
        logger.info(f"Exploración creada exitosamente: ID={result.inserted_id}")
        return saved_exploration
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creando exploración: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor creando la exploración"
        )

@router.get("/explorations", response_model=ExplorationListResponse)
async def list_explorations(
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(10, ge=1, le=50, description="Tamaño de página"),
    search: Optional[str] = Query(None, description="Búsqueda por nombre o descripción"),
    tag: Optional[str] = Query(None, description="Filtrar por etiqueta"),
    root_node: Optional[str] = Query(None, description="Filtrar por nodo raíz"),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> ExplorationListResponse:
    """
    Lista las exploraciones guardadas con paginación y filtros
    
    Retorna una lista paginada de exploraciones guardadas, con opciones
    de búsqueda y filtrado por diferentes criterios.
    
    Args:
        page: Número de página (comenzando en 1)
        page_size: Número de elementos por página (1-50)
        search: Término de búsqueda en nombre o descripción (opcional)
        tag: Filtro por etiqueta específica (opcional)
        root_node: Filtro por nodo raíz específico (opcional)
        db: Instancia de la base de datos MongoDB
    
    Returns:
        ExplorationListResponse: Lista paginada de exploraciones con metadatos
    
    Example:
        GET /api/explorations?page=1&page_size=10&search=einstein&tag=physics
        
        Response:
        {
            "explorations": [
                {
                    "id": "507f1f77bcf86cd799439011",
                    "name": "Exploración de Einstein",
                    "description": "Conceptos relacionados con Einstein",
                    "root_node": "Albert_Einstein",
                    "graph_data": { ... },
                    "created_at": "2024-01-15T10:30:00Z",
                    "updated_at": "2024-01-15T10:30:00Z",
                    "tags": ["physics", "science"]
                }
            ],
            "total_count": 1,
            "page": 1,
            "page_size": 10
        }
    """
    
    try:
        logger.info(f"Listando exploraciones: página={page}, tamaño={page_size}")
        
        collection = db.explorations
        
        # Construir filtros de búsqueda
        filters = {}
        
        if search:
            # Búsqueda por texto en nombre y descripción
            filters["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        
        if tag:
            filters["tags"] = tag
        
        if root_node:
            filters["root_node"] = root_node
        
        # Calcular skip y límite para paginación
        skip = (page - 1) * page_size
        
        # Obtener total de documentos
        total_count = await collection.count_documents(filters)
        
        # Obtener documentos con paginación
        cursor = collection.find(filters).sort([
            ("created_at", -1),  # Más recientes primero
            ("name", 1)          # Luego por nombre
        ]).skip(skip).limit(page_size)
        
        exploration_docs = await cursor.to_list(length=page_size)
        
        # Convertir a modelos de respuesta
        explorations = []
        for doc in exploration_docs:
            try:
                exploration = SavedExploration(
                    id=str(doc["_id"]),
                    name=doc["name"],
                    description=doc.get("description"),
                    root_node=doc["root_node"],
                    graph_data=GraphData(**doc["graph_data"]),
                    created_at=doc["created_at"],
                    updated_at=doc["updated_at"],
                    tags=doc.get("tags", [])
                )
                explorations.append(exploration)
            except Exception as e:
                logger.warning(f"Error procesando exploración {doc.get('_id')}: {str(e)}")
                continue
        
        response = ExplorationListResponse(
            explorations=explorations,
            total_count=total_count,
            page=page,
            page_size=page_size
        )
        
        logger.info(f"Exploraciones listadas: {len(explorations)}/{total_count} total")
        return response
        
    except Exception as e:
        logger.error(f"Error listando exploraciones: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor listando exploraciones"
        )

@router.get("/explorations/{exploration_id}", response_model=SavedExploration)
async def get_exploration(
    exploration_id: str = Path(..., description="ID único de la exploración"),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> SavedExploration:
    """
    Obtiene una exploración específica por su ID
    
    Retorna los datos completos de una exploración guardada,
    incluyendo toda la estructura del grafo.
    
    Args:
        exploration_id: ID único de la exploración en la base de datos
        db: Instancia de la base de datos MongoDB
    
    Returns:
        SavedExploration: Datos completos de la exploración
    
    Raises:
        HTTPException:
            - 400: Si el ID no es válido
            - 404: Si la exploración no se encuentra
            - 500: Si hay error interno del servidor
    
    Example:
        GET /api/explorations/507f1f77bcf86cd799439011
        
        Response:
        {
            "id": "507f1f77bcf86cd799439011",
            "name": "Mi Exploración",
            "description": "Descripción de la exploración",
            "root_node": "Albert_Einstein",
            "graph_data": { 
                "nodes": [...],
                "edges": [...],
                ...
            },
            "created_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z",
            "tags": ["physics"]
        }
    """
    
    try:
        logger.info(f"Obteniendo exploración: ID={exploration_id}")
        
        # Validar formato del ObjectId
        try:
            object_id = ObjectId(exploration_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="ID de exploración inválido"
            )
        
        # Buscar en la base de datos
        collection = db.explorations
        doc = await collection.find_one({"_id": object_id})
        
        if not doc:
            raise HTTPException(
                status_code=404,
                detail=f"Exploración con ID {exploration_id} no encontrada"
            )
        
        # Convertir a modelo de respuesta
        exploration = SavedExploration(
            id=str(doc["_id"]),
            name=doc["name"],
            description=doc.get("description"),
            root_node=doc["root_node"],
            graph_data=GraphData(**doc["graph_data"]),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            tags=doc.get("tags", [])
        )
        
        logger.info(f"Exploración obtenida exitosamente: {exploration.name}")
        return exploration
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo exploración {exploration_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor obteniendo la exploración"
        )

@router.delete("/explorations/{exploration_id}")
async def delete_exploration(
    exploration_id: str = Path(..., description="ID único de la exploración"),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> JSONResponse:
    """
    Elimina una exploración específica
    
    Elimina permanentemente una exploración guardada de la base de datos.
    
    Args:
        exploration_id: ID único de la exploración a eliminar
        db: Instancia de la base de datos MongoDB
    
    Returns:
        JSONResponse: Confirmación de eliminación
    
    Raises:
        HTTPException:
            - 400: Si el ID no es válido
            - 404: Si la exploración no se encuentra
            - 500: Si hay error interno del servidor
    
    Example:
        DELETE /api/explorations/507f1f77bcf86cd799439011
        
        Response:
        {
            "message": "Exploración eliminada exitosamente",
            "exploration_id": "507f1f77bcf86cd799439011"
        }
    """
    
    try:
        logger.info(f"Eliminando exploración: ID={exploration_id}")
        
        # Validar formato del ObjectId
        try:
            object_id = ObjectId(exploration_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="ID de exploración inválido"
            )
        
        # Verificar que existe antes de eliminar
        collection = db.explorations
        existing_doc = await collection.find_one({"_id": object_id})
        
        if not existing_doc:
            raise HTTPException(
                status_code=404,
                detail=f"Exploración con ID {exploration_id} no encontrada"
            )
        
        # Eliminar documento
        result = await collection.delete_one({"_id": object_id})
        
        if result.deleted_count != 1:
            raise HTTPException(
                status_code=500,
                detail="Error eliminando la exploración de la base de datos"
            )
        
        logger.info(f"Exploración eliminada exitosamente: {existing_doc.get('name', 'Sin nombre')}")
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Exploración eliminada exitosamente",
                "exploration_id": exploration_id,
                "name": existing_doc.get("name", "Sin nombre")
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando exploración {exploration_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor eliminando la exploración"
        )

@router.put("/explorations/{exploration_id}", response_model=SavedExploration)
async def update_exploration(
    exploration_id: str = Path(..., description="ID único de la exploración"),
    request: CreateExplorationRequest = ...,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> SavedExploration:
    """
    Actualiza una exploración existente
    
    Permite modificar los datos de una exploración guardada,
    incluyendo nombre, descripción, etiquetas y datos del grafo.
    
    Args:
        exploration_id: ID único de la exploración a actualizar
        request: Nuevos datos de la exploración
        db: Instancia de la base de datos MongoDB
    
    Returns:
        SavedExploration: Exploración actualizada
    
    Raises:
        HTTPException:
            - 400: Si el ID no es válido o los datos son inválidos
            - 404: Si la exploración no se encuentra
            - 500: Si hay error interno del servidor
    """
    
    try:
        logger.info(f"Actualizando exploración: ID={exploration_id}")
        
        # Validar formato del ObjectId
        try:
            object_id = ObjectId(exploration_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="ID de exploración inválido"
            )
        
        # Verificar que existe
        collection = db.explorations
        existing_doc = await collection.find_one({"_id": object_id})
        
        if not existing_doc:
            raise HTTPException(
                status_code=404,
                detail=f"Exploración con ID {exploration_id} no encontrada"
            )
        
        # Preparar datos actualizados
        update_doc = {
            "name": request.name,
            "description": request.description,
            "root_node": request.root_node,
            "graph_data": request.graph_data.dict(),
            "tags": request.tags,
            "updated_at": datetime.utcnow()
        }
        
        # Actualizar documento
        result = await collection.update_one(
            {"_id": object_id},
            {"$set": update_doc}
        )
        
        if result.modified_count != 1:
            raise HTTPException(
                status_code=500,
                detail="Error actualizando la exploración en la base de datos"
            )
        
        # Recuperar documento actualizado
        updated_doc = await collection.find_one({"_id": object_id})
        
        # Convertir a modelo de respuesta
        updated_exploration = SavedExploration(
            id=str(updated_doc["_id"]),
            name=updated_doc["name"],
            description=updated_doc.get("description"),
            root_node=updated_doc["root_node"],
            graph_data=GraphData(**updated_doc["graph_data"]),
            created_at=updated_doc["created_at"],
            updated_at=updated_doc["updated_at"],
            tags=updated_doc.get("tags", [])
        )
        
        logger.info(f"Exploración actualizada exitosamente: {request.name}")
        return updated_exploration
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando exploración {exploration_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor actualizando la exploración"
        )
