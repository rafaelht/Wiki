/**
 * Página de exploraciones guardadas
 * 
 * Permite ver, cargar y gestionar exploraciones de grafos guardadas previamente.
 */

import { useState, useEffect } from 'react';
import { Save, Calendar, Trash2, Eye, Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { SavedExploration, ExplorationFilters } from '../types';
import { useNavigate } from 'react-router-dom';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { useAuthStore } from '../store/authStore';

export function ExplorationsPage() {
  const [explorations, setExplorations] = useState<SavedExploration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [explorationToDelete, setExplorationToDelete] = useState<SavedExploration | null>(null);
  const navigate = useNavigate();
  
  // Verificar autenticación
  const { isAuthenticated, isGuest } = useAuthStore();
  
  // Redirigir si es invitado o no autenticado
  useEffect(() => {
    if (!isAuthenticated || isGuest) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, isGuest, navigate]);

  const loadExplorations = async () => {
    try {
      setIsLoading(true);
      const filters: ExplorationFilters = {
        limit: 10,
        offset: (page - 1) * 10,
        search: searchTerm || undefined,
      };
      
      const response = await api.explorations.list(filters);
      setExplorations(response.explorations);
      setTotalCount(response.total);
    } catch (error: any) {
      console.error('Error loading explorations:', error);
      toast.error(error.response?.data?.detail || 'Error cargando las exploraciones');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExplorations();
  }, [page, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadExplorations();
  };

  const handleLoadExploration = (exploration: SavedExploration) => {
    // Navegar al explorador con los datos cargados
    navigate('/explorer', { 
      state: { 
        loadedExploration: exploration 
      } 
    });
  };

  const handleDeleteExploration = async (id: string) => {
    // Encontrar la exploración para mostrar en el modal
    const exploration = explorations.find(exp => exp.id === id);
    if (exploration) {
      setExplorationToDelete(exploration);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!explorationToDelete?.id) return;

    try {
      await api.explorations.delete(explorationToDelete.id);
      toast.success('Exploración eliminada exitosamente');
      loadExplorations(); // Recargar la lista
    } catch (error: any) {
      console.error('Error deleting exploration:', error);
      toast.error(error.response?.data?.detail || 'Error eliminando la exploración');
    } finally {
      setShowDeleteModal(false);
      setExplorationToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setExplorationToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Verificar acceso */}
      {(!isAuthenticated || isGuest) ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-gray-600 mb-4">
            Necesitas iniciar sesión con una cuenta registrada para ver tus exploraciones guardadas.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </button>
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Exploraciones Guardadas
            </h1>
            <p className="text-gray-600">
              Gestiona y reutiliza tus exploraciones de grafos de conocimiento
            </p>
          </div>
          
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
            onClick={() => navigate('/explorer')}
          >
            <Plus size={16} />
            <span>Nueva Exploración</span>
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar exploraciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando exploraciones...</p>
        </div>
      )}

      {/* Explorations list */}
      {!isLoading && (
        <div className="space-y-4">
          {explorations.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-6xl mb-4">💾</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                No hay exploraciones guardadas
              </h3>
              <p className="text-gray-600 mb-6">
                Crea tu primera exploración desde el explorador principal
              </p>
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => window.location.href = '/'}
              >
                Comenzar exploración
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {explorations.map((exploration) => (
                <div
                  key={exploration.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start space-x-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <Save className="h-6 w-6 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {exploration.name}
                          </h3>
                          
                          {exploration.description && (
                            <p className="text-gray-600 mb-3">
                              {exploration.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <span>📊</span>
                              <span>{exploration.graph_data?.nodes?.length || 0} nodos</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span>🔗</span>
                              <span>{exploration.graph_data?.edges?.length || 0} conexiones</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar size={14} />
                              <span>{formatDate(exploration.created_at || '')}</span>
                            </span>
                          </div>
                          
                          <div className="mt-3">
                            <span className="text-sm text-gray-600">
                              Nodo inicial: <span className="font-medium text-gray-900">{exploration.root_node}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleLoadExploration(exploration)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Cargar exploración"
                      >
                        <Eye size={18} />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteExploration(exploration.id || '')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar exploración"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats section */}
      {explorations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Estadísticas de Exploraciones
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {explorations.length}
              </div>
              <div className="text-sm text-gray-600">Exploraciones</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {explorations.reduce((sum, exp) => sum + (exp.graph_data?.nodes?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Nodos totales</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {explorations.reduce((sum, exp) => sum + (exp.graph_data?.edges?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Conexiones totales</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(explorations.reduce((sum, exp) => sum + (exp.graph_data?.nodes?.length || 0), 0) / explorations.length)}
              </div>
              <div className="text-sm text-gray-600">Promedio nodos</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        exploration={explorationToDelete}
      />
        </>
      )}
    </div>
  );
}
