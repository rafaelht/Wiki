/**
 * Página principal del explorador de grafos
 * 
 * Contiene la interfaz principal para explorar el grafo de conocimiento,
 * incluyendo búsqueda, visualización y panel de detalles.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { GraphVisualization } from '../components/GraphVisualization';
import { ArticlePreview } from '../components/ArticlePreview';
import ErrorBoundary from '../components/ErrorBoundary';
import SaveExplorationModal from '../components/SaveExplorationModal';
import { useGraphStore } from '../store/graphStore';
import { useAuthStore } from '../store/authStore';
import { WikipediaArticle, GraphNode, SavedExploration } from '../types';
import { Save, Download, Share2, AlertCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export function ExplorerPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [expandingNodes, setExpandingNodes] = useState<Set<string>>(new Set());
  
  const location = useLocation();

  // Estado del store de grafos
  const { 
    currentGraph, 
    isLoading, 
    error,
    exploreFromNode,
    saveCurrentExploration,
    setCurrentGraph,
    expandNode,
    expandNodeSilently,
    clearGraph
  } = useGraphStore();

  // Estado del store de autenticación
  const { isAuthenticated, isGuest } = useAuthStore();

  // Limpiar grafo cuando el usuario no esté autenticado o sea invitado al inicio
  useEffect(() => {
    if (!isAuthenticated && !isGuest && currentGraph) {
      console.log('🧹 Limpiando grafo por logout');
      setCurrentGraph(null);
    }
  }, [isAuthenticated, isGuest, currentGraph, setCurrentGraph]);

  // Escuchar evento de logout para limpiar grafo
  useEffect(() => {
    const handleLogout = () => {
      console.log('🧹 Limpiando grafo por evento de logout');
      clearGraph();
    };

    const handleLogin = () => {
      console.log('🎉 Usuario iniciado sesión - mostrando pantalla de bienvenida');
      clearGraph(); // Limpiar para mostrar pantalla de bienvenida
    };

    const handleGuest = () => {
      console.log('👤 Modo invitado activado - mostrando pantalla de bienvenida');
      clearGraph(); // Limpiar para mostrar pantalla de bienvenida
    };

    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:login', handleLogin);
    window.addEventListener('auth:guest', handleGuest);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:login', handleLogin);
      window.removeEventListener('auth:guest', handleGuest);
    };
  }, [clearGraph]);

  // Cargar exploración guardada si se pasa por la navegación
  useEffect(() => {
    const state = location.state as { loadedExploration?: SavedExploration };
    if (state?.loadedExploration) {
      const exploration = state.loadedExploration;
      setCurrentGraph(exploration.graph_data);
      toast.success(`Exploración "${exploration.name}" cargada exitosamente`);
      
      // Limpiar el state para evitar recargas accidentales
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state, setCurrentGraph]);

  // Manejar selección de artículo desde la búsqueda
  const handleArticleSelect = async (article: WikipediaArticle) => {
    try {
      console.log('Exploring article:', article.title);
      await exploreFromNode(article.title, 2, 30); // Optimizado: profundidad 2, máximo 30 nodos
      toast.success(`Explorando "${article.title}"`);
      
      // Recordatorio para usuarios invitados
      if (isGuest) {
        setTimeout(() => {
          toast('Tip: Crea una cuenta para guardar tus exploraciones', {
            duration: 6000,
            style: {
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fbbf24',
            },
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error explorando artículo:', error);
      toast.error('Error al explorar el artículo');
    }
  };

  // Manejar clic en nodo del grafo
  const handleNodeClick = async (node: GraphNode) => {
    console.log('Node clicked:', node);
    setSelectedNode(node);
    setShowPreview(true);
    
    // Expansión dinámica silenciosa: expandir el nodo en segundo plano
    if (currentGraph && node.id && !expandingNodes.has(node.id)) {
      // Marcar temporalmente para evitar clicks múltiples
      setExpandingNodes(prev => new Set(prev).add(node.id));
      
      // Expandir silenciosamente sin mostrar loading ni toasts
      try {
        await expandNodeSilently(node.id, 1);
      } catch (error) {
        console.warn('Error en expansión silenciosa:', error);
      } finally {
        // Remover del estado después de un breve delay
        setTimeout(() => {
          setExpandingNodes(prev => {
            const newSet = new Set(prev);
            newSet.delete(node.id);
            return newSet;
          });
        }, 1000);
      }
    }
  };

  // Manejar expansión manual desde el panel de detalles
  const handleManualExpand = async (nodeId: string, depth: number) => {
    if (!currentGraph || expandingNodes.has(nodeId)) {
      return;
    }
    
    try {
      // Marcar el nodo como expandiéndose
      setExpandingNodes(prev => new Set(prev).add(nodeId));
      
      await expandNode(nodeId, depth);
      
      toast.success(`Nodo expandido con profundidad ${depth}`);
    } catch (error) {
      console.error('Error expandiendo nodo:', error);
      // El error ya se maneja en el store con toast
    } finally {
      // Remover el nodo del estado de expansión
      setExpandingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    }
  };

  // Cerrar panel de preview
  const handleClosePreview = () => {
    setShowPreview(false);
    setSelectedNode(null);
  };

  // Manejar guardado del grafo (solo para usuarios autenticados)
  const handleSaveGraph = () => {
    if (isGuest) {
      toast.error('Debes iniciar sesión para guardar exploraciones');
      return;
    }
    
    if (!isAuthenticated) {
      toast.error('Debes estar autenticado para guardar');
      return;
    }
    
    if (!currentGraph) {
      toast.error('No hay grafo para guardar');
      return;
    }
    
    setShowSaveModal(true);
  };

  // Manejar exportación del grafo
  const handleExportGraph = () => {
    if (!currentGraph) {
      toast.error('No hay grafo para exportar');
      return;
    }

    const dataStr = JSON.stringify(currentGraph, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `wikipedia-graph-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    toast.success('Grafo exportado exitosamente');
  };

  // Manejar compartir grafo
  const handleShareGraph = async () => {
    try {
      const shareData = {
        title: 'Exploración de Wikipedia Graph Explorer',
        text: 'Descubre conexiones en Wikipedia usando grafos de conocimiento',
        url: window.location.href
      };

      if (navigator.share) {
        await navigator.share(shareData);
        toast.success('Compartido exitosamente');
      } else {
        // Fallback: copiar URL al clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('URL copiada al portapapeles');
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
      toast.error('Error al compartir');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header de la página */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Explorador de Grafos de Wikipedia
            </h1>
            <p className="text-gray-600">
              Descubre las conexiones entre artículos de Wikipedia explorando el grafo de conocimiento
            </p>
          </div>

          {/* Acciones del header */}
          {currentGraph && (
            <div className="flex items-center space-x-3">
              {/* Botón de guardar - Solo para usuarios autenticados */}
              {isAuthenticated && !isGuest ? (
                <button
                  onClick={handleSaveGraph}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
                  disabled={isLoading}
                  title="Guardar esta exploración en tu cuenta"
                >
                  <Save size={16} />
                  <span>Guardar</span>
                </button>
              ) : (
                <div className="relative group">
                  <button
                    onClick={() => toast.error('Inicia sesión para guardar exploraciones')}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center space-x-2"
                    disabled
                  >
                    <Lock size={16} />
                    <span>Guardar</span>
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    Inicia sesión para guardar exploraciones
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleExportGraph}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                disabled={isLoading}
                title="Descargar el grafo como archivo JSON"
              >
                <Download size={16} />
                <span>Exportar</span>
              </button>
              
              <button
                onClick={handleShareGraph}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                disabled={isLoading}
                title="Compartir enlace de esta página"
              >
                <Share2 size={16} />
                <span>Compartir</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Mensaje informativo para usuarios invitados */}
        {isGuest && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="text-amber-600 text-sm">💡</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800 mb-1">
                  Modo Invitado
                </h3>
                <p className="text-sm text-amber-700">
                  Estás navegando como invitado. Puedes explorar y exportar grafos, pero no guardarlos. 
                  <a href="/register" className="font-medium underline hover:text-amber-900 ml-1">
                    Créate una cuenta
                  </a> para guardar tus exploraciones.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <SearchBar
          onArticleSelect={handleArticleSelect}
          placeholder="Buscar artículo de Wikipedia para comenzar la exploración..."
          disabled={isLoading}
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center">
            <AlertCircle className="text-red-600 mr-3" size={20} />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Construyendo el grafo...</h3>
          <p className="text-gray-600 mb-2">Analizando artículos y extrayendo conexiones</p>
          <p className="text-sm text-gray-500">
            Las exploraciones complejas pueden tardar hasta 90 segundos
          </p>
        </div>
      )}

      {/* Graph Visualization */}
      {currentGraph && !isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Grafo de Conocimiento
            </h3>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span> {currentGraph.total_nodes} nodos</span>
              <span> {currentGraph.total_edges} conexiones</span>
              <span> Profundidad: {currentGraph.max_depth}</span>
            </div>
            
            {/* Mostrar información de exploración cargada */}
            {location.state?.loadedExploration && (
              <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg inline-block">
                <span className="text-blue-800 text-sm font-medium">
                  Exploración cargada: {(location.state as any).loadedExploration.name}
                </span>
              </div>
            )}
          </div>
          
          {/* Main Content: Graph + Preview Panel */}
          <div className="flex h-[700px]">
            {/* Graph Visualization */}
            <div className={`transition-all duration-300 ${showPreview ? 'w-2/3' : 'w-full'}`}>
              <ErrorBoundary>
                <GraphVisualization
                  data={currentGraph}
                  graphData={currentGraph}
                  height="700px"
                  width="100%"
                  onNodeClick={handleNodeClick}
                  showControls={true}
                  showStats={true}
                />
              </ErrorBoundary>
            </div>
            
            {/* Article Preview Panel */}
            {showPreview && (
              <div className="w-1/3 h-full">
                <ArticlePreview
                  node={selectedNode}
                  isVisible={showPreview}
                  onClose={handleClosePreview}
                  onExpand={handleManualExpand}
                  isExpanding={selectedNode ? expandingNodes.has(selectedNode.id) : false}
                  className="h-full"
                />
              </div>
            )}
          </div>

          {/* Graph Stats */}
          <div className="p-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{currentGraph.total_nodes}</div>
                <div className="text-sm text-blue-700">Artículos</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{currentGraph.total_edges}</div>
                <div className="text-sm text-green-700">Conexiones</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {currentGraph.max_depth}
                </div>
                <div className="text-sm text-purple-700">Profundidad Máx</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {currentGraph.nodes.length}
                </div>
                <div className="text-sm text-orange-700">Nodos Únicos</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nodes List - Solo mostrar cuando no hay preview abierto */}
      {currentGraph && !isLoading && !showPreview && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Nodos en el Grafo</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentGraph.nodes.slice(0, 12).map((node) => (
              <div 
                key={node.id} 
                className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleNodeClick(node)}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: node.color || '#3b82f6' }}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {node.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      Nivel {node.depth} • Centralidad {(node.centrality || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {currentGraph.nodes.length > 12 && (
              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
                <p className="text-sm text-gray-600">
                  +{currentGraph.nodes.length - 12} más
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welcome/Help Section */}
      {!currentGraph && !isLoading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🌐</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Bienvenido al Explorador de Grafos de Wikipedia
            </h3>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Esta aplicación transforma artículos de Wikipedia en un grafo de conocimiento interactivo. 
              Usa algoritmos de exploración para descubrir conexiones entre conceptos y visualizar 
              cómo se relacionan las ideas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-3">🔍</div>
              <h4 className="font-semibold text-gray-900 mb-2">1. Busca</h4>
              <p className="text-sm text-gray-600">
                Introduce el nombre de cualquier artículo de Wikipedia
              </p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-3xl mb-3">🕸️</div>
              <h4 className="font-semibold text-gray-900 mb-2">2. Explora</h4>
              <p className="text-sm text-gray-600">
                El sistema analiza los enlaces y construye un grafo de conexiones
              </p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-semibold text-gray-900 mb-2">3. Descubre</h4>
              <p className="text-sm text-gray-600">
                Visualiza patrones y descubre relaciones inesperadas
              </p>
            </div>
          </div>

          {/* Example searches */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Ejemplos para empezar:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Albert Einstein',
                'Artificial Intelligence', 
                'Climate Change',
                'Python (programming language)',
                'Quantum Computing',
                'Renaissance'
              ].map((example) => (
                <button
                  key={example}
                  className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                  onClick={() => {
                    // This would trigger a search
                    console.log('Search for:', example);
                    handleArticleSelect({ 
                      page_id: Date.now(), 
                      title: example,
                      url: `https://en.wikipedia.org/wiki/${example.replace(/ /g, '_')}`,
                      summary: `Example search for ${example}`
                    });
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal para guardar exploración */}
      {showSaveModal && (
        <SaveExplorationModal
          currentGraph={currentGraph}
          onSave={saveCurrentExploration}
          onClose={() => setShowSaveModal(false)}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
