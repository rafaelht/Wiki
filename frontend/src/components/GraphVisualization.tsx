import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Network } from 'vis-network/standalone';
import { DataSet } from 'vis-data/esnext';
import { 
  GraphData, 
  GraphNode, 
  GraphEdge, 
  NetworkOptions,
  GraphVisualizationProps 
} from '../types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Settings, 
  Download,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface GraphVisualizationComponentProps extends GraphVisualizationProps {
  className?: string;
  showControls?: boolean;
  showStats?: boolean;
}

export const GraphVisualization: React.FC<GraphVisualizationComponentProps> = ({
  data,
  onNodeClick,
  onEdgeClick,
  height = '600px',
  width = '100%',
  options: customOptions,
  className = '',
  showControls = true,
  showStats = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    scale: 1,
    position: { x: 0, y: 0 },
    selectedNodes: 0,
    selectedEdges: 0
  });

  // Default network options
  const defaultOptions: NetworkOptions = {
    nodes: {
      shape: 'dot',
      size: 20,
      font: {
        size: 14,
        color: '#333333'
      },
      borderWidth: 2,
      shadow: true,
      chosen: {
        node: (values, id, selected, hovering) => {
          if (hovering || selected) {
            values.size = 25;
            values.borderWidth = 3;
          }
        }
      }
    },
    edges: {
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.8
        }
      },
      color: {
        color: '#848484',
        highlight: '#3b82f6',
        hover: '#60a5fa'
      },
      width: 2,
      smooth: {
        enabled: true,
        type: 'dynamic',
        roundness: 0.5
      },
      chosen: {
        edge: (values, id, selected, hovering) => {
          if (hovering || selected) {
            values.width = 4;
          }
        }
      }
    },
    physics: {
      enabled: true,
      solver: 'hierarchicalRepulsion',
      hierarchicalRepulsion: {
        nodeDistance: 120,
        centralGravity: 0.3,
        springLength: 100,
        springConstant: 0.01,
        damping: 0.09
      }
    },
    layout: {
      hierarchical: {
        enabled: false,
        direction: 'UD',
        sortMethod: 'directed',
        levelSeparation: 150,
        nodeSpacing: 100,
        treeSpacing: 200
      }
    },
    interaction: {
      hover: true,
      tooltipDelay: 300,
      hideEdgesOnDrag: false,
      hideNodesOnDrag: false
    }
  };

  // Merge custom options with defaults
  const finalOptions = React.useMemo(() => {
    return customOptions ? { ...defaultOptions, ...customOptions } : defaultOptions;
  }, [customOptions]);

  // Convert graph data to vis.js format
  const convertToVisData = useCallback((graphData: GraphData) => {
    const nodes = new DataSet(graphData.nodes.map(node => ({
      id: node.id,
      label: node.label,
      title: `<b>${node.label}</b><br/>Level: ${node.depth}<br/>Degree: ${node.degree || 0}${node.centrality ? `<br/>Centrality: ${node.centrality.toFixed(3)}` : ''}`,
      level: node.depth,
      color: node.color || getNodeColor(node.depth),
      size: node.size || getNodeSize(node.degree || 0),
      ...node
    })));

    const edges = new DataSet(graphData.edges.map((edge, index) => ({
      id: `edge-${index}`,
      from: edge.from,
      to: edge.to,
      width: edge.weight || 1,
      arrows: { to: true }
    })));

    return { nodes, edges };
  }, []);

  // Helper functions for styling
  const getNodeColor = (level: number): string => {
    const colors = [
      '#3b82f6', // blue-500 (level 0)
      '#10b981', // emerald-500 (level 1)
      '#f59e0b', // amber-500 (level 2)
      '#ef4444', // red-500 (level 3)
      '#8b5cf6', // violet-500 (level 4+)
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  const getNodeSize = (degree: number): number => {
    return Math.max(15, Math.min(40, 15 + degree * 2));
  };

  // Initialize network
  useEffect(() => {
    if (!containerRef.current || !data) return;

    setIsLoading(true);

    try {
      const visData = convertToVisData(data);
      
      // Create network
      const network = new Network(containerRef.current, visData, finalOptions);
      networkRef.current = network;

      // Event handlers
      network.on('click', (params) => {
        if (params.nodes.length > 0 && onNodeClick) {
          const nodeId = params.nodes[0];
          const node = data.nodes.find(n => n.id === nodeId);
          if (node) onNodeClick(node);
        }
        
        if (params.edges.length > 0 && onEdgeClick) {
          const edgeId = params.edges[0];
          const edge = data.edges.find(e => e.id === edgeId);
          if (edge) onEdgeClick(edge);
        }
      });

      network.on('zoom', (params) => {
        setNetworkStats(prev => ({
          ...prev,
          scale: params.scale
        }));
      });

      network.on('dragEnd', (params) => {
        const position = network.getViewPosition();
        setNetworkStats(prev => ({
          ...prev,
          position
        }));
      });

      network.on('selectNode', (params) => {
        setNetworkStats(prev => ({
          ...prev,
          selectedNodes: params.nodes.length
        }));
      });

      network.on('selectEdge', (params) => {
        setNetworkStats(prev => ({
          ...prev,
          selectedEdges: params.edges.length
        }));
      });

      network.on('deselectNode', () => {
        setNetworkStats(prev => ({
          ...prev,
          selectedNodes: 0
        }));
      });

      network.on('deselectEdge', () => {
        setNetworkStats(prev => ({
          ...prev,
          selectedEdges: 0
        }));
      });

      // Fit network after stabilization
      network.once('stabilizationIterationsDone', () => {
        network.fit({
          animation: {
            duration: 1000,
            easingFunction: 'easeInOutQuad'
          }
        });
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Error initializing network:', error);
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [data, finalOptions, convertToVisData, onNodeClick, onEdgeClick]);

  // Control functions
  const zoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale() * 1.2;
      networkRef.current.moveTo({ scale });
    }
  };

  const zoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale() * 0.8;
      networkRef.current.moveTo({ scale });
    }
  };

  const resetView = () => {
    if (networkRef.current) {
      networkRef.current.fit({
        animation: {
          duration: 500,
          easingFunction: 'easeInOutQuad'
        }
      });
    }
  };

  const exportNetwork = () => {
    if (!networkRef.current || !containerRef.current) return;

    try {
      const canvas = containerRef.current.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        const link = document.createElement('a');
        link.download = `wikipedia-graph-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
    } catch (error) {
      console.error('Error exporting network:', error);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const containerStyle = {
    height: typeof height === 'string' ? height : `${height}px`,
    width: typeof width === 'string' ? width : `${width}px`
  };

  return (
    <div className={`relative bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className} ${isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : ''}`}>
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Construyendo grafo...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-1">
            <button
              onClick={zoomIn}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            
            <button
              onClick={zoomOut}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            
            <button
              onClick={resetView}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Ajustar vista"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            
            <button
              onClick={exportNetwork}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Exportar imagen"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Stats panel */}
      {showStats && (
        <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-md border border-gray-200 p-3 text-sm">
          <div className="space-y-1">
            <div className="font-medium text-gray-900">Estadísticas del Grafo</div>
            <div className="text-gray-600">
              Nodos: <span className="font-medium">{data.total_nodes}</span>
            </div>
            <div className="text-gray-600">
              Conexiones: <span className="font-medium">{data.total_edges}</span>
            </div>
            <div className="text-gray-600">
              Zoom: <span className="font-medium">{(networkStats.scale * 100).toFixed(0)}%</span>
            </div>
            {networkStats.selectedNodes > 0 && (
              <div className="text-blue-600">
                Seleccionados: <span className="font-medium">{networkStats.selectedNodes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Network container */}
      <div
        ref={containerRef}
        style={containerStyle}
        className="w-full h-full"
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-white rounded-lg shadow-md border border-gray-200 p-3 text-xs">
        <div className="font-medium text-gray-900 mb-2">Leyenda</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-600">Nivel 0 (Inicial)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-gray-600">Nivel 1</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-gray-600">Nivel 2</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-gray-600">Nivel 3+</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-gray-500">Tamaño = Grado de conexión</div>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;
