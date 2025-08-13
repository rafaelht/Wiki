/**
 * Panel de vista previa de artículos
 * 
 * Muestra una vista previa del artículo seleccionado con información
 * del nodo, resumen y metadatos del artículo de Wikipedia.
 */

import React from 'react';
import { GraphNode } from '../types';
import { ExternalLink, Globe, BookOpen, X } from 'lucide-react';

interface ArticlePreviewProps {
  node: GraphNode | null;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export const ArticlePreview: React.FC<ArticlePreviewProps> = ({
  node,
  isVisible,
  onClose,
  className = ''
}) => {
  if (!isVisible || !node) return null;

  const formatPageId = (pageId: number) => {
    return pageId.toLocaleString();
  };

  const getNodeLevelColor = (depth: number) => {
    const colors = {
      0: 'bg-blue-100 text-blue-800 border-blue-200',
      1: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      2: 'bg-amber-100 text-amber-800 border-amber-200',
      3: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[depth as keyof typeof colors] || 'bg-violet-100 text-violet-800 border-violet-200';
  };

  const handleExternalLink = () => {
    if (node.url) {
      window.open(node.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`bg-white border-l border-gray-200 shadow-lg flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {node.label}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getNodeLevelColor(node.depth)}`}>
                Nivel {node.depth}
              </span>
              {node.centrality && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                  Centralidad: {node.centrality.toFixed(3)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Cerrar vista previa"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content - Scrollable Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Metadata */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Globe className="h-4 w-4" />
              <span>Wikipedia</span>
            </div>
            {node.page_id && (
              <div className="flex items-center space-x-2 text-gray-600">
                <BookOpen className="h-4 w-4" />
                <span>ID: {formatPageId(node.page_id)}</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-gray-600">
              <span className="text-green-500">📊</span>
            </div>
          </div>
        </div>

        {/* Image Section */}
        {node.image_url && (
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex justify-center">
              <img
                src={node.image_url}
                alt={node.label}
                className="max-w-full h-auto max-h-64 rounded-lg shadow-md border border-gray-200"
                onError={(e) => {
                  // Ocultar imagen si falla la carga
                  const imgElement = e.target as HTMLImageElement;
                  imgElement.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Summary */}
        {node.summary && (
          <div className="px-6 py-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
              Resumen
            </h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {node.summary}
              </p>
            </div>
          </div>
        )}

        {/* Node Details */}
        <div className="px-6 py-4 border-t border-gray-100">
          <h4 className="font-medium text-gray-900 mb-3">Detalles del Nodo</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Identificador</span>
              <span className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                {node.id}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Profundidad</span>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${getNodeLevelColor(node.depth)}`}>
                {node.depth}
              </span>
            </div>

            {node.centrality && (
              <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">Centralidad</span>
                <span className="text-sm text-gray-900 font-mono">
                  {node.centrality.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Extra spacing to ensure content doesn't hide behind footer */}
        <div className="h-6"></div>
      </div>

      {/* Fixed Footer - Always Visible */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="space-y-3">
          <button
            onClick={handleExternalLink}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Ver en Wikipedia</span>
          </button>
          
          <div className="text-xs text-gray-500 text-center">
            Haz clic para explorar este nodo como punto de partida
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlePreview;
