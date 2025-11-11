#!/bin/bash

# EXPO CRM Başlatma Scripti
# Bu dosyayı çift tıklayarak uygulamayı başlatabilirsiniz

# Proje dizinine git
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Terminal penceresini açık tut ve renklendir
export TERM=xterm-256color

# Renkli çıktı için
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}     ${GREEN}EXPO CRM - Başlatılıyor...${NC}      ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# .env dosyası kontrolü
if [ ! -f .env ]; then
    echo -e "${RED}⚠️  HATA: .env dosyası bulunamadı!${NC}"
    echo -e "${YELLOW}Lütfen .env.example dosyasını .env olarak kopyalayın ve yapılandırın.${NC}"
    echo ""
    echo -e "${CYAN}Komut: cp .env.example .env${NC}"
    echo ""
    read -p "Devam etmek için Enter'a basın..."
    exit 1
fi

# Node.js kontrolü
if ! command -v node &> /dev/null; then
    echo -e "${RED}⚠️  HATA: Node.js bulunamadı!${NC}"
    echo -e "${YELLOW}Lütfen Node.js'i yükleyin: https://nodejs.org${NC}"
    echo ""
    read -p "Devam etmek için Enter'a basın..."
    exit 1
fi

echo -e "${CYAN}📦 Node.js versiyonu:$(node -v)${NC}"
echo ""

# Node modules kontrolü
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📥 Backend bağımlılıkları yükleniyor...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Backend bağımlılıkları yüklenirken hata oluştu!${NC}"
        read -p "Devam etmek için Enter'a basın..."
        exit 1
    fi
    echo ""
fi

if [ ! -d client/node_modules ]; then
    echo -e "${YELLOW}📥 Frontend bağımlılıkları yükleniyor...${NC}"
    cd client
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Frontend bağımlılıkları yüklenirken hata oluştu!${NC}"
        cd ..
        read -p "Devam etmek için Enter'a basın..."
        exit 1
    fi
    cd ..
    echo ""
fi

# Temp dizini oluştur
mkdir -p temp

echo -e "${GREEN}🚀 Backend server başlatılıyor...${NC}"
echo -e "${CYAN}📍 Backend URL: http://localhost:3001${NC}"
echo ""

# Backend'i arka planda başlat ve çıktısını log dosyasına yaz
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!

# Backend'in başlamasını bekle
echo -e "${YELLOW}⏳ Backend başlatılıyor, lütfen bekleyin...${NC}"
sleep 8

# Backend'in çalışıp çalışmadığını kontrol et
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend başlatılamadı!${NC}"
    echo -e "${YELLOW}Log dosyasını kontrol edin: backend.log${NC}"
    echo ""
    tail -20 backend.log
    echo ""
    read -p "Devam etmek için Enter'a basın..."
    exit 1
fi

# Backend'in port 3001'de çalışıp çalışmadığını kontrol et
if ! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⏳ Backend henüz hazır değil, biraz daha bekliyorum...${NC}"
    sleep 5
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ Backend başarıyla başlatıldı!${NC}"
    echo ""
else
    echo -e "${RED}⚠️  Backend port 3001'de çalışmıyor, ama devam ediyorum...${NC}"
    echo ""
fi

echo -e "${GREEN}🚀 Frontend başlatılıyor...${NC}"
echo -e "${CYAN}📍 Frontend URL: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}⏳ Tarayıcı otomatik olarak açılacak...${NC}"
echo -e "${YELLOW}💡 Uygulamayı durdurmak için bu pencerede Ctrl+C tuşlarına basın${NC}"
echo ""

# 5 saniye sonra tarayıcıyı aç
(sleep 10 && open http://localhost:3000) &

# Frontend'i başlat (bu komut bloklayıcıdır)
cd client
npm start

# Frontend kapatıldığında backend'i de kapat
echo ""
echo -e "${YELLOW}🛑 Uygulama kapatılıyor...${NC}"
kill $BACKEND_PID 2>/dev/null
pkill -f "node.*server/index.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null

echo ""
echo -e "${GREEN}✅ EXPO CRM kapatıldı.${NC}"
echo ""
read -p "Çıkmak için Enter'a basın..."
