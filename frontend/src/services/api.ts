/**
 * Configuración y cliente para las llamadas a la API del backend
 * 
 * Centraliza todas las llamadas HTTP y maneja errores,
 * autenticación y transformación de datos.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  WikipediaArticle,
  SearchResponse,
  ExploreResponse,
  GraphData,
  SavedExploration,
  CreateExplorationRequest,
  ExplorationListResponse,
  ExplorationFilters,
  PathFindingRequest,
  PathFindingResponse,
  GraphMetrics,
  ErrorResponse
} from '../types';

// Función para obtener el token del store de Zustand
const getAuthToken = (): string | null => {
  try {
    // Acceder al store de Zustand directamente
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.state?.token || null;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return null;
};

// Configuración base de la API
const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';
const API_TIMEOUT = 90000; // 90 segundos - Aumentado para exploraciones complejas

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Configurar interceptors
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Agregar token de autorización si está disponible
        const token = getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Agregar timestamp para evitar cache en desarrollo
        if ((import.meta as any).env.DEV) {
          config.params = {
            ...config.params,
            _t: Date.now(),
          };
        }
        
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        if (token) {
          console.log(`🔑 Auth token included: ${token.substring(0, 20)}...`);
        }
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError<ErrorResponse>) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleApiError(error: AxiosError<ErrorResponse>): void {
    console.error('❌ API Error:', error);

    if (error.response) {
      // Error con respuesta del servidor
      const { status, data } = error.response;
      const message = data?.detail || `Error ${status}: ${error.message}`;
      
      switch (status) {
        case 400:
          toast.error(`Solicitud inválida: ${message}`);
          break;
        case 401:
          toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          // Limpiar token inválido
          try {
            localStorage.removeItem('auth-storage');
            // Recargar la página para forzar re-autenticación
            setTimeout(() => {
              window.location.href = '/login';
            }, 1500);
          } catch (e) {
            console.error('Error clearing auth storage:', e);
          }
          break;
        case 404:
          toast.error('Recurso no encontrado');
          break;
        case 429:
          toast.error('Demasiadas solicitudes. Intenta de nuevo en unos momentos.');
          break;
        case 500:
          toast.error('Error interno del servidor. Intenta de nuevo más tarde.');
          break;
        default:
          toast.error(message);
      }
    } else if (error.request) {
      // Error de red
      toast.error('Error de conexión. Verifica tu conexión a internet.');
    } else {
      // Error de configuración
      toast.error('Error inesperado. Intenta recargar la página.');
    }
  }

  // Métodos de búsqueda
  async searchArticles(term: string, limit: number = 6): Promise<SearchResponse> {
    const response = await this.client.get<SearchResponse>('/api/search', {
      params: { term, limit }
    });
    return response.data;
  }

  async getSearchSuggestions(term: string, limit: number = 5): Promise<string[]> {
    const response = await this.client.get<string[]>('/api/search/suggestions', {
      params: { term, limit }
    });
    return response.data;
  }

  async getArticleDetails(title: string): Promise<WikipediaArticle> {
    const response = await this.client.get<WikipediaArticle>(`/api/article/${encodeURIComponent(title)}`);
    return response.data;
  }

  // Métodos de exploración de grafos
  async exploreGraph(
    articleTitle: string, 
    depth: number = 1, 
    maxNodes?: number
  ): Promise<ExploreResponse> {
    const params: Record<string, any> = { depth };
    if (maxNodes) {
      params.max_nodes = maxNodes;
    }

    const response = await this.client.get<ExploreResponse>(
      `/api/explore/${encodeURIComponent(articleTitle)}`,
      { params }
    );
    return response.data;
  }

  async expandNode(
    graphData: GraphData, 
    nodeId: string, 
    depth: number = 1
  ): Promise<GraphData> {
    const response = await this.client.post<GraphData>('/api/explore/expand', {
      graph_data: graphData,
      node_id: nodeId,
      depth
    });
    return response.data;
  }

  async findShortestPath(request: PathFindingRequest): Promise<PathFindingResponse> {
    const response = await this.client.post<PathFindingResponse>('/api/path', request);
    return response.data;
  }

  async getGraphMetrics(articleTitle: string, depth: number = 1): Promise<GraphMetrics> {
    const response = await this.client.get<GraphMetrics>(
      `/api/graph/metrics/${encodeURIComponent(articleTitle)}`,
      { params: { depth } }
    );
    return response.data;
  }

  // Métodos CRUD para exploraciones guardadas
  async getExplorations(filters: ExplorationFilters): Promise<ExplorationListResponse> {
    const response = await this.client.get<ExplorationListResponse>('/api/explorations', {
      params: filters
    });
    return response.data;
  }

  async getExploration(id: string): Promise<SavedExploration> {
    const response = await this.client.get<SavedExploration>(`/api/explorations/${id}`);
    return response.data;
  }

  async createExploration(exploration: CreateExplorationRequest): Promise<SavedExploration> {
    const response = await this.client.post<SavedExploration>('/api/explorations', exploration);
    return response.data;
  }

  async updateExploration(id: string, exploration: CreateExplorationRequest): Promise<SavedExploration> {
    const response = await this.client.put<SavedExploration>(`/api/explorations/${id}`, exploration);
    return response.data;
  }

  async deleteExploration(id: string): Promise<void> {
    await this.client.delete(`/api/explorations/${id}`);
  }

  // Método de utilidad para verificar salud de la API
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Instancia singleton del cliente API
export const apiClient = new ApiClient();

// Funciones de conveniencia para usar en componentes
export const api = {
  // Búsqueda
  search: (term: string, limit?: number) => apiClient.searchArticles(term, limit),
  suggestions: (term: string, limit?: number) => apiClient.getSearchSuggestions(term, limit),
  article: (title: string) => apiClient.getArticleDetails(title),

  // Exploración
  explore: (title: string, depth?: number, maxNodes?: number) => 
    apiClient.exploreGraph(title, depth, maxNodes),
  expand: (graph: GraphData, nodeId: string, depth?: number) => 
    apiClient.expandNode(graph, nodeId, depth),
  path: (request: PathFindingRequest) => apiClient.findShortestPath(request),
  metrics: (title: string, depth?: number) => apiClient.getGraphMetrics(title, depth),

  // Exploraciones guardadas
  explorations: {
    list: (filters: ExplorationFilters) => apiClient.getExplorations(filters),
    get: (id: string) => apiClient.getExploration(id),
    create: (exploration: CreateExplorationRequest) => apiClient.createExploration(exploration),
    update: (id: string, exploration: CreateExplorationRequest) => 
      apiClient.updateExploration(id, exploration),
    delete: (id: string) => apiClient.deleteExploration(id),
  },

  // Utilidades
  health: () => apiClient.healthCheck(),
};

export default api;
