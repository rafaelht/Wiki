/**
 * Componente Layout principal
 * 
 * Proporciona la estructura base de la aplicación con navegación,
 * header y contenido principal.
 */

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  GitBranch, 
  Search, 
  Save, 
  Info,
  Github,
  ExternalLink,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import clsx from 'clsx';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  path: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  requiresAuth?: boolean;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();

  const navigationItems: NavigationItem[] = [
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
      description: 'Exploraciones guardadas',
      requiresAuth: true // Requiere autenticación no-invitado
    },
    {
      path: '/about',
      name: 'Acerca de',
      icon: Info,
      description: 'Información del proyecto'
    }
  ];

  // Filtrar elementos según el estado de autenticación
  const visibleNavigationItems = navigationItems.filter(item => {
    if (item.requiresAuth && (!isAuthenticated || user?.role === 'guest')) {
      return false;
    }
    return true;
  });

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isUserMenuOpen && !target.closest('[data-user-menu]')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

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
              {visibleNavigationItems.map((item) => {
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

              {/* Menu de usuario */}
              {isAuthenticated && user && (
                <div className="relative" data-user-menu>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User size={16} />
                    <span className="hidden sm:block">{user.username}</span>
                    <ChevronDown size={14} />
                  </button>

                  {/* Dropdown menu */}
                  {isUserMenuOpen && (
                    <>
                      {/* Overlay for mobile */}
                      <div
                        className="fixed inset-0 z-30 md:hidden"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
                        <div className="p-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user.full_name || user.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <div className="p-1">
                          <button
                            onClick={() => {
                              logout();
                              setIsUserMenuOpen(false);
                            }}
                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <LogOut size={16} />
                            <span>Cerrar sesión</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Enlace a GitHub */}
              <a
                href="https://github.com/rafaelht/Wiki"
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
            <div className="flex flex-col h-full">
              <nav className="flex-1 p-4 space-y-2">
                {visibleNavigationItems.map((item) => {
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

            {/* User info and logout for mobile */}
            {isAuthenticated && user && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.full_name || user.username}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}

            {/* Footer del sidebar */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Prueba Técnica
                </p>
                <a
                  href="https://github.com/rafaelht/Wiki"
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
