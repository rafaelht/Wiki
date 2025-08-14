#!/bin/bash

# Script de respaldo de la base de datos MongoDB
# Wikipedia Graph Explorer

BACKUP_DIR="./database_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="wikipedia_graph_explorer"

echo "📦 Iniciando respaldo de la base de datos..."

# Crear directorio de respaldos si no existe
mkdir -p "$BACKUP_DIR"

# Verificar si MongoDB está ejecutándose
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB no está ejecutándose. No se puede crear el respaldo."
    exit 1
fi

# Crear respaldo completo
echo "🗂️  Exportando base de datos '$DB_NAME'..."
mongodump --db="$DB_NAME" --out="$BACKUP_DIR/dump_$TIMESTAMP"

if [ $? -eq 0 ]; then
    echo "✅ Exportación completada exitosamente"
    
    # Crear archivo comprimido
    echo "🗜️  Comprimiendo respaldo..."
    cd "$BACKUP_DIR"
    tar -czf "${DB_NAME}_backup_${TIMESTAMP}.tar.gz" "dump_$TIMESTAMP"
    
    if [ $? -eq 0 ]; then
        echo "✅ Respaldo comprimido creado: ${DB_NAME}_backup_${TIMESTAMP}.tar.gz"
        
        # Eliminar directorio temporal
        rm -rf "dump_$TIMESTAMP"
        
        # Mostrar información del respaldo
        BACKUP_SIZE=$(du -h "${DB_NAME}_backup_${TIMESTAMP}.tar.gz" | cut -f1)
        echo "📊 Tamaño del respaldo: $BACKUP_SIZE"
        
        # Mostrar estadísticas de la base de datos
        echo "📈 Estadísticas de la base de datos:"
        mongosh "$DB_NAME" --eval "
            print('👥 Usuarios: ' + db.users.countDocuments({}));
            print('🔍 Exploraciones: ' + db.explorations.countDocuments({}));
            print('💾 Tamaño de BD: ' + JSON.stringify(db.stats().dataSize));
        " --quiet
        
    else
        echo "❌ Error al comprimir el respaldo"
        exit 1
    fi
else
    echo "❌ Error en la exportación de la base de datos"
    exit 1
fi

echo ""
echo "📋 Información del respaldo:"
echo "   Archivo: $BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.tar.gz"
echo "   Fecha: $(date)"
echo ""
echo "🔄 Para restaurar este respaldo:"
echo "   tar -xzf ${DB_NAME}_backup_${TIMESTAMP}.tar.gz"
echo "   mongorestore --db=$DB_NAME dump_$TIMESTAMP/$DB_NAME"
echo ""
echo "☁️  Para subir a MongoDB Atlas:"
echo "   mongorestore --uri='mongodb+srv://user:pass@cluster.mongodb.net/' --db=$DB_NAME dump_$TIMESTAMP/$DB_NAME"

# Limpiar respaldos antiguos (mantener solo los últimos 5)
echo "🧹 Limpiando respaldos antiguos..."
cd "$BACKUP_DIR"
ls -t ${DB_NAME}_backup_*.tar.gz | tail -n +6 | xargs -r rm
REMAINING=$(ls ${DB_NAME}_backup_*.tar.gz 2>/dev/null | wc -l)
echo "📁 Respaldos mantenidos: $REMAINING"

echo "✅ Proceso de respaldo completado!"
