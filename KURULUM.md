# 🚀 LocalCRM Kurulum Rehberi

Bu rehber, LocalCRM uygulamasını yeni bir bilgisayara kurmak için gerekli adımları içerir.

## 📋 Gereksinimler

- **Node.js** (v18.0.0 veya üzeri)
- **npm** (v9.0.0 veya üzeri)
- **Git**
- **Internet bağlantısı**

## 🔧 Kurulum Adımları

### 1. Node.js ve npm Kurulumu

Eğer Node.js yüklü değilse:

**Windows:**
- https://nodejs.org/ adresinden LTS versiyonunu indirin
- Kurulum sihirbazını takip edin
- Kurulum sonrası terminal'i yeniden başlatın

**macOS:**
```bash
# Homebrew ile
brew install node

# Veya nodejs.org'dan indirin
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Kurulumu kontrol edin:
```bash
node --version
npm --version
```

### 2. Git Kurulumu

**Windows:**
- https://git-scm.com/download/win adresinden indirin
- Kurulum sihirbazını takip edin

**macOS:**
```bash
# Homebrew ile
brew install git

# Veya Xcode Command Line Tools ile
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install git
```

### 3. Projeyi Klonlama

Terminal'i açın ve projeyi klonlayın:

```bash
# GitHub repository'sini klonlayın
git clone https://github.com/Neogtt/localcrm.git

# Klasöre girin
cd localcrm
```

**Not:** Eğer repository private ise, GitHub hesabınıza giriş yapmanız gerekebilir.

### 4. Bağımlılıkları Yükleme

**Server bağımlılıklarını yükleyin:**
```bash
# Proje kök dizininde
npm install
```

**Client bağımlılıklarını yükleyin:**
```bash
# client klasörüne girin
cd client

# Client bağımlılıklarını yükleyin
npm install

# Kök dizine geri dönün
cd ..
```

### 5. Environment Variables (.env) Dosyası Oluşturma

Proje kök dizininde `.env` dosyası oluşturun:

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# macOS/Linux
touch .env
```

`.env` dosyasına aşağıdaki içeriği ekleyin:

```env
# Server Port
PORT=3001

# Node Environment
NODE_ENV=development

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# API URL (Production'da Render.com URL'i kullanılır)
REACT_APP_API_URL=http://localhost:3001/api
```

**Önemli:** 
- `SMTP_USER` ve `SMTP_PASS` değerlerini kendi email bilgilerinizle değiştirin
- Gmail kullanıyorsanız, "App Password" oluşturmanız gerekebilir
- Production'da `REACT_APP_API_URL` Render.com URL'inizi kullanır

### 6. Excel Dosyası Klasörü Oluşturma

`temp` klasörünün var olduğundan emin olun:

```bash
# Windows (PowerShell)
New-Item -Path temp -ItemType Directory -Force

# macOS/Linux
mkdir -p temp
```

### 7. Uygulamayı Çalıştırma

**Development Modu (İki Terminal Gerekir):**

**Terminal 1 - Server:**
```bash
# Proje kök dizininde
npm start
```

**Terminal 2 - Client:**
```bash
# Proje kök dizininde
npm run client
```

**Veya Production Build ile:**

```bash
# 1. Client'ı build edin
npm run build

# 2. Sadece server'ı çalıştırın
npm start
```

### 8. Uygulamaya Erişim

Tarayıcınızda şu adrese gidin:
```
http://localhost:3000
```

## 📁 Klasör Yapısı

Kurulum sonrası klasör yapısı şöyle olmalı:

```
localcrm/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/
│   ├── services/
│   └── index.js
├── temp/                   # Excel dosyaları burada saklanır
│   └── local.xlsx
├── .env                    # Environment variables
├── package.json
└── README.md
```

## 🔄 İlk Kurulum Sonrası

### Excel Dosyası İçe Aktarma

1. Uygulamaya giriş yapın: `http://localhost:3000`
2. "Excel İçe Aktarma" menüsüne gidin
3. "Şablon İndir" butonuna tıklayarak boş şablon indirin
4. Şablonu doldurun veya mevcut Excel dosyanızı yükleyin
5. "Excel Dosyası Yükle" butonuna tıklayarak dosyanızı yükleyin

**Not:** İlk kurulumda `temp/local.xlsx` dosyası yoksa, uygulama otomatik olarak boş bir şablon oluşturur.

## 🐛 Sorun Giderme

### Port 3001 zaten kullanılıyor

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Port 3000 zaten kullanılıyor

`.env` dosyasında farklı bir port belirleyin veya:

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### npm install hataları

```bash
# Cache'i temizleyin
npm cache clean --force

# node_modules'ü silin ve yeniden yükleyin
rm -rf node_modules
rm -rf client/node_modules
npm install
cd client && npm install && cd ..
```

### Excel dosyası bulunamadı

```bash
# temp klasörünün var olduğundan emin olun
mkdir -p temp

# İzinleri kontrol edin (Linux/macOS)
chmod 755 temp
```

### Email gönderilemiyor

1. `.env` dosyasındaki SMTP ayarlarını kontrol edin
2. Gmail kullanıyorsanız "App Password" oluşturun:
   - Google Account > Security > 2-Step Verification > App Passwords
3. SMTP_PORT'u kontrol edin (587 veya 465)

## 📝 Notlar

- **Development Modu:** Her iki terminal'de de çalıştırmanız gerekir (server + client)
- **Production Modu:** Sadece `npm start` yeterlidir (build edilmiş client dosyalarını kullanır)
- **Excel Dosyaları:** `temp/local.xlsx` dosyası local olarak saklanır
- **Environment Variables:** `.env` dosyası asla Git'e commit edilmemelidir

## 🔗 Yardımcı Linkler

- **Node.js:** https://nodejs.org/
- **Git:** https://git-scm.com/
- **GitHub Repository:** https://github.com/Neogtt/localcrm
- **Render.com Dashboard:** https://render.com/

## 📞 Destek

Sorun yaşarsanız:
1. Bu rehberi tekrar okuyun
2. GitHub Issues'da arama yapın
3. Yeni bir issue oluşturun

## 🎉 Kurulum Tamamlandı!

Kurulum başarıyla tamamlandıysa, uygulama `http://localhost:3000` adresinde çalışıyor olmalı.

**İyi çalışmalar! 🚀**

