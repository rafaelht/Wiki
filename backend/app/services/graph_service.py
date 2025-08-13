"""
Servicio para construcción y análisis de grafos de conocimiento

Este módulo maneja la lógica de construcción del grafo a partir de artículos
de Wikipedia, incluyendo exploración por profundidad y análisis de métricas.
"""

import asyncio
import time
from typing import Dict, List, Set, Tuple, Optional, Any
from collections import deque, defaultdict
import logging

from app.services.wikipedia_service import wikipedia_service
from app.models.responses import GraphNode, GraphEdge, GraphData

logger = logging.getLogger(__name__)

class GraphService:
    """
    Servicio para construcción y análisis de grafos de conocimiento
    
    Maneja la exploración de Wikipedia como un grafo dirigido,
    donde los artículos son nodos y los enlaces son aristas.
    """
    
    def __init__(self):
        self.max_nodes_per_depth = 5  # Límite más agresivo para velocidad inicial
        self.max_total_nodes = 30     # Límite inicial más bajo para rapidez
        self._node_cache = {}         # Caché en memoria para nodos ya procesados
    
    async def explore_graph(self, 
                          root_article: str, 
                          depth: int = 1,
                          max_nodes: Optional[int] = None) -> GraphData:
        """
        Explora el grafo de conocimiento desde un artículo raíz
        
        Args:
            root_article: Título del artículo raíz
            depth: Profundidad máxima de exploración
            max_nodes: Límite máximo de nodos (opcional)
            
        Returns:
            GraphData: Estructura completa del grafo explorado
        """
        start_time = time.time()
        
        # Configurar límites
        if max_nodes:
            self.max_total_nodes = min(max_nodes, 200)  # Límite absoluto de 200
        
        # Estructuras para el grafo
        nodes: Dict[str, GraphNode] = {}
        edges: List[GraphEdge] = []
        visited: Set[str] = set()
        
        # Cola para exploración por breadth-first search (BFS)
        exploration_queue = deque([(root_article, 0)])  # (título, profundidad)
        
        try:
            while exploration_queue and len(nodes) < self.max_total_nodes:
                # Procesar artículos por lotes más grandes para mejorar rendimiento
                batch_size = min(15, len(exploration_queue))  # Aumentado de 10 a 15
                current_batch = []
                
                # Extraer lote de artículos de la cola
                for _ in range(batch_size):
                    if not exploration_queue or len(nodes) >= self.max_total_nodes:
                        break
                    
                    current_article, current_depth = exploration_queue.popleft()
                    
                    # Verificar límites de profundidad
                    if current_depth > depth:
                        continue
                    
                    # Evitar procesar el mismo artículo múltiples veces
                    if current_article in visited:
                        continue
                    
                    # Verificar caché antes de procesar
                    if current_article in self._node_cache:
                        nodes[current_article] = self._node_cache[current_article]
                        visited.add(current_article)
                        logger.debug(f"Usando caché para: {current_article}")
                        continue
                    
                    visited.add(current_article)
                    current_batch.append((current_article, current_depth))
                
                if not current_batch:
                    continue
                
                # Obtener datos de todos los artículos del lote en paralelo
                article_titles = [article for article, _ in current_batch]
                articles_data = await wikipedia_service.get_multiple_articles_content(article_titles)
                
                # Procesar cada artículo del lote
                for current_article, current_depth in current_batch:
                    article_data = articles_data.get(current_article)
                    
                    if not article_data:
                        logger.warning(f"No se pudo obtener datos para: {current_article}")
                        continue
                    
                    # Crear nodo
                    node = GraphNode(
                        id=current_article,
                        label=article_data["title"],
                        summary=article_data.get("summary", ""),
                        url=article_data["url"],
                        page_id=article_data.get("page_id"),
                        depth=current_depth,
                        image_url=article_data.get("image_url")
                    )
                    nodes[current_article] = node
                    
                    # Guardar en caché para futuros usos
                    self._node_cache[current_article] = node
                    
                    # Procesar enlaces si no hemos alcanzado la profundidad máxima
                    if current_depth + 1 <= depth and len(nodes) < self.max_total_nodes:
                        links = article_data.get("links", [])
                        
                        # Límite más agresivo de enlaces por nodo para mejor rendimiento
                        max_links = max(3, self.max_nodes_per_depth - 2)
                        links = links[:max_links]
                        
                        for linked_article in links:
                            # Crear arista
                            edge = GraphEdge(
                                from_node=current_article,
                                to_node=linked_article,
                                weight=1.0
                            )
                            edges.append(edge)
                            
                            # Añadir a la cola para exploración si no ha sido visitado
                            if (linked_article not in visited and 
                                len(nodes) < self.max_total_nodes):
                                exploration_queue.append((linked_article, current_depth + 1))
            
            # Calcular métricas de centralidad
            await self._calculate_centrality(nodes, edges)
            
            # Construir respuesta
            graph_data = GraphData(
                nodes=list(nodes.values()),
                edges=edges,
                root_node=root_article,
                total_nodes=len(nodes),
                total_edges=len(edges),
                max_depth=depth
            )
            
            exploration_time = time.time() - start_time
            logger.info(f"Exploración completada en {exploration_time:.2f}s: "
                       f"{len(nodes)} nodos, {len(edges)} aristas")
            
            return graph_data
            
        except Exception as e:
            logger.error(f"Error durante exploración del grafo: {str(e)}")
            raise
    
    async def _calculate_centrality(self, 
                                  nodes: Dict[str, GraphNode], 
                                  edges: List[GraphEdge]) -> None:
        """
        Calcula métricas de centralidad para los nodos del grafo
        
        Args:
            nodes: Diccionario de nodos del grafo
            edges: Lista de aristas del grafo
        """
        try:
            # Calcular grado de centralidad (número de conexiones)
            in_degree = defaultdict(int)
            out_degree = defaultdict(int)
            
            # Contar conexiones entrantes y salientes
            for edge in edges:
                out_degree[edge.from_node] += 1
                in_degree[edge.to_node] += 1
            
            # Asignar centralidad a cada nodo
            max_degree = max(
                max(in_degree.values(), default=0),
                max(out_degree.values(), default=0)
            )
            
            for node_id, node in nodes.items():
                total_degree = in_degree[node_id] + out_degree[node_id]
                # Normalizar centralidad entre 0 y 1
                node.centrality = total_degree / max_degree if max_degree > 0 else 0
                
        except Exception as e:
            logger.warning(f"Error calculando centralidad: {str(e)}")
            # Asignar centralidad por defecto
            for node in nodes.values():
                node.centrality = 0.5
    
    async def expand_node(self, 
                         current_graph: GraphData, 
                         node_to_expand: str,
                         depth: int = 1) -> GraphData:
        """
        Expande un nodo específico en un grafo existente
        
        Args:
            current_graph: Grafo actual
            node_to_expand: ID del nodo a expandir
            depth: Profundidad de expansión
            
        Returns:
            GraphData: Grafo expandido con nuevos nodos y aristas
        """
        try:
            # Verificar que el nodo existe en el grafo actual
            existing_node = None
            for node in current_graph.nodes:
                if node.id == node_to_expand:
                    existing_node = node
                    break
            
            if not existing_node:
                raise ValueError(f"Nodo {node_to_expand} no encontrado en el grafo")
            
            # Obtener nodos y aristas existentes
            existing_nodes = {node.id: node for node in current_graph.nodes}
            existing_edges = list(current_graph.edges)
            
            # Obtener enlaces del nodo a expandir
            article_data = await wikipedia_service.get_article_content(node_to_expand)
            
            if not article_data:
                logger.warning(f"No se pudieron obtener datos para expandir: {node_to_expand}")
                return current_graph
            
            new_nodes = {}
            new_edges = []
            
            links = article_data.get("links", [])[:self.max_nodes_per_depth]
            
            # Procesar cada enlace
            for linked_article in links:
                # Crear arista si no existe
                edge_exists = any(
                    edge.from_node == node_to_expand and edge.to_node == linked_article
                    for edge in existing_edges
                )
                
                if not edge_exists:
                    new_edge = GraphEdge(
                        from_node=node_to_expand,
                        to_node=linked_article,
                        weight=1.0
                    )
                    new_edges.append(new_edge)
                
                # Crear nodo si no existe
                if (linked_article not in existing_nodes and 
                    linked_article not in new_nodes):
                    
                    linked_data = await wikipedia_service._get_article_summary(linked_article)
                    if linked_data:
                        new_node = GraphNode(
                            id=linked_article,
                            label=linked_data["title"],
                            summary=linked_data.get("summary", ""),
                            url=linked_data["url"],
                            page_id=linked_data.get("page_id"),
                            depth=existing_node.depth + 1,
                            image_url=linked_data.get("image_url")
                        )
                        new_nodes[linked_article] = new_node
            
            # Combinar nodos y aristas
            all_nodes = list(existing_nodes.values()) + list(new_nodes.values())
            all_edges = existing_edges + new_edges
            
            # Recalcular centralidad
            nodes_dict = {node.id: node for node in all_nodes}
            await self._calculate_centrality(nodes_dict, all_edges)
            
            # Construir grafo expandido
            expanded_graph = GraphData(
                nodes=list(nodes_dict.values()),
                edges=all_edges,
                root_node=current_graph.root_node,
                total_nodes=len(nodes_dict),
                total_edges=len(all_edges),
                max_depth=max(node.depth for node in nodes_dict.values())
            )
            
            logger.info(f"Nodo {node_to_expand} expandido: "
                       f"+{len(new_nodes)} nodos, +{len(new_edges)} aristas")
            
            return expanded_graph
            
        except Exception as e:
            logger.error(f"Error expandiendo nodo {node_to_expand}: {str(e)}")
            raise
    
    async def find_shortest_path(self, 
                               from_article: str, 
                               to_article: str,
                               max_depth: int = 6) -> Optional[List[str]]:
        """
        Encuentra el camino más corto entre dos artículos usando BFS
        
        Args:
            from_article: Artículo de origen
            to_article: Artículo de destino
            max_depth: Profundidad máxima de búsqueda
            
        Returns:
            Lista con el camino más corto o None si no se encuentra
        """
        try:
            # BFS para encontrar el camino más corto
            queue = deque([(from_article, [from_article])])
            visited = {from_article}
            
            while queue:
                current_article, path = queue.popleft()
                
                # Verificar profundidad máxima
                if len(path) > max_depth:
                    continue
                
                # Verificar si llegamos al destino
                if current_article == to_article:
                    return path
                
                # Obtener enlaces del artículo actual
                article_data = await wikipedia_service.get_article_content(current_article)
                
                if not article_data:
                    continue
                
                links = article_data.get("links", [])
                
                # Explorar enlaces
                for linked_article in links:
                    if linked_article not in visited:
                        visited.add(linked_article)
                        new_path = path + [linked_article]
                        queue.append((linked_article, new_path))
            
            return None  # No se encontró camino
            
        except Exception as e:
            logger.error(f"Error buscando camino de {from_article} a {to_article}: {str(e)}")
            return None
    
    def calculate_graph_metrics(self, graph_data: GraphData) -> Dict[str, Any]:
        """
        Calcula métricas estadísticas del grafo
        
        Args:
            graph_data: Datos del grafo
            
        Returns:
            Diccionario con métricas del grafo
        """
        try:
            nodes = graph_data.nodes
            edges = graph_data.edges
            
            # Métricas básicas
            total_nodes = len(nodes)
            total_edges = len(edges)
            
            # Densidad del grafo
            max_possible_edges = total_nodes * (total_nodes - 1)
            density = (total_edges / max_possible_edges) if max_possible_edges > 0 else 0
            
            # Distribución de grados
            in_degrees = defaultdict(int)
            out_degrees = defaultdict(int)
            
            for edge in edges:
                out_degrees[edge.from_node] += 1
                in_degrees[edge.to_node] += 1
            
            # Estadísticas de grado
            all_degrees = list(in_degrees.values()) + list(out_degrees.values())
            avg_degree = sum(all_degrees) / len(all_degrees) if all_degrees else 0
            max_degree = max(all_degrees) if all_degrees else 0
            
            # Distribución por profundidad
            depth_distribution = defaultdict(int)
            for node in nodes:
                depth_distribution[node.depth] += 1
            
            return {
                "total_nodes": total_nodes,
                "total_edges": total_edges,
                "density": round(density, 4),
                "average_degree": round(avg_degree, 2),
                "max_degree": max_degree,
                "max_depth": graph_data.max_depth,
                "depth_distribution": dict(depth_distribution),
                "nodes_by_centrality": sorted(
                    [(node.id, node.centrality or 0) for node in nodes],
                    key=lambda x: x[1],
                    reverse=True
                )[:10]  # Top 10 nodos por centralidad
            }
            
        except Exception as e:
            logger.error(f"Error calculando métricas del grafo: {str(e)}")
            return {}

# Instancia global del servicio
graph_service = GraphService()
