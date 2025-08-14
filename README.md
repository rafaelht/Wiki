# Wikipedia Graph Explorer

**URLs:**
- **Aplicación**: http://localhost:3000
- **API**: http://localhost:8001
- **Docs API**: http://localhost:8001/docs

## ¿Qué hace esta aplicación?

- **Busca** cualquier artículo de Wikipedia
- **Analiza** todos los enlaces internos del artículo
- **Construye** un grafo visual de conexiones
- **Permite explorar** haciendo clic en nodos para expandir el conocimiento
- **Persiste** la sesión entre recargas de página
- **Limpia** el grafo para comenzar nuevas exploraciones

## Inicio Rápido

```bash
# Clonar y ejecutar con un comando
git clone <https://github.com/rafaelht/Wiki.git>
cd Wiki
./start.sh
```
## Stack Tecnológico

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

## Decisiones de Arquitectura y Diseño

### ¿Por qué MongoDB para el esquema de base de datos?

**Decisión**: Elegí MongoDB como base de datos principal por las siguientes razones fundamentales:

1. **Naturaleza de los datos de grafo**: Los datos de Wikipedia tienen una estructura naturalmente anidada y variable. Cada artículo puede tener diferentes campos (algunos tienen imágenes, otros no; diferentes longitudes de resúmenes, etc.). MongoDB permite esta flexibilidad sin esquemas rígidos.

2. **Estructura del grafo como documento**: El grafo completo se almacena como un documento JSON en la colección `explorations`. Esto permite:
   - **Atomicidad**: Todo el grafo se guarda o recupera como una unidad
   - **Performance**: Una sola consulta para obtener todo el grafo
   - **Flexibilidad**: Fácil adición de nuevos campos al grafo sin migraciones

3. **Escalabilidad horizontal**: MongoDB permite sharding fácil si el sistema crece
4. **Búsquedas complejas**: Índices compuestos para búsquedas por usuario, tags, fechas
5. **Integración natural con FastAPI**: Pydantic y Motor proporcionan una integración seamless

### Desafíos al modelar el grafo

**Desafío 1: Representación eficiente**
- **Problema**: ¿Almacenar cada edge como documento separado o como parte del grafo?
- **Solución**: Opté por almacenar todo el grafo como un documento JSON porque:
  - Los grafos de exploración son relativamente pequeños (30-200 nodos)
  - Se consultan completos, no por partes
  - Evita JOINs complejos entre nodos y edges

**Desafío 2: Normalización vs. Desnormalización**
- **Problema**: ¿Mantener artículos de Wikipedia separados o embebidos?
- **Solución**: Embebí la información del artículo directamente en cada nodo porque:
  - Los datos de Wikipedia son relativamente estables
  - Evita consultas adicionales durante la visualización
  - Permite trabajar offline una vez cargado el grafo

**Desafío 3: Versionado y referencias circulares**
- **Problema**: Los grafos pueden contener ciclos y referencias bidireccionales
- **Solución**: 
  - Almaceno edges como pares direccionales simples
  - Uso el campo `depth` para evitar ciclos infinitos
  - Implemento detección de ciclos en el algoritmo de exploración

**Desafío 4: Performance en grafos grandes**
- **Problema**: ¿Cómo manejar grafos que crecen dinámicamente?
- **Solución**:
  - Límites configurables (max_nodes, max_depth)
  - Carga incremental: solo se agregan nuevos nodos
  - Índices en campos frecuentemente consultados

### Decisiones de arquitectura del sistema

**Frontend - Estado Global con Zustand**:
- **¿Por qué Zustand?** Más simple que Redux, mejor TypeScript support que Context API
- **Persistencia selectiva**: Solo datos críticos (auth, preferencias) se persisten en localStorage
- **Eventos customizados**: Para sincronización entre componentes sin prop drilling

**Backend - FastAPI + Patrón de servicios**:
- **¿Por qué FastAPI?** Auto-documentación, performance, async nativo, excelente TypeScript integration
- **Separación de capas**: Routers (endpoints) → Services (lógica) → Models (datos)
- **Async everywhere**: Todas las operaciones I/O son asíncronas para mejor concurrencia

