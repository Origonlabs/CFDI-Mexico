#!/bin/bash

echo "🚀 FORZANDO SUBIDA COMPLETA DE TODOS LOS CAMBIOS..."

# 1. Agregar TODOS los archivos (sin excepciones)
echo "📁 Agregando TODOS los archivos..."
git add .

# 2. Verificar qué se va a subir
echo "📋 Archivos que se van a subir:"
git status --porcelain

# 3. Hacer commit con todos los cambios
echo "💾 Haciendo commit con todos los cambios..."
git commit -m "🔥 SUBIDA COMPLETA: Todos los cambios del proyecto - $(date)"

# 4. Forzar push a GitHub
echo "🚀 Subiendo a GitHub..."
git push origin master --force

echo "✅ ¡SUBIDA COMPLETA EXITOSA!"
echo "�� Resumen de cambios subidos:"
git log --oneline -3 