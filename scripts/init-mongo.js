// Script de inicialización para MongoDB
// Crea la base de datos y usuario para la aplicación

db = db.getSiblingDB('wikipedia_graph_explorer');

// Crear colecciones con esquemas de validación
db.createCollection('explorations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'root_node', 'graph_data', 'created_at', 'updated_at'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100,
          description: 'Nombre de la exploración'
        },
        description: {
          bsonType: 'string',
          maxLength: 500,
          description: 'Descripción opcional de la exploración'
        },
        root_node: {
          bsonType: 'string',
          description: 'Nodo raíz de la exploración'
        },
        graph_data: {
          bsonType: 'object',
          required: ['nodes', 'edges', 'root_node', 'total_nodes', 'total_edges', 'max_depth'],
          description: 'Datos del grafo de la exploración'
        },
        tags: {
          bsonType: 'array',
          items: {
            bsonType: 'string'
          },
          description: 'Etiquetas de la exploración'
        },
        created_at: {
          bsonType: 'date',
          description: 'Fecha de creación'
        },
        updated_at: {
          bsonType: 'date',
          description: 'Fecha de última actualización'
        }
      }
    }
  }
});

// Crear índices para optimizar consultas
db.explorations.createIndex({ 'name': 1 });
db.explorations.createIndex({ 'root_node': 1 });
db.explorations.createIndex({ 'created_at': -1 });
db.explorations.createIndex({ 'tags': 1 });
db.explorations.createIndex({ 'created_at': -1, 'name': 1 });

print('MongoDB inicializado correctamente para Wikipedia Graph Explorer');
