/**
 * Página de información del proyecto
 * 
 * Contiene documentación técnica, características y detalles de implementación.
 */

import { 
  Github, 
  ExternalLink, 
  Code, 
  Database, 
  Zap,
  GitBranch,
  Target,
  Users,
  BookOpen
} from 'lucide-react';

export function AboutPage() {
  const technologies = {
    backend: [
      { name: 'FastAPI', description: 'Framework web moderno y rápido para Python' },
      { name: 'Motor', description: 'Driver asíncrono para MongoDB' },
      { name: 'NetworkX', description: 'Biblioteca para análisis de grafos' },
      { name: 'BeautifulSoup', description: 'Parsing de HTML y XML' },
      { name: 'HTTPX', description: 'Cliente HTTP asíncrono' },
      { name: 'Pydantic', description: 'Validación de datos con type hints' }
    ],
    frontend: [
      { name: 'React 18', description: 'Biblioteca para interfaces de usuario' },
      { name: 'TypeScript', description: 'Superset tipado de JavaScript' },
      { name: 'Vite', description: 'Herramienta de build ultrarrápida' },
      { name: 'Tailwind CSS', description: 'Framework CSS utility-first' },
      { name: 'Zustand', description: 'Gestión de estado minimalista' },
      { name: 'vis.js', description: 'Visualización de grafos y redes' }
    ],
    infrastructure: [
      { name: 'MongoDB', description: 'Base de datos NoSQL orientada a documentos' },
      { name: 'Docker', description: 'Contenedorización de aplicaciones' },
      { name: 'Docker Compose', description: 'Orchestración de servicios' },
      { name: 'GitHub Actions', description: 'CI/CD integrado' }
    ]
  };

  const algorithms = [
    {
      name: 'Búsqueda en Anchura (BFS)',
      description: 'Explora el grafo nivel por nivel desde un nodo inicial',
      useCase: 'Construcción de grafos de conocimiento con profundidad controlada'
    },
    {
      name: 'Cálculo de Centralidad',
      description: 'Identifica nodos importantes basado en sus conexiones',
      useCase: 'Destacar artículos clave en el grafo de conocimiento'
    },
    {
      name: 'Detección de Componentes',
      description: 'Encuentra grupos de nodos conectados',
      useCase: 'Análisis de la estructura y conectividad del grafo'
    },
    {
      name: 'Pathfinding',
      description: 'Encuentra la ruta más corta entre dos nodos',
      useCase: 'Descubrir conexiones indirectas entre conceptos'
    }
  ];

  const features = [
    {
      icon: <Code className="h-6 w-6" />,
      title: 'API RESTful Completa',
      description: 'Endpoints documentados con OpenAPI/Swagger para todas las operaciones',
      status: '✅ Completo'
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: 'Base de Datos Optimizada',
      description: 'MongoDB con índices optimizados para consultas de grafos',
      status: '✅ Completo'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Procesamiento Asíncrono',
      description: 'Manejo eficiente de requests concurrentes usando async/await',
      status: '✅ Completo'
    },
    {
      icon: <GitBranch className="h-6 w-6" />,
      title: 'Visualización Interactiva',
      description: 'Grafo interactivo con zoom, pan y selección de nodos',
      status: '🔄 En desarrollo'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wikipedia Graph Explorer
          </h1>
          <p className="text-xl text-gray-700 mb-6">
            Transforma Wikipedia en un grafo de conocimiento interactivo
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Github size={18} />
              <span>Ver en GitHub</span>
              <ExternalLink size={14} />
            </a>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <BookOpen size={18} />
              <span>API Docs</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Objetivo */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center space-x-3 mb-6">
          <Target className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Objetivo del Proyecto</h2>
        </div>
        
        <div className="prose max-w-none text-gray-600">
          <p className="text-lg leading-relaxed mb-6">
            Este proyecto es una <strong>demostración técnica</strong> que convierte Wikipedia en un grafo 
            de conocimiento interactivo. Permite explorar cómo se conectan los artículos a través de sus 
            enlaces internos, revelando patrones y relaciones ocultas en el conocimiento humano.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">🎯 Propósito Técnico</h3>
              <ul className="text-sm space-y-2">
                <li>• Demostrar arquitectura full-stack moderna</li>
                <li>• Implementar algoritmos de grafos</li>
                <li>• Integración con APIs externas</li>
                <li>• Visualización de datos complejos</li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">🌟 Valor Añadido</h3>
              <ul className="text-sm space-y-2">
                <li>• Exploración visual del conocimiento</li>
                <li>• Descubrimiento de conexiones inesperadas</li>
                <li>• Análisis de estructuras de información</li>
                <li>• Herramienta educativa interactiva</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Tecnologías */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Stack Tecnológico</h2>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Code className="h-5 w-5 text-blue-600" />
              <span>Backend</span>
            </h3>
            <div className="space-y-3">
              {technologies.backend.map((tech) => (
                <div key={tech.name} className="bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-gray-900">{tech.name}</div>
                  <div className="text-sm text-gray-600">{tech.description}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <span>Frontend</span>
            </h3>
            <div className="space-y-3">
              {technologies.frontend.map((tech) => (
                <div key={tech.name} className="bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-gray-900">{tech.name}</div>
                  <div className="text-sm text-gray-600">{tech.description}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600" />
              <span>Infraestructura</span>
            </h3>
            <div className="space-y-3">
              {technologies.infrastructure.map((tech) => (
                <div key={tech.name} className="bg-gray-50 rounded-lg p-3">
                  <div className="font-medium text-gray-900">{tech.name}</div>
                  <div className="text-sm text-gray-600">{tech.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Algoritmos */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Algoritmos Implementados</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {algorithms.map((algorithm) => (
            <div key={algorithm.name} className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {algorithm.name}
              </h3>
              <p className="text-gray-600 mb-4">{algorithm.description}</p>
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-sm font-medium text-blue-900">Caso de uso:</div>
                <div className="text-sm text-blue-800">{algorithm.useCase}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Características */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Características Principales</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg text-blue-600">
                {feature.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <span className="text-sm px-2 py-1 bg-white rounded-full">{feature.status}</span>
                </div>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arquitectura */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Arquitectura del Sistema</h2>
        
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Flujo de Datos</h3>
            <p className="text-gray-600">Desde la búsqueda hasta la visualización</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <div className="font-medium text-gray-900">Frontend React</div>
              <div className="text-sm text-gray-600">Interfaz de usuario</div>
            </div>
            
            <div className="text-gray-400">→</div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <div className="font-medium text-gray-900">FastAPI Backend</div>
              <div className="text-sm text-gray-600">Lógica de negocio</div>
            </div>
            
            <div className="text-gray-400">→</div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div className="font-medium text-gray-900">Wikipedia API</div>
              <div className="text-sm text-gray-600">Fuente de datos</div>
            </div>
            
            <div className="text-gray-400">→</div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-orange-600 font-bold">4</span>
              </div>
              <div className="font-medium text-gray-900">MongoDB</div>
              <div className="text-sm text-gray-600">Almacenamiento</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enlaces útiles */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Enlaces Útiles</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <a
            href="http://localhost:8000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <div className="font-medium text-gray-900">Backend API</div>
              <div className="text-sm text-gray-600">Servidor FastAPI en desarrollo</div>
            </div>
            <ExternalLink className="h-5 w-5 text-gray-400" />
          </a>
          
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <div className="font-medium text-gray-900">Documentación API</div>
              <div className="text-sm text-gray-600">Swagger UI interactivo</div>
            </div>
            <ExternalLink className="h-5 w-5 text-gray-400" />
          </a>
          
          <a
            href="https://en.wikipedia.org/wiki/Main_Page"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <div className="font-medium text-gray-900">Wikipedia</div>
              <div className="text-sm text-gray-600">Fuente de datos principal</div>
            </div>
            <ExternalLink className="h-5 w-5 text-gray-400" />
          </a>
          
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div>
              <div className="font-medium text-gray-900">Código Fuente</div>
              <div className="text-sm text-gray-600">Repositorio en GitHub</div>
            </div>
            <ExternalLink className="h-5 w-5 text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
