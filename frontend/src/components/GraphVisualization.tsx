import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { GraphVisualizationProps, GraphNode, GraphEdge } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Info } from 'lucide-react';

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

    const nodes = validNodes.map((node: GraphNode) => ({
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
    }));

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
        iterations: 100
      }
    },
    layout: {
      improvedLayout: true
    },
    interaction: {
      hover: true,
      tooltipDelay: 200
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
    networkRef.current = new Network(containerRef.current, visData, networkOptions as any);

    // Event handlers
    networkRef.current.on('click', (event) => {
      if (event.nodes.length > 0) {
        const nodeId = event.nodes[0];
        const node = displayData.nodes.find((n: GraphNode) => n.id === nodeId);
        if (node) {
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
