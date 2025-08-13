/**
 * Tipos TypeScript para el Wikipedia Graph Explorer
 * 
 * Define todas las interfaces y tipos utilizados en la aplicación
 * para garantizar type safety y mejor experiencia de desarrollo.
 */

// Tipos base para artículos de Wikipedia
export interface WikipediaArticle {
  title: string;
  summary?: string;
  url: string;
  page_id?: number;
  image_url?: string;
}

export interface SearchResponse {
  results: WikipediaArticle[];
  total_count: number;
  search_term: string;
}

// Tipos para el grafo de conocimiento
export interface GraphNode {
  id: string;
  label: string;
  summary?: string;
  url: string;
  page_id?: number;
  depth: number;
  centrality?: number;
  image_url?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
  edge_type?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  root_node: string;
  total_nodes: number;
  total_edges: number;
  max_depth: number;
}

// API Response Types
export interface SearchResult {
  pageid: number;
  title: string;
  snippet?: string;
  wordcount?: number;
  size?: number;
  timestamp?: string;
}

export interface WikipediaSearchResponse {
  results: SearchResult[];
  total: number;
}

// Graph Types
export interface GraphNode {
  id: string;
  label: string;
  summary?: string;
  url: string;
  page_id?: number;
  depth: number;
  centrality?: number;
  color?: string;
  size?: number;
  shape?: string;
  borderWidth?: number;
  font?: {
    size: number;
    color: string;
  };
}

export interface GraphEdge {
  from_node: string;
  to_node: string;
  weight: number;
  edge_type?: string;
  // Properties for visualization
  id?: string;
  from?: string;
  to?: string;
  arrows?: string;
  color?: string;
  width?: number;
  label?: string;
  smooth?: boolean | object;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  root_node: string;
  total_nodes: number;
  total_edges: number;
  max_depth: number;
}

export interface ExploreResponse {
  graph_data: GraphData;
  exploration_time: number;
  articles_processed: number;
}

export interface ExpandResponse {
  addedNodes: GraphNode[];
  addedEdges: GraphEdge[];
  targetNode: string;
  newConnections: number;
  message: string;
}

// Path Finding Types
export interface PathNode {
  title: string;
  distance: number;
}

export interface ShortestPathResponse {
  path: PathNode[];
  totalDistance: number;
  pathExists: boolean;
  searchTime: number;
  nodesExplored: number;
  message: string;
}

// Exploration Management Types
export interface ExplorationSummary {
  id: string;
  name: string;
  startNode: string;
  nodeCount: number;
  edgeCount: number;
  createdAt: string;
  lastModified: string;
  description?: string;
}

export interface SaveExplorationRequest {
  name: string;
  description?: string;
  graph: GraphData;
  startNode: string;
}

export interface SaveExplorationResponse {
  id: string;
  message: string;
}

// UI State Types
export interface GraphUIState {
  selectedNode: string | null;
  highlightedPath: string[];
  showNodeLabels: boolean;
  showEdgeLabels: boolean;
  layoutType: 'hierarchical' | 'physics' | 'static';
  zoomLevel: number;
  center: { x: number; y: number };
  isLoading: boolean;
  error: string | null;
}

// Component Props Types
export interface GraphVisualizationProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  height?: number | string;
  width?: number | string;
  options?: any;
}

export interface NodeDetailsProps {
  node: GraphNode | null;
  onClose: () => void;
  onExplore?: (nodeId: string) => void;
}

// Network Configuration Types
export interface NetworkOptions {
  nodes: {
    shape: string;
    size: number;
    font: {
      size: number;
      color: string;
    };
    borderWidth: number;
    shadow: boolean;
    chosen: {
      node: (values: any, id: string, selected: boolean, hovering: boolean) => void;
    };
  };
  edges: {
    arrows: {
      to: {
        enabled: boolean;
        scaleFactor: number;
      };
    };
    color: {
      color: string;
      highlight: string;
      hover: string;
    };
    width: number;
    smooth: boolean | object;
    chosen: {
      edge: (values: any, id: string, selected: boolean, hovering: boolean) => void;
    };
  };
  physics: {
    enabled: boolean;
    solver: string;
    hierarchicalRepulsion?: {
      nodeDistance: number;
      centralGravity: number;
      springLength: number;
      springConstant: number;
      damping: number;
    };
  };
  layout: {
    hierarchical?: {
      enabled: boolean;
      direction: string;
      sortMethod: string;
      levelSeparation: number;
      nodeSpacing: number;
      treeSpacing: number;
    };
  };
  interaction: {
    hover: boolean;
    tooltipDelay: number;
    hideEdgesOnDrag: boolean;
    hideNodesOnDrag: boolean;
  };
}

// Error Types
export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

// Filter and Search Types
export interface GraphFilters {
  minDegree: number;
  maxDegree: number;
  minCentrality: number;
  maxCentrality: number;
  nodeTypes: string[];
  edgeTypes: string[];
}

export interface SearchFilters {
  limit: number;
  namespace: number[];
  sortBy: 'relevance' | 'size' | 'timestamp';
  minWordCount: number;
}

// Tipos para exploraciones guardadas
export interface SavedExploration {
  id?: string;
  name: string;
  description?: string;
  root_node: string;
  graph_data: GraphData;
  created_at?: string;
  updated_at?: string;
  tags: string[];
}

