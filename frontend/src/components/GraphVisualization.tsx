import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { GraphVisualizationProps, GraphNode, GraphEdge } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Info, Eye } from 'lucide-react';

interface GraphVisualizationComponentProps extends GraphVisualizationProps {
  className?: string;
}

const GraphVisualization: React.FC<GraphVisualizationComponentProps> = ({ 
  data, 
  graphData,
  onNodeClick,
  onEdgeClick,
  height = 600,
  width = '100%',
  showControls = true,
  showStats = true,
  options: customOptions,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [isStatsVisible, setIsStatsVisible] = useState(false);
  const nodePositionsRef = useRef<Map<string, {x: number, y: number}>>(new Map());
  const isStabilizedRef = useRef(false);

  // Use either data or graphData prop
  const displayData = data || graphData || {
    nodes: [],
    edges: [],
    root_node: '',
    total_nodes: 0,
    total_edges: 0,
    max_depth: 0
  };

  // Transform graph data to vis-network format
  const transformDataForVis = useCallback(() => {
    // Validate and transform nodes
    const validNodes = displayData.nodes.filter(node => {
      if (!node.id || !node.label) {
        console.warn('⚠️ Invalid node found:', node);
        return false;
      }
      return true;
    });

    const nodes = validNodes.map((node: GraphNode) => {
      // Usar posición guardada si existe, de lo contrario dejar que la física la determine
      const savedPosition = nodePositionsRef.current.get(node.id);
      const nodeData: any = {
        id: node.id,
        label: node.label,
        title: `${node.label}\n${node.summary || 'Click para más información'}`,
        color: {
          background: node.color || getNodeColor(node.depth),
          border: node.depth === 0 ? '#ff6b6b' : '#2c3e50',
          highlight: {
            background: '#ffd93d',
            border: '#ff6b6b'
          }
        },
        size: node.size || (node.depth === 0 ? 30 : Math.max(10, 20 - node.depth * 2)),
        font: {
          size: 12,
          color: '#2c3e50'
        },
        borderWidth: node.depth === 0 ? 3 : 2,
        shape: 'dot'
      };

      // Si tenemos posición guardada, usarla
      if (savedPosition) {
        nodeData.x = savedPosition.x;
        nodeData.y = savedPosition.y;
        nodeData.fixed = true; // Fijar posición
      }

      return nodeData;
    });

    // Validate and transform edges
    const validEdges = displayData.edges.filter(edge => {
      const fromNode = edge.from || edge.from_node;
      const toNode = edge.to || edge.to_node;
      
      if (!fromNode || !toNode) {
        console.warn('⚠️ Invalid edge found (missing from/to nodes):', edge);
        return false;
      }
      
      // Check if both nodes exist in the nodes array
      const fromExists = validNodes.some(node => node.id === fromNode);
      const toExists = validNodes.some(node => node.id === toNode);
      
      if (!fromExists || !toExists) {
        console.warn('⚠️ Edge references non-existent nodes:', edge, { fromExists, toExists });
        return false;
      }
      
      return true;
    });

    const edges = validEdges.map((edge: GraphEdge) => {
      const fromNode = edge.from || edge.from_node;
      const toNode = edge.to || edge.to_node;
      const edgeId = edge.id || `${fromNode}-${toNode}`;
      
      return {
        id: edgeId,
        from: fromNode,
        to: toNode,
        width: Math.max(1, (edge.weight || 1) * 2),
        color: '#95a5a6',
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.8
          }
        },
        smooth: true
      };
    });

    // Check for duplicate edge IDs and make them unique
    const edgeIds = edges.map(e => e.id);
    const duplicateIds = edgeIds.filter((id, index) => edgeIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      console.warn('⚠️ Duplicate edge IDs found:', duplicateIds);
      
      // Make edge IDs unique by adding index
      const seenIds = new Set<string>();
      edges.forEach((edge) => {
        let finalId = edge.id;
        let counter = 1;
        
        while (seenIds.has(finalId)) {
          finalId = `${edge.id}-${counter}`;
          counter++;
        }
        
        seenIds.add(finalId);
        edge.id = finalId;
      });
    }

    return { nodes: new DataSet(nodes), edges: new DataSet(edges) };
  }, [displayData]);

  // Get node color based on depth
  const getNodeColor = (depth: number): string => {
    const colors = [
      '#e74c3c', // Red for root (depth 0)
      '#3498db', // Blue for depth 1
      '#2ecc71', // Green for depth 2
      '#f39c12', // Orange for depth 3
      '#9b59b6', // Purple for depth 4
      '#1abc9c', // Teal for depth 5+
    ];
    return colors[Math.min(depth, colors.length - 1)];
  };

  // Default vis-network options
  const defaultOptions = {
    physics: {
      enabled: true,
      stabilization: {
        enabled: true,
        iterations: 200,
        updateInterval: 25
      },
      solver: 'repulsion',
      repulsion: {
        nodeDistance: 120,
        centralGravity: 0.3,
        springLength: 100,
        springConstant: 0.05,
        damping: 0.09
      }
    },
    layout: {
      improvedLayout: true,
      randomSeed: 42 // Semilla fija para layout consistente
    },
    interaction: {
      hover: true,
      tooltipDelay: 200,
      dragNodes: true, // Permitir arrastrar para ajustes menores
      zoomView: true,
      dragView: true
    },
    nodes: {
      font: {
        size: 12,
        color: '#2c3e50'
      },
      borderWidth: 2,
      shadow: true
    },
    edges: {
      width: 1,
      arrows: {
        to: {
          enabled: true
        }
      },
      smooth: true
    }
  };

  // Merge custom options with defaults
  const networkOptions = { ...defaultOptions, ...customOptions };

  // Initialize network
  useEffect(() => {
    if (!containerRef.current || displayData.nodes.length === 0) return;

    const visData = transformDataForVis();
    
    // Si es la primera vez o hay nodos nuevos, reinicializar
    const existingNodeIds = Array.from(nodePositionsRef.current.keys());
    const currentNodeIds = displayData.nodes.map(n => n.id);
    const hasNewNodes = currentNodeIds.some(id => !existingNodeIds.includes(id));
    
    if (!networkRef.current) {
      // Primera inicialización
      networkRef.current = new Network(containerRef.current, visData, networkOptions as any);
      isStabilizedRef.current = false;
    } else if (hasNewNodes) {
      // Hay nodos nuevos - actualizar datos y reactivar física temporalmente
      console.log('📈 Nodos nuevos detectados - aplicando física temporal');
      networkRef.current.setOptions({ physics: { enabled: true } });
      networkRef.current.setData(visData);
      isStabilizedRef.current = false;
    } else {
      // Solo actualizar datos sin cambiar física
      networkRef.current.setData(visData);
    }

    // Event handler para cuando se estabiliza la física
    const handleStabilization = () => {
      if (isStabilizedRef.current) return; // Ya estabilizado
      
      console.log('🔒 Grafo estabilizado - guardando posiciones');
      
      // Guardar posiciones actuales
      const positions = networkRef.current!.getPositions();
      
      Object.keys(positions).forEach(nodeId => {
        nodePositionsRef.current.set(nodeId, {
          x: positions[nodeId].x,
          y: positions[nodeId].y
        });
      });
      
      // Marcar como estabilizado y deshabilitar física
      isStabilizedRef.current = true;
      networkRef.current!.setOptions({
        physics: { enabled: false }
      });
      
      console.log(`💾 Posiciones guardadas para ${nodePositionsRef.current.size} nodos`);
    };

    // Limpiar eventos anteriores y agregar nuevos
    networkRef.current.off('stabilizationIterationsDone');
    networkRef.current.on('stabilizationIterationsDone', handleStabilization);

    // Event handlers
    networkRef.current.on('click', (event) => {
      if (event.nodes.length > 0) {
        const nodeId = event.nodes[0];
        const node = displayData.nodes.find((n: GraphNode) => n.id === nodeId);
        if (node) {
          // Centrar y hacer zoom al nodo seleccionado
          focusOnNode(nodeId);
          
          // Llamar al callback original si existe
          onNodeClick?.(node);
        }
      } else if (event.edges.length > 0) {
        const edgeId = event.edges[0];
        const edge = displayData.edges.find((e: GraphEdge) => 
          (e.id || `${e.from_node}-${e.to_node}`) === edgeId
        );
        if (edge) {
          onEdgeClick?.(edge);
        }
      } else {
        // Clic en el fondo: resetear resaltado
        resetHighlight();
      }
    });

    networkRef.current.on('hoverNode', () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'pointer';
      }
    });

    networkRef.current.on('blurNode', () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
    });

    // Cleanup
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [displayData, transformDataForVis, networkOptions, onNodeClick, onEdgeClick]);

  // Control functions
  const zoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 1.2 });
    }
  };

  const zoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({ scale: scale * 0.8 });
    }
  };

  const resetView = () => {
    if (networkRef.current) {
      networkRef.current.fit();
    }
  };

  // Nueva función para centrar y hacer zoom a un nodo específico
  const focusOnNode = (nodeId: string) => {
    if (!networkRef.current) return;

    try {
      // Solo centrar vista en el nodo y hacer zoom SIN cambiar estilos
      // Esto evita que se muevan las posiciones de los nodos
      networkRef.current.focus(nodeId, {
        scale: 1.5,
        animation: {
          duration: 800,
          easingFunction: 'easeInOutQuad'
        }
      });

      console.log(`🎯 Centrado en nodo: ${nodeId}`);
    } catch (error) {
      console.error('Error al centrar en el nodo:', error);
    }
  };

  // Nueva función para resetear el resaltado
  const resetHighlight = () => {
    if (!networkRef.current) return;

    try {
      // Ya no necesitamos resetear estilos porque no los cambiamos en focusOnNode
      // Solo hacer fit para mostrar todo el grafo
      networkRef.current.fit({
        animation: {
          duration: 500,
          easingFunction: 'easeInOutQuad'
        }
      });
      
      console.log('🔄 Vista reseteada');
    } catch (error) {
      console.error('Error al resetear vista:', error);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  if (displayData.nodes.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center"
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
          <div className="text-center text-gray-500">
            <div className="mb-2">
              <Info size={48} className="mx-auto mb-2 opacity-50" />
            </div>
            <p className="text-lg font-medium">No hay datos para visualizar</p>
            <p className="text-sm">Busca un artículo de Wikipedia para comenzar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main visualization container */}
      <div 
        ref={containerRef}
        className="border border-gray-300 rounded-lg bg-white relative"
        style={{ 
          height: typeof height === 'number' ? `${height}px` : height,
          width: typeof width === 'number' ? `${width}px` : width
        }}
      />

      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={zoomIn}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Acercar"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={zoomOut}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Alejar"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={resetView}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Reiniciar vista"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={resetHighlight}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Quitar resaltado"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors"
            title="Pantalla completa"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      )}

      {/* Stats panel */}
      {showStats && (
        <div className="absolute top-4 left-4">
          <button
            onClick={() => setIsStatsVisible(!isStatsVisible)}
            className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors mb-2"
            title="Mostrar estadísticas"
          >
            <Info size={16} />
          </button>
          
          {isStatsVisible && (
            <div className="bg-white rounded-lg shadow-lg p-4 min-w-48">
              <h3 className="font-semibold mb-3 text-gray-800">Estadísticas del Grafo</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Nodos:</span>
                  <span className="font-medium">{displayData.total_nodes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aristas:</span>
                  <span className="font-medium">{displayData.total_edges}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profundidad máxima:</span>
                  <span className="font-medium">{displayData.max_depth}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nodo raíz:</span>
                  <span className="font-medium text-red-600">{displayData.root_node}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export { GraphVisualization };
export default GraphVisualization;
