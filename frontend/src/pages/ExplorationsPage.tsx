/**
 * Página de exploraciones guardadas
 * 
 * Permite ver, cargar y gestionar exploraciones de grafos guardadas previamente.
 */

import { useState, useEffect } from 'react';
import { Save, Calendar, Trash2, Eye, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface SavedExploration {
  id: string;
  name: string;
  description?: string;
  startNode: string;
  nodeCount: number;
  edgeCount: number;
  createdAt: string;
  lastModified: string;
}

export function ExplorationsPage() {
  const [explorations, setExplorations] = useState<SavedExploration[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Simulated data for now
  useEffect(() => {
    // This would normally fetch from API
    const mockExplorations: SavedExploration[] = [
      {
        id: '1',
        name: 'Exploración de Albert Einstein',
        description: 'Conexiones desde física hasta filosofía',
        startNode: 'Albert Einstein',
        nodeCount: 45,
        edgeCount: 128,
        createdAt: '2024-01-15T10:30:00Z',
        lastModified: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        name: 'Inteligencia Artificial y Machine Learning',
        description: 'Red de conceptos de IA moderna',
        startNode: 'Artificial Intelligence',
        nodeCount: 67,
        edgeCount: 203,
        createdAt: '2024-01-14T15:45:00Z',
        lastModified: '2024-01-14T15:45:00Z'
      }
    ];
    
    setTimeout(() => {
      setExplorations(mockExplorations);
    }, 500);
  }, []);

  const handleLoadExploration = (exploration: SavedExploration) => {
    toast.success(`Cargando exploración: ${exploration.name}`);
    // This would load the exploration data
    console.log('Loading exploration:', exploration);
  };

  const handleDeleteExploration = async (explorationId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta exploración?')) {
      return;
    }

    try {
      // This would delete from API
      setExplorations(prev => prev.filter(exp => exp.id !== explorationId));
      toast.success('Exploración eliminada');
    } catch (error) {
      console.error('Error deleting exploration:', error);
      toast.error('Error al eliminar la exploración');
    }
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
            onClick={() => window.location.href = '/'}
          >
            <Plus size={16} />
            <span>Nueva Exploración</span>
          </button>
        </div>
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
                              <span>{exploration.nodeCount} nodos</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span>🔗</span>
                              <span>{exploration.edgeCount} conexiones</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar size={14} />
                              <span>{formatDate(exploration.createdAt)}</span>
                            </span>
                          </div>
                          
                          <div className="mt-3">
                            <span className="text-sm text-gray-600">
                              Nodo inicial: <span className="font-medium text-gray-900">{exploration.startNode}</span>
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
                        onClick={() => handleDeleteExploration(exploration.id)}
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
                {explorations.reduce((sum, exp) => sum + exp.nodeCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Nodos totales</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {explorations.reduce((sum, exp) => sum + exp.edgeCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Conexiones totales</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(explorations.reduce((sum, exp) => sum + exp.nodeCount, 0) / explorations.length)}
              </div>
              <div className="text-sm text-gray-600">Promedio nodos</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
