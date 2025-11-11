# 🔨 EXPO CRM Installer Oluşturma Rehberi

Bu rehber, EXPO CRM uygulamasını Windows installer (`expocrmsetup.exe`) olarak derlemek için adım adım talimatlar içerir.

## 📋 Gereksinimler

- **Windows 10/11**
- **Node.js** v18.0.0 veya üzeri
- **npm** v9.0.0 veya üzeri
- **İnternet bağlantısı** (ilk kurulum için)

## 🚀 Hızlı Build (Otomatik)

### Yöntem 1: Batch Script (Önerilen)

1. `build-expocrm.bat` dosyasına **çift tıklayın**
2. Build işlemi tamamlanana kadar bekleyin
3. Installer dosyası `dist` klasöründe oluşturulacak: `expocrmsetup.exe`

### Yöntem 2: Komut Satırı

```cmd
npm run build:win
```

Installer dosyası `dist` klasöründe oluşturulacak.

## 📝 Adım Adım Build İşlemi

### 1. Bağımlılıkları Yükleyin

```cmd
npm install
cd client
npm install
cd ..
```

### 2. Client'ı Build Edin

```cmd
cd client
npm run build
cd ..
```

### 3. Installer'ı Oluşturun

```cmd
npm run build:win
```

Veya electron-builder'ı doğrudan kullanın:

```cmd
electron-builder --win --config electron-builder.yml
```

## 📁 Çıktı Dosyası

Installer dosyası şu konumda oluşturulur:
```
dist/expocrmsetup.exe
```

## ⚙️ Yapılandırma

### Installer Ayarları

Installer ayarları `electron-builder.yml` dosyasında yapılandırılmıştır:

- **Dosya Adı**: `expocrmsetup.exe`
- **Ürün Adı**: `EXPO CRM`
- **Kurulum Tipi**: NSIS (Windows Installer)
- **Masaüstü Kısayolu**: Otomatik oluşturulur
- **Başlat Menüsü Kısayolu**: Otomatik oluşturulur

### Özelleştirme

Installer'ı özelleştirmek için `electron-builder.yml` dosyasını düzenleyin:

```yaml
nsis:
  oneClick: false  # true = tek tıkla kurulum
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: EXPO CRM
```

## 🔍 Sorun Giderme

### Build Hatası: "electron-builder not found"

```cmd
npm install --save-dev electron-builder
```

### Build Hatası: "Client build failed"

```cmd
cd client
npm install
npm run build
cd ..
```

### Build Hatası: "Icon not found"

`build/icon.ico` dosyasının mevcut olduğundan emin olun. Yoksa yapılandırmadan icon satırlarını kaldırın.

### Build Çok Uzun Sürüyor

İlk build işlemi uzun sürebilir çünkü:
- Electron binary'leri indirilir
- Tüm bağımlılıklar paketlenir
- Node.js runtime dahil edilir

Sonraki build'ler daha hızlı olacaktır.

## 📦 Installer İçeriği

Installer şunları içerir:

- ✅ Electron runtime
- ✅ Node.js runtime
- ✅ Server kodları
- ✅ Build edilmiş React uygulaması
- ✅ Tüm node_modules
- ✅ Electron main process
- ✅ Varsayılan .env dosyası (ilk çalıştırmada oluşturulur)

## 🚀 Installer Kullanımı

1. `expocrmsetup.exe` dosyasına çift tıklayın
2. Kurulum sihirbazını takip edin
3. Kurulum tamamlandıktan sonra masaüstünden veya başlat menüsünden uygulamayı başlatın

## 📝 Notlar

- Installer yaklaşık 200-300 MB boyutunda olabilir (tüm bağımlılıklar dahil)
- Kurulum sırasında yönetici yetkisi gerekebilir
- İlk çalıştırmada `.env` dosyası otomatik oluşturulur
- `temp` klasörü otomatik oluşturulur

## 🎉 Başarılı!

Installer başarıyla oluşturuldu! Artık `expocrmsetup.exe` dosyasını dağıtabilirsiniz.

**İyi çalışmalar! 🚀**

