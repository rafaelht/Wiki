// Basic types for Wikipedia Graph Explorer

export interface WikipediaArticle {
  title: string;
  summary?: string;
  url: string;
  page_id?: number;
  image_url?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  summary?: string;
  url: string;
  page_id?: number;
  depth: number;
  centrality?: number;
  degree?: number;
  image_url?: string;
  color?: string;
  size?: number;
}

export interface GraphEdge {
  from_node: string;
  to_node: string;
  weight: number;
  edge_type?: string;
  id?: string;
  from?: string;
  to?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  root_node: string;
  total_nodes: number;
  total_edges: number;
  max_depth: number;
}

export interface NetworkOptions {
  physics?: {
    enabled: boolean;
    stabilization: { iterations: number };
  };
  layout?: {
    improvedLayout: boolean;
  };
  interaction?: {
    hover: boolean;
    tooltipDelay: number;
  };
  nodes?: {
    font: { size: number };
    borderWidth: number;
    shadow: boolean;
  };
  edges?: {
    width: number;
    arrows: { to: { enabled: boolean } };
    smooth: { type: string };
  };
}

export interface GraphVisualizationProps {
  data?: GraphData;
  graphData?: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  height?: number | string;
  width?: number | string;
  showControls?: boolean;
  showStats?: boolean;
  options?: NetworkOptions;
}

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

// API Response types
export interface SearchResponse {
  results: WikipediaArticle[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExploreResponse {
  graph_data: GraphData;
  message?: string;
}

export interface ExplorationListResponse {
  explorations: SavedExploration[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExplorationFilters {
  search?: string;
  tags?: string[];
  created_after?: string;
  created_before?: string;
  limit?: number;
  offset?: number;
}

export interface PathFindingRequest {
  start_node: string;
  end_node: string;
  max_depth?: number;
  algorithm?: 'bfs' | 'dfs' | 'dijkstra';
}

export interface PathFindingResponse {
  path: GraphNode[];
  distance: number;
  algorithm_used: string;
}

export interface GraphMetrics {
  total_nodes: number;
  total_edges: number;
  average_degree: number;
  clustering_coefficient: number;
  diameter: number;
  density: number;
}

export interface ErrorResponse {
  detail: string;
  error_code?: string;
  status_code: number;
}

export interface AppState {
  currentGraph: GraphData | null;
  selectedNode: GraphNode | null;
  isLoading: boolean;
  error: string | null;
  searchResults: WikipediaArticle[];
  savedExplorations: SavedExploration[];
}

export interface GraphStore extends AppState {
  setCurrentGraph: (graph: GraphData | null) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchResults: (results: WikipediaArticle[]) => void;
  setSavedExplorations: (explorations: SavedExploration[]) => void;
  exploreFromNode: (articleTitle: string, depth?: number) => Promise<void>;
  expandSelectedNode: (depth?: number) => Promise<void>;
  saveCurrentExploration: (name: string, description?: string, tags?: string[]) => Promise<void>;
  loadExploration: (explorationId: string) => Promise<void>;
}
