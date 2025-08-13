/**
 * Store de estado global usando Zustand
 * 
 * Maneja el estado de la aplicación de forma centralizada,
 * incluyendo el grafo actual, nodos seleccionados y operaciones.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import {
  GraphData,
  GraphNode,
  WikipediaArticle,
  SavedExploration,
  CreateExplorationRequest,
} from '../types';

interface GraphStore {
  // Estado
  currentGraph: GraphData | null;
  selectedNode: GraphNode | null;
  isLoading: boolean;
  error: string | null;
  searchResults: WikipediaArticle[];
  savedExplorations: SavedExploration[];
  explorationHistory: string[]; // Historial de artículos explorados

  // Actions básicas
  setCurrentGraph: (graph: GraphData | null) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchResults: (results: WikipediaArticle[]) => void;
  setSavedExplorations: (explorations: SavedExploration[]) => void;
  
  // Actions complejas
  exploreFromNode: (articleTitle: string, depth?: number, maxNodes?: number) => Promise<void>;
  expandSelectedNode: (depth?: number) => Promise<void>;
  expandNode: (nodeId: string, depth?: number) => Promise<void>;
  searchArticles: (term: string, limit?: number) => Promise<WikipediaArticle[]>;
  saveCurrentExploration: (name: string, description?: string, tags?: string[]) => Promise<void>;
  loadExploration: (explorationId: string) => Promise<void>;
  deleteExploration: (explorationId: string) => Promise<void>;
  clearGraph: () => void;
  clearError: () => void;
  
  // Navegación y historial
  addToHistory: (articleTitle: string) => void;
  goBack: () => void;
  canGoBack: () => boolean;
}

export const useGraphStore = create<GraphStore>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      currentGraph: null,
      selectedNode: null,
      isLoading: false,
      error: null,
      searchResults: [],
      savedExplorations: [],
      explorationHistory: [],

      // Actions básicas
      setCurrentGraph: (graph) => {
        set({ currentGraph: graph }, false, 'setCurrentGraph');
      },

      setSelectedNode: (node) => {
        set({ selectedNode: node }, false, 'setSelectedNode');
      },

      setLoading: (loading) => {
        set({ isLoading: loading }, false, 'setLoading');
      },

      setError: (error) => {
        set({ error }, false, 'setError');
        if (error) {
          toast.error(error);
        }
      },

      setSearchResults: (results) => {
        set({ searchResults: results }, false, 'setSearchResults');
      },

      setSavedExplorations: (explorations) => {
        set({ savedExplorations: explorations }, false, 'setSavedExplorations');
      },

      // Exploración de grafos
      exploreFromNode: async (articleTitle, depth = 1, maxNodes) => {
        const { setLoading, setError, setCurrentGraph, addToHistory } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const response = await api.explore(articleTitle, depth, maxNodes);
          
          setCurrentGraph(response.graph_data);
          addToHistory(articleTitle);
          
          toast.success(
            `Grafo explorado: ${response.graph_data.total_nodes} nodos, ${response.graph_data.total_edges} conexiones`
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error explorando el grafo';
          setError(message);
        } finally {
          setLoading(false);
        }
      },

      expandSelectedNode: async (depth = 1) => {
        const { selectedNode, expandNode } = get();
        if (selectedNode) {
          await expandNode(selectedNode.id, depth);
        } else {
          toast.error('No hay nodo seleccionado para expandir');
        }
      },

      expandNode: async (nodeId, depth = 1) => {
        const { currentGraph, setLoading, setError, setCurrentGraph } = get();
        
        if (!currentGraph) {
          toast.error('No hay grafo cargado');
          return;
        }

        try {
          setLoading(true);
          setError(null);
          
          const expandedGraph = await api.expand(currentGraph, nodeId, depth);
          
          setCurrentGraph(expandedGraph);
          
          const addedNodes = expandedGraph.total_nodes - currentGraph.total_nodes;
          const addedEdges = expandedGraph.total_edges - currentGraph.total_edges;
          
          toast.success(
            `Nodo expandido: +${addedNodes} nodos, +${addedEdges} conexiones`
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error expandiendo el nodo';
          setError(message);
        } finally {
          setLoading(false);
        }
      },

      // Búsqueda de artículos
      searchArticles: async (term, limit = 10) => {
        const { setLoading, setError, setSearchResults } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const response = await api.search(term, limit);
          setSearchResults(response.results);
          return response.results; // Retornar los resultados
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error en la búsqueda';
          setError(message);
          setSearchResults([]);
          return []; // Retornar array vacío en caso de error
        } finally {
          setLoading(false);
        }
      },

      // Gestión de exploraciones guardadas
      saveCurrentExploration: async (name, description, tags = []) => {
        const { currentGraph, setLoading, setError } = get();
        
        if (!currentGraph) {
          toast.error('No hay grafo para guardar');
          return;
        }

        try {
          setLoading(true);
          setError(null);
          
          const explorationRequest: CreateExplorationRequest = {
            name,
            description,
            root_node: currentGraph.root_node,
            graph_data: currentGraph,
            tags,
          };
          
          const savedExploration = await api.explorations.create(explorationRequest);
          
          // Actualizar lista de exploraciones guardadas
          const { savedExplorations } = get();
          set({ 
            savedExplorations: [savedExploration, ...savedExplorations] 
          }, false, 'saveCurrentExploration');
          
          toast.success(`Exploración "${name}" guardada exitosamente`);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error guardando la exploración';
          setError(message);
        } finally {
          setLoading(false);
        }
      },

      loadExploration: async (explorationId) => {
        const { setLoading, setError, setCurrentGraph } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const exploration = await api.explorations.get(explorationId);
          
          setCurrentGraph(exploration.graph_data);
          
          toast.success(`Exploración "${exploration.name}" cargada`);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error cargando la exploración';
          setError(message);
        } finally {
          setLoading(false);
        }
      },

      deleteExploration: async (explorationId) => {
        const { setLoading, setError, savedExplorations, setSavedExplorations } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          await api.explorations.delete(explorationId);
          
          // Actualizar lista local
          const updatedExplorations = savedExplorations.filter(
            (exp) => exp.id !== explorationId
          );
          setSavedExplorations(updatedExplorations);
          
          toast.success('Exploración eliminada');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error eliminando la exploración';
          setError(message);
        } finally {
          setLoading(false);
        }
      },

      // Utilidades
      clearGraph: () => {
        set({ 
          currentGraph: null, 
          selectedNode: null,
          explorationHistory: [] 
        }, false, 'clearGraph');
      },

      clearError: () => {
        set({ error: null }, false, 'clearError');
      },

      // Navegación e historial
      addToHistory: (articleTitle) => {
        const { explorationHistory } = get();
        const newHistory = [articleTitle, ...explorationHistory.filter(h => h !== articleTitle)];
        set({ explorationHistory: newHistory.slice(0, 10) }, false, 'addToHistory'); // Máximo 10 en el historial
      },

      goBack: () => {
        const { explorationHistory, exploreFromNode } = get();
        if (explorationHistory.length > 1) {
          const previousArticle = explorationHistory[1];
          exploreFromNode(previousArticle);
        }
      },

      canGoBack: () => {
        const { explorationHistory } = get();
        return explorationHistory.length > 1;
      },
    }),
    {
      name: 'graph-store', // nombre para DevTools
    }
  )
);

// Hooks de conveniencia para acceder a partes específicas del store
export const useCurrentGraph = () => useGraphStore((state) => state.currentGraph);
export const useSelectedNode = () => useGraphStore((state) => state.selectedNode);
export const useIsLoading = () => useGraphStore((state) => state.isLoading);
export const useError = () => useGraphStore((state) => state.error);
export const useSearchResults = () => useGraphStore((state) => state.searchResults);
export const useSavedExplorations = () => useGraphStore((state) => state.savedExplorations);

// Hooks para acciones
export const useGraphActions = () => useGraphStore((state) => ({
  exploreFromNode: state.exploreFromNode,
  expandNode: state.expandNode,
  expandSelectedNode: state.expandSelectedNode,
  searchArticles: state.searchArticles,
  saveCurrentExploration: state.saveCurrentExploration,
  loadExploration: state.loadExploration,
  deleteExploration: state.deleteExploration,
  clearGraph: state.clearGraph,
  clearError: state.clearError,
  setSelectedNode: state.setSelectedNode,
}));

export const useNavigationActions = () => useGraphStore((state) => ({
  goBack: state.goBack,
  canGoBack: state.canGoBack,
  explorationHistory: state.explorationHistory,
}));
