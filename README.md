# Wikipedia Graph Explorer

Un explorador de conocimiento que transforma artículos de Wikipedia en un grafo interactivo, mostrando las conexiones entre conceptos.

## 🎯 ¿Qué hace esta aplicación?

- **Busca** cualquier artículo de Wikipedia
- **Analiza** todos los enlaces internos del artículo
- **Construye** un grafo visual de conexiones
- **Permite explorar** haciendo clic en nodos para expandir el conocimiento
- **Persiste** la sesión entre recargas de página
- **Limpia** el grafo para comenzar nuevas exploraciones

## ⚡ Inicio Rápido

```bash
# Clonar y ejecutar con un comando
git clone <tu-repositorio>
cd Wiki
./start.sh
```

**URLs después del inicio:**
- 🖥️ **Aplicación**: http://localhost:3000
- � **API**: http://localhost:8001
- � **Docs API**: http://localhost:8001/docs

## �️ Stack Tecnológico

### Backend
- **FastAPI** - API REST con documentación automática
- **MongoDB** - Base de datos para artículos y exploraciones
- **NetworkX** - Algoritmos de grafos
- **Wikipedia API** - Integración para búsqueda y contenido

### Frontend
- **React + TypeScript** - Interfaz moderna y type-safe
- **Zustand** - Estado global con persistencia
- **vis-network** - Visualización interactiva de grafos
- **Tailwind CSS** - Estilado responsive
- **JWT Authentication** - Sistema de autenticación

## 🎮 Funcionalidades Implementadas

### ✅ Exploración de Grafos
- Búsqueda inteligente de artículos de Wikipedia
- Construcción automática de grafos de conocimiento
- Visualización interactiva con física híbrida
- Expansión dinámica haciendo clic en nodos
- Posicionamiento estable de nodos

### ✅ Gestión de Estado
- Persistencia de autenticación entre sesiones
- Estado del grafo mantenido en recargas
- Sistema de huéspedes para exploración sin registro
- Eventos personalizados para sincronización

### ✅ Interfaz de Usuario
- Modo invitado y autenticado
- Pantalla de bienvenida con guías
- Barra de búsqueda con autocompletado
- Botón de limpiar grafo con confirmación
- Atajos de teclado (`Ctrl+R` para limpiar)

### ✅ Características Técnicas
- Sistema híbrido de física para estabilidad
- Manejo robusto de errores y timeouts
- Redirección automática tras logout
- Tooltips dinámicos con información contextual

## 📁 Estructura del Proyecto

```
Wiki/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── main.py         # Punto de entrada
│   │   ├── models/         # Modelos de datos
│   │   ├── routers/        # Endpoints REST
│   │   └── services/       # Lógica de negocio
│   └── requirements.txt
├── frontend/               # App React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas principales
│   │   ├── store/          # Estado global Zustand
│   │   └── services/       # Cliente API
│   └── package.json
├── start.sh               # Script de inicio automático
└── README.md
```

## 🔧 Comandos Útiles

```bash
# Desarrollo manual
cd backend && source venv/bin/activate && python -m uvicorn app.main:app --reload
cd frontend && npm run dev

# Ver logs del backend
tail -f backend/app.log

# Limpiar datos
rm -rf backend/__pycache__ frontend/node_modules/.cache
```

## 🧠 Características Técnicas Destacadas

### Algoritmos de Grafos
- **BFS** para exploración por niveles
- **Detección de ciclos** para evitar bucles infinitos
- **Métricas de centralidad** para nodos importantes
- **Sistema de pesos** basado en frecuencia de enlaces

### Optimizaciones de Performance
- **Física híbrida**: Activada para layout inicial, desactivada para estabilidad
- **Carga incremental**: Solo nuevos nodos se agregan al grafo
- **Debouncing**: En búsquedas para reducir llamadas API
- **Memoización**: De resultados de Wikipedia API

### Experiencia de Usuario
- **Confirmación inteligente**: Solo para grafos con contenido significativo
- **Estados de carga**: Indicadores visuales durante operaciones
- **Manejo de errores**: Mensajes informativos y recuperación automática
- **Accesibilidad**: Atajos de teclado y navegación clara

## 🎯 Demostración del Proyecto

Este proyecto demuestra:

1. **Arquitectura Full-Stack** moderna y escalable
2. **Integración de APIs** complejas (Wikipedia)
3. **Visualización de datos** interactiva
4. **Gestión de estado** avanzada con persistencia
5. **Algoritmos de grafos** aplicados a problemas reales
6. **UX/UI** pulida con feedback inmediato

---

**Nota**: Esta aplicación está optimizada para exploración de conocimiento. Cada búsqueda puede descubrir conexiones inesperadas entre conceptos, haciendo del aprendizaje una experiencia visual e interactiva.
