/**
 * Componente Layout principal
 * 
 * Proporciona la estructura base de la aplicación con navegación,
 * header y contenido principal.
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  GitBranch, 
  Search, 
  Save, 
  Info,
  Github,
  ExternalLink 
} from 'lucide-react';
import { useNavigationActions } from '../store/graphStore';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { canGoBack, goBack } = useNavigationActions();

  const navigationItems = [
    {
      path: '/',
      name: 'Explorador',
      icon: Search,
      description: 'Explora grafos de conocimiento'
    },
    {
      path: '/explorations',
      name: 'Exploraciones',
      icon: Save,
      description: 'Exploraciones guardadas'
    },
    {
      path: '/about',
      name: 'Acerca de',
      icon: Info,
      description: 'Información del proyecto'
    }
  ];

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 md:hidden"
              >
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="p-2 bg-primary-600 rounded-lg group-hover:bg-primary-700 transition-colors">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Wikipedia Graph Explorer
                  </h1>
                  <p className="text-sm text-gray-500 hidden sm:block">
                    Explorador de Conocimiento Conectado
                  </p>
                </div>
              </Link>
            </div>

            {/* Navegación desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                      'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isCurrentPath(item.path)
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Botón de volver */}
              {canGoBack() && (
                <button
                  onClick={goBack}
                  className="btn-outline text-sm"
                  title="Volver a la exploración anterior"
                >
                  ← Volver
                </button>
              )}

              {/* Enlace a GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ver código en GitHub"
              >
                <Github size={18} />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar móvil */}
      {isSidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 z-50 md:hidden overflow-y-auto">
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={clsx(
                      'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                      isCurrentPath(item.path)
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    <Icon size={20} />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Footer del sidebar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Prueba Técnica
                </p>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  <Github size={16} />
                  <span>Ver código</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Wikipedia Graph Explorer - Desarrollado como prueba técnica
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Utiliza la API pública de Wikipedia para crear visualizaciones interactivas
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
