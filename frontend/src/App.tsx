/**
 * Componente principal de la aplicación Wikipedia Graph Explorer
 * 
 * Maneja el routing y la estructura general de la aplicación,
 * proporcionando navegación entre las diferentes vistas.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { ExplorerPage } from './pages/ExplorerPage';
import { ExplorationsPage } from './pages/ExplorationsPage';
import { AboutPage } from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated, isGuest, isInitializing, initializeAuth } = useAuthStore();

  // Initialize auth state on app load
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Show loading during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Inicializando aplicación...</h2>
          <p className="text-gray-500 mt-2">Verificando estado de autenticación</p>
        </div>
      </div>
    );
  }

  // Componente para la ruta principal que redirije según el estado de autenticación
  const HomePage = () => {
    if (isAuthenticated || isGuest) {
      return <ExplorerPage />;
    }
    return <Navigate to="/login" replace />;
  };

  return (
    <>
      {/* Proveedor de notificaciones */}
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{
          zIndex: 10000,
        }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            fontSize: '14px',
            padding: '12px 16px',
            maxWidth: '420px',
            fontFamily: 'inherit',
          },
          success: {
            duration: 3000,
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
            },
          },
        }}
      />

      <Routes>
        {/* Rutas de autenticación sin Layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Rutas con Layout para usuarios autenticados */}
        <Route path="/*" element={
          <Layout>
            <Routes>
              {/* Ruta principal - Redirije según autenticación */}
              <Route path="/" element={<HomePage />} />
              
              {/* Explorador de grafos */}
              <Route path="/explorer" element={<ExplorerPage />} />
              
              {/* Página de exploraciones guardadas */}
              <Route path="/explorations" element={<ExplorationsPage />} />
              
              {/* Página de información del proyecto */}
              <Route path="/about" element={<AboutPage />} />
              
              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </>
  );
}

export default App;