**Visualización - vis-network**:
- **¿Por qué vis-network?** Performance superior con muchos nodos, física configurable, eventos ricos
- **Física híbrida**: Activada para layout inicial, desactivada para mantener posiciones estables
- **Gestión de memoria**: Cleanup de eventos y referencias para evitar memory leaks

## Endpoints de la API

### **Autenticación**

#### `POST /api/auth/login`
**Descripción**: Autentica un usuario y devuelve JWT token
```json
// Request
{
  "email_or_username": "user@example.com",
  "password": "password123"
}

// Response 200
{
  "message": "Login successful",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": "67abc123...",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "role": "user",
    "is_active": true
  }
}
```

#### `POST /api/auth/register`
**Descripción**: Registra un nuevo usuario
```json
// Request
{
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "password": "password123"
}

// Response 201
{
  "message": "User registered successfully",
  "user": {
    "id": "67abc123...",
    "email": "user@example.com",
    "username": "johndoe",
    "full_name": "John Doe",
    "role": "user",
    "is_active": true
  }
}
```

#### `GET /api/auth/me`
**Descripción**: Obtiene información del usuario autenticado
**Headers**: `Authorization: Bearer <token>`
```json
// Response 200
{
  "id": "67abc123...",
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "role": "user",
  "is_active": true
}
```

#### `POST /api/auth/logout`
**Descripción**: Invalida el token actual (logout)
**Headers**: `Authorization: Bearer <token>`
```json
// Response 200
{
  "message": "Logout successful"
}
```

### **Búsqueda de Artículos**

#### `GET /api/search?q={query}&limit={limit}`
**Descripción**: Busca artículos de Wikipedia
**Parámetros**:
- `q` (string): Término de búsqueda
- `limit` (int, opcional): Número máximo de resultados (default: 10, max: 50)

```json
// Response 200
{
  "results": [
    {
      "title": "Albert Einstein",
      "page_id": 736,
      "snippet": "Albert Einstein was a German-born theoretical physicist...",
      "url": "https://en.wikipedia.org/wiki/Albert_Einstein",
      "thumbnail": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/150px-Albert_Einstein_Head.jpg"
    }
  ],
  "total_found": 1,
  "query": "Einstein"
}
```

### **Exploración de Grafos**

#### `GET /api/explore/{article_title}?depth={depth}&max_nodes={max_nodes}`
**Descripción**: Explora el grafo de conocimiento desde un artículo raíz
**Parámetros**:
- `article_title` (string): Título del artículo de Wikipedia
- `depth` (int, opcional): Profundidad de exploración (1-3, default: 3)
- `max_nodes` (int, opcional): Máximo número de nodos (10-200, default: 60)

```json
// Response 200
{
  "message": "Graph explored successfully",
  "exploration_time": 2.45,
  "graph_data": {
    "nodes": [
      {
        "id": "Albert_Einstein",
        "label": "Albert Einstein",
        "summary": "Albert Einstein was a German-born theoretical physicist...",
        "url": "https://en.wikipedia.org/wiki/Albert_Einstein",
        "page_id": 736,
        "depth": 0,
        "centrality": 0.95,
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/d/d3/Albert_Einstein_Head.jpg"
      },
      {
        "id": "Theory_of_relativity",
        "label": "Theory of relativity",
        "summary": "The theory of relativity usually encompasses two interrelated theories...",
        "url": "https://en.wikipedia.org/wiki/Theory_of_relativity",
        "page_id": 28964,
        "depth": 1,
        "centrality": 0.78
      }
    ],
    "edges": [
      {
        "from": "Albert_Einstein",
        "to": "Theory_of_relativity",
        "weight": 1.0,
        "edge_type": "link"
      }
    ],
    "root_node": "Albert_Einstein",
    "total_nodes": 25,
    "total_edges": 48,
    "max_depth": 2
  },
  "metadata": {
    "articles_processed": 25,
    "links_analyzed": 156,
    "cache_hits": 12,
    "wikipedia_requests": 13
  }
}
```

