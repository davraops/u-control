#!/bin/bash

echo "🚀 Desplegando u-control frontend..."

# Build the frontend
echo "📦 Construyendo frontend..."
cd frontend
npm run build

# Deploy to S3 with proper cache headers
echo "☁️ Subiendo a S3..."
aws s3 sync dist/ s3://avellaconsulting.com/u-control/ --delete

# Set cache headers
echo "⚙️ Configurando headers de cache..."
aws s3 cp s3://avellaconsulting.com/u-control/index.html s3://avellaconsulting.com/u-control/index.html \
  --metadata-directive REPLACE \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

aws s3 cp s3://avellaconsulting.com/u-control/assets/ s3://avellaconsulting.com/u-control/assets/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000" \
  --exclude "*" \
  --include "*.js" \
  --include "*.css"

echo "✅ Frontend desplegado exitosamente!"
echo "🌐 URL: https://avellaconsulting.com/u-control/"
echo ""
echo "💡 Si ves la versión anterior, haz Ctrl+F5 para forzar la recarga"
