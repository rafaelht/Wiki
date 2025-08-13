"""
Router para endpoints de búsqueda de artículos

Maneja la búsqueda de artículos de Wikipedia basada en términos de consulta.
"""

from fastapi import APIRouter, Query, Path, HTTPException, Depends
from typing import List, Optional
import logging

from app.models.responses import SearchResponse, WikipediaArticle
from app.services.wikipedia_service import wikipedia_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/search", response_model=SearchResponse)
async def search_articles(
    term: str = Query(..., min_length=1, max_length=100, description="Término de búsqueda"),
    limit: int = Query(10, ge=1, le=50, description="Número máximo de resultados")
) -> SearchResponse:
    """
    Busca artículos en Wikipedia basado en un término de consulta
    
    Este endpoint permite a los usuarios buscar artículos de Wikipedia
    que coincidan con un término específico. Utiliza la API de búsqueda
    de Wikipedia para encontrar artículos relevantes.
    
    Args:
        term: Término de búsqueda (requerido, 1-100 caracteres)
        limit: Número máximo de resultados a retornar (1-50, por defecto 10)
    
    Returns:
        SearchResponse: Lista de artículos encontrados con metadatos
    
    Raises:
        HTTPException: 
            - 400: Si el término de búsqueda es inválido
            - 500: Si hay error interno del servidor
    
    Example:
        GET /api/search?term=Albert Einstein&limit=5
        
        Response:
        {
            "results": [
                {
                    "title": "Albert Einstein",
                    "summary": "Físico teórico alemán...",
                    "url": "https://en.wikipedia.org/wiki/Albert_Einstein",
                    "page_id": 736
                }
            ],
            "total_count": 1,
            "search_term": "Albert Einstein"
        }
    """
    
    try:
        logger.info(f"Búsqueda iniciada: término='{term}', límite={limit}")
        
        # Validar término de búsqueda
        term = term.strip()
        if not term:
            raise HTTPException(
                status_code=400,
                detail="El término de búsqueda no puede estar vacío"
            )
        
        # Realizar búsqueda
        articles_data = await wikipedia_service.search_articles(term, limit)
        
        # Convertir a modelo de respuesta
        articles = []
        for article_data in articles_data:
            try:
                article = WikipediaArticle(
                    title=article_data["title"],
                    summary=article_data.get("summary", ""),
                    url=article_data["url"],
                    page_id=article_data.get("page_id")
                )
                articles.append(article)
            except Exception as e:
                logger.warning(f"Error procesando artículo {article_data.get('title', 'unknown')}: {str(e)}")
                continue
        
        response = SearchResponse(
            results=articles,
            total_count=len(articles),
            search_term=term
        )
        
        logger.info(f"Búsqueda completada: {len(articles)} resultados encontrados")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inesperado en búsqueda: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor durante la búsqueda"
        )

@router.get("/search/suggestions")
async def get_search_suggestions(
    term: str = Query(..., min_length=1, max_length=50, description="Término parcial para sugerencias"),
    limit: int = Query(5, ge=1, le=20, description="Número máximo de sugerencias")
) -> List[str]:
    """
    Obtiene sugerencias de búsqueda para autocompletado
    
    Este endpoint proporciona sugerencias rápidas de títulos de artículos
    para implementar funcionalidad de autocompletado en el frontend.
    
    Args:
        term: Término parcial para generar sugerencias
        limit: Número máximo de sugerencias (1-20, por defecto 5)
    
    Returns:
        List[str]: Lista de títulos de artículos sugeridos
    
    Example:
        GET /api/search/suggestions?term=Albert&limit=5
        
        Response:
        [
            "Albert Einstein",
            "Albert Camus", 
            "Albert Schweitzer",
            "Alberta",
            "Albert II of Belgium"
        ]
    """
    
    try:
        logger.info(f"Solicitando sugerencias para: '{term}'")
        
        # Validar término
        term = term.strip()
        if not term:
            return []
        
        # Obtener artículos y extraer solo títulos
        articles_data = await wikipedia_service.search_articles(term, limit)
        suggestions = [article["title"] for article in articles_data if "title" in article]
        
        logger.info(f"Sugerencias generadas: {len(suggestions)} resultados")
        return suggestions
        
    except Exception as e:
        logger.error(f"Error generando sugerencias: {str(e)}")
        # Retornar lista vacía en caso de error para no romper la UI
        return []

@router.get("/article/{title}")
async def get_article_details(
    title: str = Path(..., description="Título exacto del artículo")
) -> WikipediaArticle:
    """
    Obtiene detalles completos de un artículo específico
    
    Este endpoint retorna información detallada de un artículo de Wikipedia
    basado en su título exacto.
    
    Args:
        title: Título exacto del artículo de Wikipedia
    
    Returns:
        WikipediaArticle: Información completa del artículo
    
    Raises:
        HTTPException:
            - 404: Si el artículo no se encuentra
            - 500: Si hay error interno del servidor
    
    Example:
        GET /api/article/Albert Einstein
        
        Response:
        {
            "title": "Albert Einstein",
            "summary": "Físico teórico alemán desarrolló la teoría...",
            "url": "https://en.wikipedia.org/wiki/Albert_Einstein",
            "page_id": 736
        }
    """
    
    try:
        logger.info(f"Obteniendo detalles del artículo: '{title}'")
        
        # Obtener datos del artículo
        article_data = await wikipedia_service._get_article_summary(title)
        
        if not article_data:
            raise HTTPException(
                status_code=404,
                detail=f"Artículo '{title}' no encontrado"
            )
        
        # Convertir a modelo de respuesta
        article = WikipediaArticle(
            title=article_data["title"],
            summary=article_data.get("summary", ""),
            url=article_data["url"],
            page_id=article_data.get("page_id")
        )
        
        logger.info(f"Detalles del artículo obtenidos exitosamente: {title}")
        return article
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo detalles del artículo '{title}': {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor obteniendo detalles del artículo"
        )
