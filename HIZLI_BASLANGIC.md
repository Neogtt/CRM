# ⚡ Hızlı Başlangıç Rehberi

Bu rehber, LocalCRM'yi hızlıca kurmak için minimum adımları içerir.

## 🎯 Hızlı Kurulum (5 Dakika)

### 1. Gereksinimleri Kontrol Edin

```bash
node --version  # v18.0.0 veya üzeri olmalı
npm --version   # v9.0.0 veya üzeri olmalı
git --version   # Herhangi bir versiyon
```

### 2. Projeyi Klonlayın

```bash
git clone https://github.com/Neogtt/localcrm.git
cd localcrm
```

### 3. Bağımlılıkları Yükleyin

```bash
# Server bağımlılıklarını yükleyin
npm install

# Client bağımlılıklarını yükleyin
cd client && npm install && cd ..
```

### 4. Environment Variables Oluşturun

Proje kök dizininde `.env` dosyası oluşturun:

```bash
# Windows
echo PORT=3001 > .env
echo NODE_ENV=development >> .env
echo SMTP_HOST=smtp.gmail.com >> .env
echo SMTP_PORT=587 >> .env
echo SMTP_USER=your-email@gmail.com >> .env
echo SMTP_PASS=your-app-password >> .env
echo REACT_APP_API_URL=http://localhost:3001/api >> .env

# macOS/Linux
cat > .env << EOF
PORT=3001
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
REACT_APP_API_URL=http://localhost:3001/api
EOF
```

**Önemli:** `.env` dosyasındaki email bilgilerini kendi bilgilerinizle değiştirin!

### 5. Temp Klasörünü Oluşturun

```bash
mkdir -p temp
```

### 6. Uygulamayı Çalıştırın

**İki terminal açın:**

**Terminal 1 (Server):**
```bash
npm start
```

**Terminal 2 (Client):**
```bash
npm run client
```

### 7. Tarayıcıda Açın

```
http://localhost:3000
```

## ✅ Kurulum Kontrolü

Kurulum başarılıysa:

1. ✅ Server çalışıyor: `http://localhost:3001/api/health`
2. ✅ Client çalışıyor: `http://localhost:3000`
3. ✅ Ana sayfa yükleniyor
4. ✅ "Excel İçe Aktarma" menüsü görünüyor

## 📋 İlk Adımlar

1. **Excel Dosyası Yükleme:**
   - "Excel İçe Aktarma" menüsüne gidin
   - "Şablon İndir" butonuna tıklayın
   - Şablonu doldurun veya mevcut Excel dosyanızı yükleyin

2. **Müşteri Ekleme:**
   - "Cari Hesaplar" > "Yeni Kayıt" menüsüne gidin
   - Müşteri bilgilerini girin
   - Kaydedin

## 🐛 Hızlı Sorun Giderme

### Port hatası?
```bash
# Port'u değiştirin veya kullanan process'i durdurun
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Bağımlılık hatası?
```bash
# Cache'i temizleyin ve yeniden yükleyin
npm cache clean --force
rm -rf node_modules client/node_modules
npm install
cd client && npm install && cd ..
```

### Excel dosyası hatası?
```bash
# Temp klasörünü oluşturun
mkdir -p temp
chmod 755 temp
```

## 📚 Detaylı Bilgi

Daha detaylı bilgi için `KURULUM.md` dosyasını okuyun.

## 🎉 Başarılı!

Uygulama çalışıyorsa, artık kullanmaya başlayabilirsiniz!

**İyi çalışmalar! 🚀**

