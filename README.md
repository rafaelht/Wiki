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
