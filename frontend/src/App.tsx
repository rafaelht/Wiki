/**
 * Componente principal de la aplicación Wikipedia Graph Explorer
 * 
 * Maneja el routing y la estructura general de la aplicación,
 * proporcionando navegación entre las diferentes vistas.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ExplorerPage } from './pages/ExplorerPage';
import { ExplorationsPage } from './pages/ExplorationsPage';
import { AboutPage } from './pages/AboutPage';

function App() {
  return (
    <Layout>
      <Routes>
        {/* Ruta principal - Explorador de grafos */}
        <Route path="/" element={<ExplorerPage />} />
        
        {/* Página de exploraciones guardadas */}
        <Route path="/explorations" element={<ExplorationsPage />} />
        
        {/* Página de información del proyecto */}
        <Route path="/about" element={<AboutPage />} />
        
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
