#!/bin/bash
# Hızlı başlatma scripti

cd "$(dirname "$0")"

echo "🚀 EXPO CRM Başlatılıyor..."
echo ""

# Backend başlat
echo "📦 Backend başlatılıyor (Port 3001)..."
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!

# 5 saniye bekle
sleep 5

# Frontend başlat
echo "📦 Frontend başlatılıyor (Port 3000)..."
cd client
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!

# 10 saniye bekle ve tarayıcıyı aç
sleep 10
echo "🌐 Tarayıcı açılıyor..."
open http://localhost:3000

echo ""
echo "✅ Program başlatıldı!"
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend: http://localhost:3001"
echo ""
echo "Durdurmak için: kill $BACKEND_PID $FRONTEND_PID"
echo ""

