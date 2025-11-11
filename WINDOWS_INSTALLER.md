# 🪟 Windows Installer (Setup.exe) Oluşturma Rehberi

Bu rehber, LocalCRM uygulaması için Windows installer (setup.exe) oluşturma adımlarını içerir.

## 📋 Gereksinimler

- Node.js (v18.0.0 veya üzeri)
- npm (v9.0.0 veya üzeri)
- Windows 10/11 (installer oluşturmak için)
- Git

## 🔧 Kurulum Adımları

### 1. Bağımlılıkları Yükleyin

```bash
# Proje kök dizininde
npm install

# Client bağımlılıklarını yükleyin
cd client
npm install
cd ..

# Electron ve Electron Builder'ı yükleyin
npm install --save-dev electron electron-builder
```

### 2. Client'ı Build Edin

```bash
# Client'ı production build edin
cd client
npm run build
cd ..
```

### 3. Icon Dosyalarını Hazırlayın

`build` klasörü oluşturun ve icon dosyalarını ekleyin:

```
build/
  - icon.ico (Windows icon, 256x256 veya daha büyük)
  - icon.icns (macOS icon)
  - icon.png (Linux icon, 512x512)
```

**Not:** Icon dosyaları olmadan da installer oluşturulabilir, ancak önerilir.

### 4. Package.json'ı Güncelleyin

`package.json` dosyasına şunları ekleyin:

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron": "electron .",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux",
    "build:all": "electron-builder --win --mac --linux"
  }
}
```

### 5. Installer'ı Oluşturun

```bash
# Windows installer oluştur
npm run build:win
```

Build işlemi tamamlandığında, `dist` klasöründe `LocalCRM Setup x.x.x.exe` dosyası oluşacaktır.

## 📦 Installer Özellikleri

- ✅ Otomatik Node.js kontrolü
- ✅ Kullanıcı kurulum dizini seçebilir
- ✅ Masaüstü kısayolu oluşturur
- ✅ Başlat menüsüne ekler
- ✅ Kaldırma (uninstall) desteği
- ✅ Otomatik güncelleme (opsiyonel)

## 🚀 Kullanım

### Installer'ı Çalıştırma

1. `dist/LocalCRM Setup x.x.x.exe` dosyasını çift tıklayın
2. Kurulum sihirbazını takip edin
3. Kurulum dizinini seçin (varsayılan: `C:\Program Files\LocalCRM`)
4. "Install" butonuna tıklayın
5. Kurulum tamamlandıktan sonra "Finish" butonuna tıklayın

### Uygulamayı Başlatma

1. Masaüstündeki "LocalCRM" kısayoluna çift tıklayın
2. Veya Başlat menüsünden "LocalCRM"yi seçin
3. Uygulama otomatik olarak server'ı başlatır ve tarayıcıyı açar

## 🔧 Gelişmiş Yapılandırma

### Custom Installer Script

`build/installer.nsh` dosyası oluşturarak custom installer script'i ekleyebilirsiniz:

```nsis
; Custom installer script
!macro customInstall
  ; Custom installation steps
!macroend

!macro customUnInstall
  ; Custom uninstallation steps
!macroend
```

### Environment Variables

Kurulum sırasında environment variables'ı ayarlamak için:

1. `electron/main.js` dosyasında environment variables'ı ayarlayın
2. Veya kurulum sonrası `.env` dosyası oluşturun

## 🐛 Sorun Giderme

### Build hatası

```bash
# Node modules'ü temizleyin
rm -rf node_modules
rm -rf client/node_modules

# Yeniden yükleyin
npm install
cd client && npm install && cd ..

# Build edin
npm run build:win
```

### Icon hatası

Icon dosyaları eksikse, Electron Builder varsayılan icon kullanacaktır. Icon eklemek için:

1. `build/icon.ico` dosyasını oluşturun (256x256 veya daha büyük)
2. `electron-builder.yml` dosyasında icon path'ini kontrol edin

### Port hatası

Port 3001 zaten kullanılıyorsa:

1. `electron/main.js` dosyasında farklı bir port belirleyin
2. Veya mevcut process'i durdurun

## 📝 Notlar

- Installer oluşturmak için Windows gereklidir
- macOS installer için macOS gereklidir
- Linux installer için Linux gereklidir
- Cross-platform build için CI/CD kullanılabilir

## 🔗 Kaynaklar

- [Electron Builder Documentation](https://www.electron.build/)
- [NSIS Documentation](https://nsis.sourceforge.io/Docs/)
- [Electron Documentation](https://www.electronjs.org/docs)

## 🎉 Başarılı!

Installer başarıyla oluşturulduysa, `dist` klasöründe `LocalCRM Setup x.x.x.exe` dosyası bulunmalıdır.

**İyi çalışmalar! 🚀**

