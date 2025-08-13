"""
Servicio para interactuar con la API de Wikipedia

Este módulo maneja todas las operaciones relacionadas con la obtención
de datos de Wikipedia, incluyendo búsqueda de artículos y extracción de enlaces.
"""

import httpx
import asyncio
import re
from typing import List, Dict, Any, Optional, Tuple
from urllib.parse import unquote, quote
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

class WikipediaService:
    """
    Servicio para interactuar con la API de Wikipedia
    
    Maneja búsquedas, obtención de contenido y extracción de enlaces
    de artículos de Wikipedia usando la API oficial.
    """
    
    def __init__(self):
        self.base_url = "https://en.wikipedia.org/api/rest_v1"
        self.api_url = "https://en.wikipedia.org/w/api.php"
        self.timeout = 5.0
        
        # Headers para identificar nuestra aplicación
        self.headers = {
            "User-Agent": "Wikipedia-Graph-Explorer/1.0 (Educational Purpose)",
            "Accept": "application/json"
        }
        
        # Caché en memoria para mejorar rendimiento
        self._search_cache = {}
        self._article_cache = {}
        self._cache_max_size = 1000
    
    async def search_articles(self, 
                            query: str, 
                            limit: int = 10) -> List[Dict[str, Any]]:
        """
        Busca artículos en Wikipedia basado en un término de búsqueda
        
        Args:
            query: Término de búsqueda
            limit: Número máximo de resultados a retornar
            
        Returns:
            Lista de diccionarios con información de artículos encontrados
        """
        # Verificar caché primero
        cache_key = f"{query}:{limit}"
        if cache_key in self._search_cache:
            return self._search_cache[cache_key]
        
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True
            ) as client:
                # Parámetros para la búsqueda
                params = {
                    "action": "query",
                    "format": "json",
                    "list": "search",
                    "srsearch": query,
                    "srlimit": limit,
                    "srprop": "snippet|titlesnippet|size|wordcount",
                    "srenablerewrites": "true"
                }
                
                response = await client.get(
                    self.api_url,
                    params=params,
                    headers=self.headers
                )
                response.raise_for_status()
                
                data = response.json()
                search_results = data.get("query", {}).get("search", [])
                
                # Procesar resultados de forma rápida (solo títulos y datos básicos)
                articles = []
                for result in search_results:
                    article = {
                        "title": result.get("title", ""),
                        "summary": "", # No obtener resumen para búsqueda rápida
                        "url": f"https://en.wikipedia.org/wiki/{quote(result.get('title', '').replace(' ', '_'))}",
                        "page_id": result.get("pageid"),
                        "word_count": result.get("wordcount", 0),
                        "size": result.get("size", 0)
                    }
                    articles.append(article)
                
                # Guardar en caché
                if len(self._search_cache) < self._cache_max_size:
                    self._search_cache[cache_key] = articles
                
                return articles
                
        except httpx.RequestError as e:
            logger.error(f"Error en solicitud de búsqueda: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error inesperado en búsqueda: {str(e)}")
            raise
    
    async def _get_article_summary(self, title: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene el resumen de un artículo específico
        
        Args:
            title: Título del artículo
            
        Returns:
            Diccionario con información del artículo o None si no se encuentra
        """
        try:
            # Limpiar el título para la URL
            clean_title = quote(title.replace(" ", "_"))
            
            # Configurar cliente con seguimiento de redirecciones
            async with httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True
            ) as client:
                # Obtener resumen del artículo
                summary_url = f"{self.base_url}/page/summary/{clean_title}"
                
                response = await client.get(summary_url, headers=self.headers)
                
                if response.status_code == 404:
                    logger.warning(f"Artículo no encontrado: {title}")
                    return None
                
                response.raise_for_status()
                summary_data = response.json()
                
                # Obtener ID de la página e imagen en paralelo
                page_id_task = self._get_page_id(title)
                image_task = self.get_article_image(title)
                
                page_id, image_url = await asyncio.gather(page_id_task, image_task)
                
                return {
                    "title": summary_data.get("title", title),
                    "summary": summary_data.get("extract", ""),
                    "url": summary_data.get("content_urls", {}).get("desktop", {}).get("page", ""),
                    "page_id": page_id,
                    "image_url": image_url
                }
                
        except httpx.RequestError as e:
            logger.error(f"Error obteniendo resumen de {title}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error inesperado obteniendo resumen de {title}: {str(e)}")
            return None
    
    async def _get_page_id(self, title: str) -> Optional[int]:
        """
        Obtiene el ID de página de Wikipedia para un artículo
        
        Args:
            title: Título del artículo
            
        Returns:
            ID de la página o None si no se encuentra
        """
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True
            ) as client:
                params = {
                    "action": "query",
                    "format": "json",
                    "titles": title,
                    "prop": "pageprops"
                }
                
                response = await client.get(
                    self.api_url,
                    params=params,
                    headers=self.headers
                )
                response.raise_for_status()
                
                data = response.json()
                pages = data.get("query", {}).get("pages", {})
                
                for page_id, page_data in pages.items():
                    if page_id != "-1":  # -1 indica página no encontrada
                        return int(page_id)
                
                return None
                
        except Exception:
            return None
    
    async def get_article_links(self, 
                              title: str, 
                              max_links: int = 50) -> List[str]:
        """
        Extrae enlaces de un artículo de Wikipedia
        
        Args:
            title: Título del artículo
            max_links: Número máximo de enlaces a extraer
            
        Returns:
            Lista de títulos de artículos enlazados
        """
        try:
            # Configurar cliente con seguimiento de redirecciones
            async with httpx.AsyncClient(
                timeout=self.timeout,
                follow_redirects=True
            ) as client:
                # Obtener contenido HTML del artículo
                clean_title = quote(title.replace(" ", "_"))
                content_url = f"{self.base_url}/page/html/{clean_title}"
                
                response = await client.get(content_url, headers=self.headers)
                
                if response.status_code == 404:
                    logger.warning(f"Artículo no encontrado para enlaces: {title}")
                    return []
                
                response.raise_for_status()
                html_content = response.text
                
                # Extraer enlaces usando BeautifulSoup
                links = self._extract_wikipedia_links(html_content, max_links)
                
                logger.info(f"Enlaces extraídos de {title}: {len(links)} encontrados")
                
                return links
                
        except httpx.RequestError as e:
            logger.error(f"Error obteniendo enlaces de {title}: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Error inesperado obteniendo enlaces de {title}: {str(e)}")
            return []
    
    def _extract_wikipedia_links(self, 
                               html_content: str, 
                               max_links: int) -> List[str]:
        """
        Extrae enlaces a otros artículos de Wikipedia del HTML
        
        Args:
            html_content: Contenido HTML del artículo
            max_links: Número máximo de enlaces a extraer
            
        Returns:
            Lista de títulos de artículos enlazados
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            links = set()
            
            # Buscar enlaces específicos de Wikipedia con rel="mw:WikiLink"
            for link in soup.find_all('a', href=True):
                href = link.get('href', '')
                rel = link.get('rel', [])
                
                # Priorizar enlaces con rel="mw:WikiLink" (enlaces internos de Wikipedia)
                if isinstance(rel, list) and 'mw:WikiLink' in rel:
                    if self._is_valid_wikipedia_link(href):
                        article_title = self._extract_title_from_href(href)
                        if article_title and len(links) < max_links:
                            links.add(article_title)
                
                # Si no hemos encontrado suficientes enlaces, buscar otros enlaces válidos
                elif len(links) < max_links and self._is_valid_wikipedia_link(href):
                    article_title = self._extract_title_from_href(href)
                    if article_title and len(links) < max_links:
                        links.add(article_title)
                
                if len(links) >= max_links:
                    break
            
            result = list(links)
            logger.debug(f"Enlaces encontrados: {len(result)} - Primeros 5: {result[:5]}")
            return result
            
        except Exception as e:
            logger.error(f"Error extrayendo enlaces del HTML: {str(e)}")
            return []
    
    def _is_valid_wikipedia_link(self, href: str) -> bool:
        """
        Valida si un enlace es a un artículo válido de Wikipedia
        
        Args:
            href: URL del enlace
            
        Returns:
            True si es un enlace válido a artículo de Wikipedia
        """
        if not href:
            return False
        
        # Patrones a excluir
        exclude_patterns = [
            r'^#',  # Enlaces internos (anchors)
            r'File:',  # Archivos
            r'Category:',  # Categorías
            r'Template:',  # Plantillas
            r'Help:',  # Páginas de ayuda
            r'Special:',  # Páginas especiales
            r'Talk:',  # Páginas de discusión
            r'User:',  # Páginas de usuario
            r'Wikipedia:',  # Páginas del proyecto Wikipedia
            r'^https?://',  # Enlaces externos
            r'edit',  # Enlaces de edición
            r'action=',  # Acciones de la wiki
        ]
        
        # Verificar si debe excluirse
        for pattern in exclude_patterns:
            if re.search(pattern, href, re.IGNORECASE):
                return False
        
        # Verificar si es un enlace a artículo válido (formato ./Article_Name o /wiki/Article_Name)
        return (href.startswith('./') or href.startswith('/wiki/')) and ':' not in href.split('/')[-1]
    
    def _extract_title_from_href(self, href: str) -> Optional[str]:
        """
        Extrae el título del artículo de una URL de Wikipedia
        
        Args:
            href: URL del enlace
            
        Returns:
            Título del artículo o None si no es válido
        """
        try:
            title_part = None
            
            if href.startswith('./'):
                # Formato nuevo: ./Article_Name
                title_part = href[2:]  # Remover './'
            elif href.startswith('/wiki/'):
                # Formato antiguo: /wiki/Article_Name
                title_part = href.split('/wiki/')[-1]
            
            if not title_part:
                return None
            
            # Remover parámetros de consulta si existen
            title_part = title_part.split('?')[0].split('#')[0]
            
            # Decodificar URL encoding y reemplazar guiones bajos con espacios
            title = unquote(title_part).replace('_', ' ')
            
            # Filtrar títulos muy cortos o que contengan caracteres especiales
            if len(title) < 2 or title.startswith('List of'):
                return None
            
            return title
            
        except Exception:
            return None
    
    async def get_article_content(self, title: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene contenido completo de un artículo
        
        Args:
            title: Título del artículo
            
        Returns:
            Diccionario con información completa del artículo
        """
        # Verificar caché primero
        if title in self._article_cache:
            return self._article_cache[title]
        
        try:
            # Obtener resumen y enlaces en paralelo
            summary_task = self._get_article_summary(title)
            links_task = self.get_article_links(title)
            
            summary, links = await asyncio.gather(summary_task, links_task)
            
            if not summary:
                logger.warning(f"No se pudo obtener resumen para {title}")
                return None
            
            # Combinar información
            summary["links"] = links
            summary["link_count"] = len(links)
            
            logger.info(f"Contenido obtenido para {title}: {len(links)} enlaces encontrados")
            
            # Guardar en caché
            if len(self._article_cache) < self._cache_max_size:
                self._article_cache[title] = summary
            
            return summary
            
        except Exception as e:
            logger.error(f"Error obteniendo contenido completo de {title}: {str(e)}")
            return None

    async def get_article_image(self, title: str) -> Optional[str]:
        """
        Obtiene la imagen principal de un artículo de Wikipedia
        
        Args:
            title: Título del artículo
            
        Returns:
            URL de la imagen principal o None si no se encuentra
        """
        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
                headers=self.headers,
                follow_redirects=True
            ) as client:
                # Usar la API de Wikipedia para obtener información de la página incluyendo imagen
                params = {
                    "action": "query",
                    "format": "json",
                    "titles": title,
                    "prop": "pageimages|pageid",
                    "pithumbsize": 300,  # Tamaño del thumbnail
                    "pilimit": 1,
                    "redirects": 1
                }
                
                response = await client.get(self.api_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if "query" not in data or "pages" not in data["query"]:
                    logger.warning(f"No se encontraron páginas para {title}")
                    return None
                
                pages = data["query"]["pages"]
                page_data = next(iter(pages.values()))
                
                # Verificar si tiene imagen
                if "thumbnail" in page_data:
                    image_url = page_data["thumbnail"]["source"]
                    logger.info(f"Imagen encontrada para {title}: {image_url}")
                    return image_url
                elif "pageimage" in page_data:
                    # Si no hay thumbnail, intentar obtener la imagen original
                    image_filename = page_data["pageimage"]
                    image_url = f"https://en.wikipedia.org/wiki/Special:FilePath/{image_filename}"
                    logger.info(f"Imagen alternativa encontrada para {title}: {image_url}")
                    return image_url
                else:
                    logger.info(f"No se encontró imagen para {title}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error obteniendo imagen de {title}: {str(e)}")
            return None
    
    async def get_multiple_articles_content(self, article_titles: List[str]) -> Dict[str, Optional[Dict]]:
        """
        Obtiene el contenido de múltiples artículos en paralelo.
        
        Args:
            article_titles: Lista de títulos de artículos
            
        Returns:
            Diccionario con título como clave y datos del artículo como valor
        """
        # Crear tareas para todos los artículos
        tasks = [
            self.get_article_content(title) 
            for title in article_titles
        ]
        
        # Ejecutar todas las tareas en paralelo
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Crear diccionario de resultados
        article_data = {}
        for title, result in zip(article_titles, results):
            if isinstance(result, Exception):
                logger.warning(f"Error obteniendo datos para {title}: {result}")
                article_data[title] = None
            else:
                article_data[title] = result
                
        return article_data

# Instancia global del servicio
wikipedia_service = WikipediaService()