#### `POST /api/expand`
**Descripción**: Expande un nodo específico en un grafo existente
```json
// Request
{
  "current_graph": {
    "nodes": [...],
    "edges": [...],
    "root_node": "Albert_Einstein",
    "total_nodes": 15,
    "total_edges": 28,
    "max_depth": 2
  },
  "node_id": "Theory_of_relativity",
  "depth": 2
}

// Response 200
{
  "message": "Node expanded successfully",
  "expansion_time": 1.23,
  "graph_data": {
    // Grafo actualizado con nuevos nodos y edges
  },
  "added_nodes": 8,
  "added_edges": 15
}
```

### **Gestión de Exploraciones**

#### `GET /api/explorations`
**Descripción**: Obtiene las exploraciones guardadas del usuario
**Headers**: `Authorization: Bearer <token>`
**Parámetros**:
- `page` (int, opcional): Página (default: 1)
- `limit` (int, opcional): Elementos por página (default: 10, max: 50)
- `search` (string, opcional): Buscar por nombre
- `sort_by` (string, opcional): Campo de ordenamiento (created_at, name)
- `sort_order` (string, opcional): Orden (asc, desc, default: desc)

```json
// Response 200
{
  "explorations": [
    {
      "id": "67abc123...",
      "name": "Einstein and Physics",
      "description": "Exploration of Einstein's contributions to modern physics",
      "root_node": "Albert_Einstein",
      "tags": ["physics", "science", "relativity"],
      "created_at": "2025-08-13T10:30:00Z",
      "updated_at": "2025-08-13T10:30:00Z",
      "stats": {
        "total_nodes": 42,
        "total_edges": 89,
        "max_depth": 3
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

#### `POST /api/explorations`
**Descripción**: Guarda una nueva exploración
**Headers**: `Authorization: Bearer <token>`
```json
// Request
{
  "name": "Quantum Physics Exploration",
  "description": "Deep dive into quantum mechanics concepts",
  "graph_data": {
    "nodes": [...],
    "edges": [...],
    "root_node": "Quantum_mechanics",
    "total_nodes": 35,
    "total_edges": 67,
    "max_depth": 3
  },
  "tags": ["physics", "quantum", "science"]
}

// Response 201
{
  "message": "Exploration saved successfully",
  "exploration": {
    "id": "67def456...",
    "name": "Quantum Physics Exploration",
    "description": "Deep dive into quantum mechanics concepts",
    "root_node": "Quantum_mechanics",
    "tags": ["physics", "quantum", "science"],
    "created_at": "2025-08-13T15:45:00Z",
    "updated_at": "2025-08-13T15:45:00Z"
  }
}
```

#### `DELETE /api/explorations/{exploration_id}`
**Descripción**: Elimina una exploración
**Headers**: `Authorization: Bearer <token>`
```json
// Response 200
{
  "message": "Exploration deleted successfully"
}
```

### **Utilidades**

#### `GET /api/health`
**Descripción**: Health check del sistema
```json
// Response 200
{
  "status": "healthy",
  "message": "Wikipedia Graph Explorer API está funcionando",
  "timestamp": "2025-08-13T16:20:00Z",
  "version": "1.0.0",
  "dependencies": {
    "database": "connected",
    "wikipedia_api": "accessible"
  }
}
```

#### `GET /api/stats`
**Descripción**: Estadísticas generales del sistema
```json
// Response 200
{
  "total_users": 156,
  "total_explorations": 1024,
  "total_articles_indexed": 5847,
  "cache_hit_rate": 0.78,
  "avg_exploration_time": 2.34,
  "popular_topics": ["physics", "history", "biology", "technology"],
  "system_uptime": "72h 15m 30s"
}
```

### **Códigos de Error Comunes**

```json
// 400 Bad Request
{
  "detail": "Invalid request parameters",
  "error_code": "VALIDATION_ERROR"
}

// 401 Unauthorized
{
  "detail": "Invalid or expired token",
  "error_code": "AUTHENTICATION_ERROR"
}

