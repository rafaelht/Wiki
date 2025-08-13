"""
Router para endpoints de exploración de grafos

Maneja la exploración del grafo de conocimiento y expansión de nodos.
"""

from fastapi import APIRouter, Path, Query, HTTPException, Body
from typing import Optional, Dict, Any
import logging
import time

from app.models.responses import ExploreResponse, GraphData, PathFindingRequest, PathFindingResponse, PathNode
from app.services.graph_service import graph_service
from app.services.wikipedia_service import wikipedia_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/explore/{article_title}", response_model=ExploreResponse)
async def explore_graph(
    article_title: str = Path(..., description="Título del artículo raíz para explorar"),
    depth: int = Query(2, ge=1, le=3, description="Profundidad de exploración (1-3)"),
    max_nodes: Optional[int] = Query(30, ge=10, le=200, description="Número máximo de nodos en el grafo")
) -> ExploreResponse:
    """
    Explora el grafo de conocimiento desde un artículo raíz
    
    Este es el endpoint principal del sistema. Construye un grafo de conocimiento
    explorando las conexiones (enlaces) desde un artículo de Wikipedia hacia
    otros artículos, hasta la profundidad especificada.
    
    Args:
        article_title: Título del artículo de Wikipedia que será el nodo raíz
        depth: Profundidad de exploración (1-3). Cada nivel añade artículos enlazados
        max_nodes: Límite opcional del número máximo de nodos en el grafo (10-200)
    
    Returns:
        ExploreResponse: Grafo completo con nodos, aristas y metadatos de exploración
    
    Raises:
        HTTPException:
            - 404: Si el artículo raíz no se encuentra
            - 400: Si los parámetros son inválidos
            - 500: Si hay error interno del servidor
    
    Example:
        GET /api/explore/Albert Einstein?depth=3&max_nodes=50
        
        Response:
        {
            "graph_data": {
                "nodes": [
                    {
                        "id": "Albert_Einstein",
                        "label": "Albert Einstein",
                        "summary": "Físico teórico alemán...",
                        "url": "https://en.wikipedia.org/wiki/Albert_Einstein",
                        "depth": 0,
                        "centrality": 0.95
                    }
                ],
                "edges": [
                    {
                        "from": "Albert_Einstein",
                        "to": "Theory_of_relativity",
                        "weight": 1.0
                    }
                ],
                "root_node": "Albert_Einstein",
                "total_nodes": 25,
                "total_edges": 47,
                "max_depth": 3
            },
            "exploration_time": 2.34,
            "articles_processed": 25
        }
    """
    
    try:
        start_time = time.time()
        logger.info(f"Iniciando exploración del grafo: artículo='{article_title}', "
                   f"profundidad={depth}, max_nodos={max_nodes}")
        
        # Validar que el artículo existe
        article_summary = await wikipedia_service._get_article_summary(article_title)
        if not article_summary:
            raise HTTPException(
                status_code=404,
                detail=f"El artículo '{article_title}' no se encontró en Wikipedia"
            )
        
        # Construir el grafo
        graph_data = await graph_service.explore_graph(
            root_article=article_title,
            depth=depth,
            max_nodes=max_nodes
        )
        
        exploration_time = time.time() - start_time
        
        response = ExploreResponse(
            graph_data=graph_data,
            exploration_time=round(exploration_time, 2),
            articles_processed=graph_data.total_nodes
        )
        
        logger.info(f"Exploración completada: {graph_data.total_nodes} nodos, "
                   f"{graph_data.total_edges} aristas, {exploration_time:.2f}s")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error durante exploración del grafo '{article_title}': {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor durante la exploración del grafo"
        )

@router.post("/explore/expand")
async def expand_node(
    graph_data: GraphData = Body(..., description="Grafo actual"),
    node_id: str = Body(..., description="ID del nodo a expandir"),
    depth: int = Body(1, ge=1, le=3, description="Profundidad de expansión")
) -> GraphData:
    """
    Expande un nodo específico en un grafo existente
    
    Permite la exploración dinámica del grafo añadiendo las conexiones
    de un nodo específico sin reconstruir todo el grafo desde cero.
    
    Args:
        graph_data: Estructura actual del grafo
        node_id: Identificador del nodo que se desea expandir
        depth: Profundidad de la expansión (1-3)
    
    Returns:
        GraphData: Grafo expandido con nuevos nodos y aristas
    
    Raises:
        HTTPException:
            - 400: Si el nodo no existe en el grafo actual
            - 500: Si hay error interno del servidor
    
    Example:
        POST /api/explore/expand
        Body:
        {
            "graph_data": { ... },
            "node_id": "Theory_of_relativity", 
            "depth": 1
        }
    """
    
    try:
        logger.info(f"Expandiendo nodo: '{node_id}', profundidad={depth}")
        
        # Expandir el nodo
        expanded_graph = await graph_service.expand_node(
            current_graph=graph_data,
            node_to_expand=node_id,
            depth=depth
        )
        
        logger.info(f"Nodo expandido exitosamente: {expanded_graph.total_nodes} nodos totales")
        return expanded_graph
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error expandiendo nodo '{node_id}': {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor expandiendo el nodo"
        )

