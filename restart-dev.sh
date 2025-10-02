#!/bin/bash

# Guardar el directorio raíz del proyecto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "🔄 Reiniciando entorno de desarrollo completo..."
echo "🔍 Debug: Project root: $PROJECT_ROOT"
echo ""

# MATAR TODO EN PUERTOS 3000 Y 8080
echo "🔥 MATANDO TODO EN PUERTOS 3000 Y 8080..."
lsof -ti:3000 | xargs -r kill -9
lsof -ti:8080 | xargs -r kill -9
sleep 2
echo "✅ Puertos 3000 y 8080 liberados"
echo ""

# Detener todos los procesos existentes (por si acaso)
echo "📴 Deteniendo procesos existentes..."
pkill -f serverless
pkill -f "node.*server.js"
pkill -f "npm.*start"

# Esperar un momento para que se detengan completamente
sleep 3

echo "✅ Procesos detenidos"
echo ""

# Iniciar backend
echo "🚀 Iniciando backend (puerto 3000)..."
echo "🔍 Debug: Current directory: $(pwd)"
echo "🔍 Debug: Backend directory exists: $([ -d "backend" ] && echo "YES" || echo "NO")"
if [ -d "backend" ]; then
    echo "🔍 Debug: Starting backend from: $(pwd)/backend"
    (cd backend && nohup npm run dev > ../backend.log 2>&1 &)
    BACKEND_PID=$!
    echo "🔍 Debug: Backend PID: $BACKEND_PID"
else
    echo "❌ Directorio backend no encontrado en: $(pwd)"
    BACKEND_PID=""
fi

# Esperar un momento para que el backend inicie
sleep 5

# Iniciar frontend
echo "🌐 Iniciando frontend (puerto 8080)..."
echo "🔍 Debug: Current directory: $(pwd)"
echo "🔍 Debug: Frontend directory exists: $([ -d "frontend" ] && echo "YES" || echo "NO")"
if [ -d "frontend" ]; then
    echo "🔍 Debug: Starting frontend from: $(pwd)/frontend"
    (cd frontend && nohup npm start > ../frontend.log 2>&1 &)
    FRONTEND_PID=$!
    echo "🔍 Debug: Frontend PID: $FRONTEND_PID"
else
    echo "❌ Directorio frontend no encontrado en: $(pwd)"
    FRONTEND_PID=""
fi

echo ""
echo "✅ Entorno de desarrollo iniciado:"
echo "   • Backend: http://localhost:3000"
echo "   • Frontend: http://localhost:8080"
echo ""
echo "📋 PIDs de los procesos:"
echo "   • Backend PID: $BACKEND_PID"
if [ -n "$FRONTEND_PID" ]; then
    echo "   • Frontend PID: $FRONTEND_PID"
else
    echo "   • Frontend PID: No iniciado"
fi
echo ""
echo "📄 Logs disponibles:"
echo "   • Backend: tail -f backend.log"
echo "   • Frontend: tail -f frontend.log"
echo ""
echo "💡 Para detener todo: ./stop-dev.sh"
echo ""

# Volver al directorio raíz
cd ..

# Mostrar estado después de unos segundos
sleep 3
echo "🔍 Verificando estado de los servicios..."
echo ""

# Verificar backend
if curl -s http://localhost:3000/dev/hello > /dev/null 2>&1; then
    echo "✅ Backend: Funcionando correctamente"
else
    echo "❌ Backend: No responde"
fi

# Verificar frontend
if [ -n "$FRONTEND_PID" ]; then
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "✅ Frontend: Funcionando correctamente"
    else
        echo "❌ Frontend: No responde"
    fi
else
    echo "❌ Frontend: No se pudo iniciar"
fi

echo ""
echo "🎉 ¡Listo para desarrollar!"