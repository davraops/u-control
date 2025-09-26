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

# Set correct MIME types for assets
echo "⚙️ Configurando tipos MIME correctos..."
aws s3 cp s3://avellaconsulting.com/u-control/assets/ s3://avellaconsulting.com/u-control/assets/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000" \
  --exclude "*" \
  --include "*.js" \
  --content-type "application/javascript"

aws s3 cp s3://avellaconsulting.com/u-control/assets/ s3://avellaconsulting.com/u-control/assets/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "public, max-age=31536000" \
  --exclude "*" \
  --include "*.css" \
  --content-type "text/css"

# Invalidate CloudFront cache
echo "🔄 Invalidando cache de CloudFront..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id E251VRQ4UH2ONB \
  --paths "/u-control/*" "/u-control/index.html" \
  --query "Invalidation.Id" \
  --output text)

echo "⏳ Invalidación creada: $INVALIDATION_ID"
echo "🔄 Esperando completar invalidación..."

# Wait for invalidation to complete
aws cloudfront wait invalidation-completed \
  --distribution-id E251VRQ4UH2ONB \
  --id $INVALIDATION_ID

echo "✅ Frontend desplegado exitosamente!"
echo "🌐 URL: https://avellaconsulting.com/u-control/"
echo "☁️ CloudFront: Cache invalidado y actualizado"
echo ""
echo "💡 La nueva versión debería estar disponible ahora"
