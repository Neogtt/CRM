#!/bin/bash

# Deployment Script for LocalCRM
# Usage: ./deploy.sh

set -e

echo "🚀 LocalCRM Deployment Script"
echo "=============================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🔨 Building frontend..."
cd client
npm install
npm run build
cd ..

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p temp files logs
mkdir -p "files/Proforma Klasörü"
mkdir -p "files/Sipariş Formu Klasörü"
mkdir -p "files/Fatura Evrakları Klasörü"
mkdir -p "files/Kalite"
mkdir -p "files/Ürün Resimleri"
mkdir -p "files/Medya"

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo "🔄 Restarting with PM2..."
    pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
    pm2 save
    echo "✅ Application started with PM2"
else
    echo "⚠️  PM2 not found. Starting with node..."
    node server/index.js
fi

echo "✅ Deployment complete!"