@router.post("/path", response_model=PathFindingResponse)
async def find_shortest_path(
    request: PathFindingRequest
) -> PathFindingResponse:
    """
    Encuentra el camino más corto entre dos artículos de Wikipedia
    
    Utiliza el algoritmo BFS (Breadth-First Search) para encontrar
    la secuencia más corta de enlaces entre dos artículos.
    
    Args:
        request: Datos de la solicitud con artículos origen y destino
    
    Returns:
        PathFindingResponse: Camino encontrado con metadatos de búsqueda
    
    Raises:
        HTTPException:
            - 404: Si alguno de los artículos no existe
            - 500: Si hay error interno del servidor
    
    Example:
        POST /api/path
        Body:
        {
            "from_article": "Albert Einstein",
            "to_article": "Quantum mechanics",
            "max_depth": 6
        }
        
        Response:
        {
            "path_found": true,
            "path_length": 3,
            "path": [
                {
                    "article_title": "Albert Einstein",
                    "url": "https://en.wikipedia.org/wiki/Albert_Einstein",
                    "step": 0
                },
                {
                    "article_title": "Photoelectric effect", 
                    "url": "https://en.wikipedia.org/wiki/Photoelectric_effect",
                    "step": 1
                },
                {
                    "article_title": "Quantum mechanics",
                    "url": "https://en.wikipedia.org/wiki/Quantum_mechanics", 
                    "step": 2
                }
            ],
            "exploration_time": 1.23,
            "articles_explored": 45
        }
    """
    
    try:
        start_time = time.time()
        logger.info(f"Buscando camino de '{request.from_article}' a '{request.to_article}'")
        
        # Validar que ambos artículos existen
        from_article_data = await wikipedia_service._get_article_summary(request.from_article)
        to_article_data = await wikipedia_service._get_article_summary(request.to_article)
        
        if not from_article_data:
            raise HTTPException(
                status_code=404,
                detail=f"Artículo origen '{request.from_article}' no encontrado"
            )
        
        if not to_article_data:
            raise HTTPException(
                status_code=404,
                detail=f"Artículo destino '{request.to_article}' no encontrado"
            )
        
        # Buscar el camino más corto
        path = await graph_service.find_shortest_path(
            from_article=request.from_article,
            to_article=request.to_article,
            max_depth=request.max_depth
        )
        
        exploration_time = time.time() - start_time
        
        if path:
            # Construir nodos del camino con URLs
            path_nodes = []
            for i, article_title in enumerate(path):
                article_data = await wikipedia_service._get_article_summary(article_title)
                if article_data:
                    path_node = PathNode(
                        article_title=article_title,
                        url=article_data["url"],
                        step=i
                    )
                    path_nodes.append(path_node)
            
            response = PathFindingResponse(
                path_found=True,
                path_length=len(path),
                path=path_nodes,
                exploration_time=round(exploration_time, 2),
                articles_explored=len(path)  # Simplificado, se podría mejorar con contador real
            )
            
            logger.info(f"Camino encontrado: {len(path)} pasos en {exploration_time:.2f}s")
        else:
            response = PathFindingResponse(
                path_found=False,
                path_length=0,
                path=[],
                exploration_time=round(exploration_time, 2),
                articles_explored=0
            )
            
            logger.info(f"No se encontró camino en {exploration_time:.2f}s")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error buscando camino: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor buscando el camino"
        )

@router.get("/graph/metrics/{article_title}")
async def get_graph_metrics(
    article_title: str = Path(..., description="Título del artículo raíz"),
    depth: int = Query(1, ge=1, le=3, description="Profundidad del grafo a analizar")
) -> Dict[str, Any]:
    """
    Obtiene métricas estadísticas de un grafo específico
    
    Calcula y retorna diversas métricas del grafo como densidad,
    distribución de grados, centralidad, etc.
    
    Args:
        article_title: Artículo raíz del grafo a analizar
        depth: Profundidad del grafo
    
    Returns:
        Dict[str, Any]: Métricas estadísticas del grafo
    
    Example:
        GET /api/graph/metrics/Albert Einstein?depth=3
        
        Response:
        {
            "total_nodes": 50,
            "total_edges": 125,
            "density": 0.0510,
            "average_degree": 5.0,
            "max_degree": 15,
            "max_depth": 3,
            "depth_distribution": {
                "0": 1,
                "1": 20,
                "2": 29
            },
            "nodes_by_centrality": [
                ["Albert_Einstein", 0.95],
                ["Theory_of_relativity", 0.73]
            ]
        }
    """
    
    try:
        logger.info(f"Calculando métricas para: '{article_title}', profundidad={depth}")
        
        # Construir el grafo
        graph_data = await graph_service.explore_graph(
            root_article=article_title,
            depth=depth
        )
        
        # Calcular métricas
        metrics = graph_service.calculate_graph_metrics(graph_data)
        
        logger.info(f"Métricas calculadas para {graph_data.total_nodes} nodos")
        return metrics
        
    except Exception as e:
        logger.error(f"Error calculando métricas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor calculando métricas"
        )
