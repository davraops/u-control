#!/bin/bash

echo "🛑 Deteniendo entorno de desarrollo..."
echo ""

# MATAR TODO EN PUERTOS 3000 Y 8080
echo "🔥 MATANDO TODO EN PUERTOS 3000 Y 8080..."
lsof -ti:3000 | xargs -r kill -9
lsof -ti:8080 | xargs -r kill -9

# Detener todos los procesos existentes
echo "📴 Deteniendo procesos..."
pkill -f serverless
pkill -f "node.*server.js"
pkill -f "npm.*start"

# Esperar un momento
sleep 2

echo "✅ Todos los procesos han sido detenidos"
echo ""
echo "💡 Para reiniciar: ./restart-dev.sh"