export interface CreateExplorationRequest {
  name: string;
  description?: string;
  root_node: string;
  graph_data: GraphData;
  tags: string[];
}

export interface ExplorationListResponse {
  explorations: SavedExploration[];
  total_count: number;
  page: number;
  page_size: number;
}

// Tipos para búsqueda de caminos
export interface PathFindingRequest {
  from_article: string;
  to_article: string;
  max_depth: number;
}

export interface PathNode {
  article_title: string;
  url: string;
  step: number;
}

export interface PathFindingResponse {
  path_found: boolean;
  path_length: number;
  path: PathNode[];
  exploration_time: number;
  articles_explored: number;
}

// Tipos para el estado de la aplicación
export interface AppState {
  currentGraph: GraphData | null;
  selectedNode: GraphNode | null;
  isLoading: boolean;
  error: string | null;
  searchResults: WikipediaArticle[];
  savedExplorations: SavedExploration[];
}

// Tipos para configuración de visualización
export interface GraphVisualizationConfig {
  physics: {
    enabled: boolean;
    stabilization: boolean;
    solver: string;
  };
  layout: {
    hierarchical: boolean;
    direction: string;
  };
  interaction: {
    hover: boolean;
    selectConnectedEdges: boolean;
    tooltipDelay: number;
  };
  nodes: {
    shape: string;
    scaling: {
      min: number;
      max: number;
    };
    font: {
      size: number;
      color: string;
    };
    borderWidth: number;
    borderWidthSelected: number;
  };
  edges: {
    width: number;
    arrows: {
      to: boolean;
    };
    smooth: {
      enabled: boolean;
      type: string;
    };
  };
}

// Tipos para eventos del grafo
export interface GraphEvent {
  type: 'selectNode' | 'selectEdge' | 'doubleClick' | 'hover' | 'blurNode';
  nodeId?: string;
  edgeId?: string;
  position?: { x: number; y: number };
}

// Tipos para filtros y búsqueda
export interface SearchFilters {
  term: string;
  limit: number;
  sortBy: 'relevance' | 'title' | 'date';
  order: 'asc' | 'desc';
}

export interface ExplorationFilters {
  search?: string;
  tag?: string;
  root_node?: string;
  page: number;
  page_size: number;
}

// Tipos para métricas del grafo
export interface GraphMetrics {
  total_nodes: number;
  total_edges: number;
  density: number;
  average_degree: number;
  max_degree: number;
  max_depth: number;
  depth_distribution: Record<string, number>;
  nodes_by_centrality: Array<[string, number]>;
}

// Tipos para respuestas de error
export interface ErrorResponse {
  detail: string;
  error_code?: string;
  timestamp: string;
  path?: string;
}

// Tipos para notificaciones
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

// Tipos para configuración de la aplicación
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
  };
  graph: {
    maxNodes: number;
    maxDepth: number;
    defaultPhysics: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    sidebarWidth: number;
    graphHeight: string;
  };
}

// Tipos para hooks personalizados
export interface UseGraphReturn {
  graph: GraphData | null;
  isLoading: boolean;
  error: string | null;
  exploreGraph: (articleTitle: string, depth?: number) => Promise<void>;
  expandNode: (nodeId: string, depth?: number) => Promise<void>;
  clearGraph: () => void;
}

export interface UseSearchReturn {
  results: WikipediaArticle[];
  isLoading: boolean;
  error: string | null;
  search: (term: string, limit?: number) => Promise<void>;
  getSuggestions: (term: string) => Promise<string[]>;
  clearResults: () => void;
}

export interface UseExplorationsReturn {
  explorations: SavedExploration[];
  isLoading: boolean;
  error: string | null;
  loadExplorations: (filters?: ExplorationFilters) => Promise<void>;
  saveExploration: (exploration: CreateExplorationRequest) => Promise<SavedExploration>;
  deleteExploration: (id: string) => Promise<void>;
  getExploration: (id: string) => Promise<SavedExploration | null>;
}

// Tipos para componentes
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface GraphVisualizationProps extends ComponentProps {
  graphData: GraphData;
  onNodeSelect?: (node: GraphNode) => void;
  onNodeDoubleClick?: (node: GraphNode) => void;
  onEdgeSelect?: (edge: GraphEdge) => void;
  config?: Partial<GraphVisualizationConfig>;
  height?: string;
}

export interface SearchBarProps extends ComponentProps {
  onSearch: (term: string) => void;
  onSelect: (article: WikipediaArticle) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export interface NodeDetailsProps extends ComponentProps {
  node: GraphNode | null;
  onExpand?: (nodeId: string) => void;
  onClose?: () => void;
}

export interface ExplorationListProps extends ComponentProps {
  explorations: SavedExploration[];
  onSelect: (exploration: SavedExploration) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

// Tipos utilitarios
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Tipos para el estado de Zustand
export interface GraphStore extends AppState {
  // Actions
  setCurrentGraph: (graph: GraphData | null) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchResults: (results: WikipediaArticle[]) => void;
  setSavedExplorations: (explorations: SavedExploration[]) => void;
  
  // Complex actions
  exploreFromNode: (articleTitle: string, depth?: number) => Promise<void>;
  expandSelectedNode: (depth?: number) => Promise<void>;
  saveCurrentExploration: (name: string, description?: string, tags?: string[]) => Promise<void>;
  loadExploration: (explorationId: string) => Promise<void>;
}
