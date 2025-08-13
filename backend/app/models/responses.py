"""
Modelos Pydantic para las respuestas de la API

Estos modelos definen la estructura de datos que la API devuelve,
proporcionando validación automática y documentación de la API.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime

class HealthResponse(BaseModel):
    """Respuesta del endpoint de salud"""
    message: str
    status: str
    version: str

class WikipediaArticle(BaseModel):
    """Modelo para un artículo de Wikipedia"""
    title: str = Field(..., description="Título del artículo")
    summary: Optional[str] = Field(None, description="Resumen del artículo")
    url: HttpUrl = Field(..., description="URL del artículo en Wikipedia")
    page_id: Optional[int] = Field(None, description="ID único de la página en Wikipedia")
    image_url: Optional[str] = Field(None, description="URL de la imagen principal del artículo")

class SearchResponse(BaseModel):
    """Respuesta del endpoint de búsqueda"""
    results: List[WikipediaArticle] = Field(..., description="Lista de artículos encontrados")
    total_count: int = Field(..., description="Número total de resultados")
    search_term: str = Field(..., description="Término de búsqueda utilizado")

class GraphNode(BaseModel):
    """Nodo en el grafo de conocimiento"""
    id: str = Field(..., description="Identificador único del nodo (título del artículo)")
    label: str = Field(..., description="Etiqueta visible del nodo")
    summary: Optional[str] = Field(None, description="Resumen del artículo")
    url: HttpUrl = Field(..., description="URL del artículo")
    page_id: Optional[int] = Field(None, description="ID de la página")
    depth: int = Field(0, description="Profundidad desde el nodo raíz")
    centrality: Optional[float] = Field(None, description="Medida de centralidad del nodo")
    image_url: Optional[str] = Field(None, description="URL de la imagen principal del artículo")

class GraphEdge(BaseModel):
    """Arista en el grafo de conocimiento"""
    from_node: str = Field(..., alias="from", description="ID del nodo origen")
    to_node: str = Field(..., alias="to", description="ID del nodo destino")
    weight: float = Field(1.0, description="Peso de la conexión")
    edge_type: str = Field("link", description="Tipo de conexión")

    model_config = {
        "populate_by_name": True
    }

class GraphData(BaseModel):
    """Estructura completa del grafo"""
    nodes: List[GraphNode] = Field(..., description="Lista de nodos del grafo")
    edges: List[GraphEdge] = Field(..., description="Lista de aristas del grafo")
    root_node: str = Field(..., description="ID del nodo raíz")
    total_nodes: int = Field(..., description="Número total de nodos")
    total_edges: int = Field(..., description="Número total de aristas")
    max_depth: int = Field(..., description="Profundidad máxima explorada")

class ExploreResponse(BaseModel):
    """Respuesta del endpoint de exploración"""
    graph_data: GraphData = Field(..., description="Datos del grafo explorado")
    exploration_time: float = Field(..., description="Tiempo de exploración en segundos")
    articles_processed: int = Field(..., description="Número de artículos procesados")

class SavedExploration(BaseModel):
    """Modelo para una exploración guardada"""
    id: Optional[str] = Field(None, description="ID único de la exploración")
    name: str = Field(..., description="Nombre de la exploración")
    description: Optional[str] = Field(None, description="Descripción de la exploración")
    root_node: str = Field(..., description="Nodo raíz de la exploración")
    graph_data: GraphData = Field(..., description="Datos del grafo")
    created_at: Optional[datetime] = Field(None, description="Fecha de creación")
    updated_at: Optional[datetime] = Field(None, description="Fecha de última actualización")
    tags: List[str] = Field(default_factory=list, description="Etiquetas de la exploración")

class CreateExplorationRequest(BaseModel):
    """Modelo para crear una nueva exploración"""
    name: str = Field(..., min_length=1, max_length=100, description="Nombre de la exploración")
    description: Optional[str] = Field(None, max_length=500, description="Descripción opcional")
    root_node: str = Field(..., description="Nodo raíz de la exploración")
    graph_data: GraphData = Field(..., description="Datos del grafo a guardar")
    tags: List[str] = Field(default_factory=list, description="Etiquetas opcionales")

class ExplorationListResponse(BaseModel):
    """Respuesta para la lista de exploraciones"""
    explorations: List[SavedExploration] = Field(..., description="Lista de exploraciones")
    total_count: int = Field(..., description="Número total de exploraciones")
    page: int = Field(1, description="Página actual")
    page_size: int = Field(10, description="Tamaño de página")

class PathFindingRequest(BaseModel):
    """Modelo para solicitud de búsqueda de camino más corto"""
    from_article: str = Field(..., description="Artículo de origen")
    to_article: str = Field(..., description="Artículo de destino")
    max_depth: int = Field(6, ge=1, le=10, description="Profundidad máxima de búsqueda")

class PathNode(BaseModel):
    """Nodo en un camino entre artículos"""
    article_title: str = Field(..., description="Título del artículo")
    url: HttpUrl = Field(..., description="URL del artículo")
    step: int = Field(..., description="Número de paso en el camino")

class PathFindingResponse(BaseModel):
    """Respuesta de búsqueda de camino más corto"""
    path_found: bool = Field(..., description="Si se encontró un camino")
    path_length: int = Field(..., description="Longitud del camino encontrado")
    path: List[PathNode] = Field(..., description="Secuencia de artículos en el camino")
    exploration_time: float = Field(..., description="Tiempo de búsqueda en segundos")
    articles_explored: int = Field(..., description="Número de artículos explorados")

class ErrorResponse(BaseModel):
    """Modelo estándar para respuestas de error"""
    detail: str = Field(..., description="Descripción del error")
    error_code: Optional[str] = Field(None, description="Código de error específico")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp del error")
    path: Optional[str] = Field(None, description="Endpoint donde ocurrió el error")