// 404 Not Found
{
  "detail": "Article not found in Wikipedia",
  "error_code": "ARTICLE_NOT_FOUND"
}

// 429 Too Many Requests
{
  "detail": "Rate limit exceeded. Try again in 60 seconds",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}

// 500 Internal Server Error
{
  "detail": "Internal server error occurred",
  "error_code": "INTERNAL_ERROR",
  "request_id": "req_67abc123..."
}
```

## Funcionalidades Implementadas

### Exploración de Grafos
- Búsqueda inteligente de artículos de Wikipedia
- Construcción automática de grafos de conocimiento
- Visualización interactiva con física híbrida
- Expansión dinámica haciendo clic en nodos
- Posicionamiento estable de nodos

### Gestión de Estado
- Persistencia de autenticación entre sesiones
- Estado del grafo mantenido en recargas
- Sistema de huéspedes para exploración sin registro
- Eventos personalizados para sincronización

### Interfaz de Usuario
- Modo invitado y autenticado
- Pantalla de bienvenida con guías
- Barra de búsqueda con autocompletado
- Botón de limpiar grafo con confirmación
- Atajos de teclado (`Ctrl+R` para limpiar)

### Características Técnicas
- Sistema híbrido de física para estabilidad
- Manejo robusto de errores y timeouts
- Redirección automática tras logout
- Tooltips dinámicos con información contextual

## Estructura del Proyecto

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

## Estructura de Base de Datos (MongoDB)

### **Colección: `users`**
```javascript
{
  "_id": ObjectId("..."),
  "email": "mail",
  "username": "user",
  "full_name": "Nombre Completo",
  "password_hash": "pass", // Hash bcrypt
  "is_active": true,
  "role": "user", // "guest" | "user" | "admin"
  "created_at": ISODate("date"),
  "updated_at": ISODate("date")
}

// Índices:
// - email (único)
// - username (único) 
// - role
// - created_at
```

### **Colección: `explorations`**
```javascript
{
  "_id": ObjectId("..."),
  "user_id": "67abc123...", // Referencia a users._id
  "name": "Exploración de Física Cuántica",
  "description": "Conexiones entre conceptos de mecánica cuántica",
  "root_node": "Quantum_mechanics",
  "graph_data": {
    "nodes": [
      {
        "id": "Quantum_mechanics",
        "label": "Quantum mechanics",
        "summary": "Fundamental theory in physics...",
        "url": "https://en.wikipedia.org/wiki/Quantum_mechanics",
        "page_id": 25402,
        "depth": 0,
        "centrality": 0.85,
        "image_url": "https://upload.wikimedia.org/..."
      },
      {
        "id": "Wave_function", 
        "label": "Wave function",
        "summary": "Mathematical description...",
        "url": "https://en.wikipedia.org/wiki/Wave_function",
        "page_id": 33104,
        "depth": 1,
        "centrality": 0.67
      }
    ],
    "edges": [
      {
        "from": "Quantum_mechanics",
        "to": "Wave_function", 
        "weight": 1.0,
        "edge_type": "link"
      }
    ],
    "root_node": "Quantum_mechanics",
    "total_nodes": 25,
    "total_edges": 48,
    "max_depth": 2
  },
  "tags": ["physics", "quantum", "science"],
  "created_at": ISODate("2025-08-13T10:30:00Z"),
  "updated_at": ISODate("2025-08-13T10:30:00Z")
}

```

### **Configuración de Base de Datos**
- **Motor**: AsyncIOMotorClient para operaciones asíncronas
- **Pool de Conexiones**: 10-50 conexiones concurrentes
- **Timeouts**: 5s selección, 10s conexión, 20s operaciones
- **TTL**: Caché de artículos expira en 7 días
- **Índices Optimizados**: Para búsquedas frecuentes y paginación

## Características Técnicas Destacadas

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

---

**Nota**: Esta aplicación está optimizada para exploración de conocimiento. Cada búsqueda puede descubrir conexiones inesperadas entre conceptos, haciendo del aprendizaje una experiencia visual e interactiva.
