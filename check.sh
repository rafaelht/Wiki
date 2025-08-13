#!/bin/bash

# Script de verificación rápida para Wikipedia Graph Explorer

echo "🔍 Verificando Wikipedia Graph Explorer..."

# Verificar Backend
echo "Backend (puerto 8001):"
if curl -s --max-time 5 "http://127.0.0.1:8001/api/search?term=Einstein&limit=1" > /dev/null; then
    echo "  ✅ Backend funcionando correctamente"
    
    # Probar búsqueda
    echo "  🔍 Probando búsqueda de Einstein..."
    SEARCH_RESULT=$(curl -s "http://127.0.0.1:8001/api/search?term=Einstein&limit=1")
    if [[ $SEARCH_RESULT == *"Albert Einstein"* ]]; then
        echo "  ✅ Búsqueda funcionando"
    else
        echo "  ❌ Problema con la búsqueda"
    fi
else
    echo "  ❌ Backend no responde"
    echo "     Intenta: cd backend && PYTHONPATH=\$(pwd) ./venv/bin/python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001"
fi

echo ""

# Verificar Frontend
echo "Frontend (puerto 3000):"
if curl -s --max-time 3 http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ Frontend funcionando correctamente"
else
    echo "  ❌ Frontend no responde"
    echo "     Intenta: cd frontend && npm run dev"
fi

echo ""

# Mostrar URLs importantes
echo "📋 URLs importantes:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://127.0.0.1:8001"
echo "  API Docs:  http://127.0.0.1:8001/docs"

echo ""
echo "🎯 Para usar la aplicación:"
echo "  1. Ve a http://localhost:3000"
echo "  2. Busca un artículo (ej: 'Albert Einstein')"
echo "  3. Selecciona un resultado para explorar el grafo"
