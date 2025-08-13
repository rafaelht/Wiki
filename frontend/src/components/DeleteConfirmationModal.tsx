/**
 * Modal de confirmación para eliminar exploraciones
 * 
 * Proporciona una interfaz más elegante que el alert nativo del navegador
 */

import { X, Trash2, AlertTriangle } from 'lucide-react';
import { SavedExploration } from '../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  exploration: SavedExploration | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({ 
  isOpen, 
  exploration, 
  onConfirm, 
  onCancel 
}: DeleteConfirmationModalProps) {
  if (!isOpen || !exploration) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 px-6 py-4 border-b border-red-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="text-red-600" size={20} />
              </div>
              <h3 className="text-lg font-semibold text-red-900">
                Eliminar Exploración
              </h3>
            </div>
            <button
              onClick={onCancel}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-3 mb-6">
            <AlertTriangle className="text-amber-500 mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="text-gray-900 font-medium mb-2">
                ¿Estás seguro de que quieres eliminar esta exploración?
              </p>
              <p className="text-gray-600 text-sm mb-4">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>

          {/* Exploration details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">
              {exploration.name}
            </h4>
            {exploration.description && (
              <p className="text-gray-600 text-sm mb-3">
                {exploration.description}
              </p>
            )}
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Nodo raíz:</span>
                <span className="font-medium">{exploration.root_node}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Nodos totales:</span>
                <span className="font-medium">{exploration.graph_data?.nodes?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Conexiones:</span>
                <span className="font-medium">{exploration.graph_data?.edges?.length || 0}</span>
              </div>
              {exploration.created_at && (
                <div className="flex items-center justify-between">
                  <span>Creado:</span>
                  <span className="font-medium">
                    {new Date(exploration.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
              <div className="text-amber-800 text-sm">
                <p className="font-medium mb-1">Se perderán permanentemente:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>El grafo completo con todos sus nodos y conexiones</li>
                  <li>La estructura y configuración del grafo</li>
                  <li>Todas las etiquetas y metadatos asociados</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
