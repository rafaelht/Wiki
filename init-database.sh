#!/bin/bash

# Script de inicialización de la base de datos MongoDB
# Wikipedia Graph Explorer

echo "🔧 Inicializando base de datos MongoDB..."

# Verificar si MongoDB está ejecutándose
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB no está ejecutándose. Por favor, inicia MongoDB primero:"
    echo "   macOS: brew services start mongodb-community"
    echo "   Linux: sudo systemctl start mongod"
    exit 1
fi

# Crear base de datos e índices
echo "📊 Creando base de datos e índices..."

mongosh wikipedia_graph_explorer --eval "
// Crear índices para la colección users
print('Creando índices para users...');
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'username': 1 }, { unique: true });
db.users.createIndex({ 'role': 1 });
db.users.createIndex({ 'is_active': 1 });
db.users.createIndex({ 'created_at': -1 });

// Crear índices para la colección explorations
print('Creando índices para explorations...');
db.explorations.createIndex({ 'user_id': 1 });
db.explorations.createIndex({ 'user_id': 1, 'created_at': -1 });
db.explorations.createIndex({ 'name': 'text', 'description': 'text' });
db.explorations.createIndex({ 'tags': 1 });
db.explorations.createIndex({ 'root_node': 1 });
db.explorations.createIndex({ 'created_at': -1 });

print('✅ Base de datos inicializada correctamente');

// Mostrar estadísticas
print('📈 Estadísticas de la base de datos:');
db.stats();
"

# Verificar que los índices se crearon correctamente
echo "🔍 Verificando índices creados..."

mongosh wikipedia_graph_explorer --eval "
print('Índices en users:');
db.users.getIndexes().forEach(function(index) { 
    print('  - ' + JSON.stringify(index.key)); 
});

print('Índices en explorations:');
db.explorations.getIndexes().forEach(function(index) { 
    print('  - ' + JSON.stringify(index.key)); 
});
"

echo "✅ Inicialización completada!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Configura tu archivo .env con la URL de MongoDB"
echo "   2. Inicia el backend: cd backend && python -m uvicorn app.main:app --reload --port 8001"
echo "   3. Inicia el frontend: cd frontend && npm run dev"
echo ""
echo "🌐 URLs de desarrollo:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8001"
echo "   API Docs: http://localhost:8001/docs"
