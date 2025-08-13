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

export interface GraphVisualizationProps {
  data?: GraphData;
  graphData?: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  height?: number | string;
  width?: number | string;
  showControls?: boolean;
  showStats?: boolean;
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
