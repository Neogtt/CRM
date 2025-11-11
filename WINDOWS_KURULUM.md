# 🪟 Windows Kurulum Rehberi

Bu rehber, LocalCRM'yi Windows işletim sisteminde local hard diskte çalışır hale getirmek için adım adım talimatlar içerir.

## 📋 Gereksinimler

- **Windows 10/11** (veya Windows 7/8.1)
- **Node.js** v18.0.0 veya üzeri
- **npm** v9.0.0 veya üzeri
- **İnternet bağlantısı** (ilk kurulum için)

## 🚀 Hızlı Kurulum (Otomatik)

### Adım 1: Node.js Kurulumu

1. https://nodejs.org/ adresine gidin
2. **LTS (Long Term Support)** sürümünü indirin
3. İndirilen `.msi` dosyasına çift tıklayın
4. Kurulum sihirbazını takip edin (varsayılan ayarlar yeterlidir)
5. Kurulum sonrası bilgisayarı yeniden başlatın

**Kontrol:**
```cmd
node --version
npm --version
```

### Adım 2: Projeyi İndirin

Projeyi GitHub'dan klonlayın veya ZIP olarak indirin:

```cmd
git clone https://github.com/Neogtt/localcrm.git
cd localcrm
```

Veya ZIP dosyasını indirip açın.

### Adım 3: Otomatik Kurulum

1. Proje klasörüne gidin
2. `setup-windows.bat` dosyasına **çift tıklayın**
3. Kurulum tamamlanana kadar bekleyin

Kurulum scripti otomatik olarak:
- ✅ `.env` dosyası oluşturur
- ✅ `temp` klasörü oluşturur
- ✅ Server bağımlılıklarını yükler
- ✅ Client bağımlılıklarını yükler
- ✅ Client'ı build eder

### Adım 4: Uygulamayı Başlatın

1. `start-crm.bat` dosyasına **çift tıklayın**
2. Tarayıcıda şu adrese gidin: **http://localhost:3001**

## 🔧 Manuel Kurulum

Eğer otomatik kurulum çalışmazsa, manuel olarak kurulum yapabilirsiniz:

### Adım 1: .env Dosyası Oluşturun

Proje kök dizininde `.env` dosyası oluşturun:

```env
PORT=3001
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
REACT_APP_API_URL=http://localhost:3001/api
```

**Not:** Email bilgilerini kendi bilgilerinizle değiştirin (opsiyonel).

### Adım 2: Temp Klasörü Oluşturun

```cmd
mkdir temp
```

### Adım 3: Bağımlılıkları Yükleyin

**PowerShell veya CMD'de:**

```cmd
REM Server bağımlılıkları
npm install

REM Client bağımlılıkları
cd client
npm install
cd ..
```

### Adım 4: Client'ı Build Edin

```cmd
cd client
npm run build
cd ..
```

### Adım 5: Uygulamayı Başlatın

```cmd
npm start
```

Tarayıcıda açın: **http://localhost:3001**

## 🎯 Kullanım

### Uygulamayı Başlatma

**Yöntem 1: Batch Dosyası (Önerilen)**
- `start-crm.bat` dosyasına çift tıklayın

**Yöntem 2: Komut Satırı**
```cmd
npm start
```

### Uygulamayı Durdurma

- Terminal penceresinde `Ctrl+C` tuşlarına basın
- Veya terminal penceresini kapatın

### Tarayıcıda Açma

Uygulama başladıktan sonra tarayıcınızda şu adrese gidin:
```
http://localhost:3001
```

## 🔍 Sorun Giderme

### Port Zaten Kullanılıyor Hatası

Eğer 3001 portu zaten kullanılıyorsa:

1. `.env` dosyasını açın
2. `PORT=3001` satırını `PORT=3002` (veya başka bir port) olarak değiştirin
3. Uygulamayı yeniden başlatın

### Node.js Bulunamadı Hatası

1. Node.js'in kurulu olduğundan emin olun:
   ```cmd
   node --version
   ```
2. Eğer hata alıyorsanız, Node.js'i yeniden yükleyin
3. Bilgisayarı yeniden başlatın

### Bağımlılık Hataları

```cmd
REM Cache'i temizle
npm cache clean --force

REM node_modules'ü sil
rmdir /s /q node_modules
rmdir /s /q client\node_modules

REM Yeniden yükle
npm install
cd client
npm install
cd ..
```

### Build Hataları

```cmd
cd client
npm run build
cd ..
```

Eğer hata devam ederse:
```cmd
cd client
rmdir /s /q node_modules
npm install
npm run build
cd ..
```

### .env Dosyası Bulunamadı

`.env` dosyası proje kök dizininde olmalı. Eğer yoksa:

1. Proje kök dizininde `.env` dosyası oluşturun
2. Yukarıdaki `.env` içeriğini kopyalayın

## 📁 Klasör Yapısı

Kurulum sonrası klasör yapısı:

```
localcrm/
├── client/
│   ├── build/          # Build edilmiş React uygulaması
│   ├── node_modules/   # Client bağımlılıkları
│   └── src/
├── server/
│   ├── routes/
│   ├── services/
│   └── index.js
├── temp/               # Excel dosyaları
│   └── local.xlsx
├── .env                # Environment variables
├── node_modules/       # Server bağımlılıkları
├── start-crm.bat       # Başlatma scripti
├── setup-windows.bat   # Kurulum scripti
└── package.json
```

## ⚙️ Yapılandırma

### Email Yapılandırması (Opsiyonel)

Eğer email gönderme özelliğini kullanmak istiyorsanız:

1. `.env` dosyasını açın
2. `SMTP_USER` ve `SMTP_PASS` değerlerini güncelleyin
3. Gmail kullanıyorsanız, "App Password" oluşturmanız gerekebilir

### Google API Yapılandırması (Opsiyonel)

Google Sheets/Drive entegrasyonu için:

1. Google Cloud Console'da proje oluşturun
2. Service Account oluşturun
3. JSON key dosyasını indirin
4. `.env` dosyasına ekleyin:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   GOOGLE_SHEETS_ID=your_sheets_id
   EXCEL_FILE_ID=your_file_id
   ```

**Not:** Google API'ler olmadan da uygulama çalışır (sadece bazı özellikler devre dışı kalır).

## 🎉 Başarılı!

Kurulum tamamlandı! Artık LocalCRM'yi kullanmaya başlayabilirsiniz.

**İyi çalışmalar! 🚀**

## 📞 Destek

Sorun yaşarsanız:
- GitHub Issues: https://github.com/Neogtt/localcrm/issues
- README.md dosyasını kontrol edin
- HIZLI_BASLANGIC.md dosyasını okuyun

