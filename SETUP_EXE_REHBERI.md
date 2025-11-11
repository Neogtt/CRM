# 🪟 Windows Setup.exe Oluşturma ve Kullanım Rehberi

Bu rehber, LocalCRM için Windows installer (setup.exe) oluşturma ve kullanma adımlarını içerir.

## 📦 Setup.exe Oluşturma

### Yöntem 1: Otomatik Build Script (Önerilen)

**Windows'ta:**

1. `build-installer.bat` dosyasını çift tıklayın
2. Script otomatik olarak:
   - Bağımlılıkları yükler
   - Client'ı build eder
   - Windows installer'ı oluşturur

**Manuel Adımlar:**

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Client bağımlılıklarını yükle
cd client
npm install
cd ..

# 3. Client'ı build et
cd client
npm run build
cd ..

# 4. Windows installer'ı oluştur
npm run build:win
```

### Yöntem 2: Electron Builder (Gelişmiş)

```bash
# Tüm platformlar için
npm run build:all

# Sadece Windows için
npm run build:win

# Sadece macOS için
npm run build:mac

# Sadece Linux için
npm run build:linux
```

## 📁 Oluşturulan Dosyalar

Build işlemi tamamlandığında:

```
dist/
  └── LocalCRM Setup 1.0.0.exe  (Windows installer)
```

## 🚀 Setup.exe Kullanımı

### Kurulum

1. **Setup.exe'yi çalıştırın:**
   - `dist/LocalCRM Setup 1.0.0.exe` dosyasını çift tıklayın
   - Yönetici izni istenebilir

2. **Kurulum sihirbazını takip edin:**
   - Hoş geldiniz ekranı → "Next"
   - Lisans sözleşmesi → "I Agree"
   - Kurulum dizini seçin (varsayılan: `C:\Program Files\LocalCRM`) → "Next"
   - Başlat menüsü klasörü → "Next"
   - Masaüstü kısayolu (isteğe bağlı) → "Next"
   - Kurulum → "Install"
   - Kurulum tamamlandı → "Finish"

3. **Uygulamayı başlatın:**
   - Masaüstündeki "LocalCRM" kısayoluna çift tıklayın
   - Veya Başlat menüsünden "LocalCRM"yi seçin

### İlk Kullanım

1. **Uygulama açıldığında:**
   - Server otomatik olarak başlatılır
   - Tarayıcı otomatik olarak açılır
   - Ana sayfa yüklenir

2. **Excel dosyası yükleme:**
   - "Excel İçe Aktarma" menüsüne gidin
   - "Şablon İndir" butonuna tıklayın
   - Şablonu doldurun veya mevcut Excel dosyanızı yükleyin

3. **Kullanıma başlayın:**
   - Müşteri ekleyin
   - Teklif oluşturun
   - Fatura işlemleri yapın

## 🔧 Gereksinimler

### Kurulum Öncesi

- **Windows 10/11** (64-bit)
- **İnternet bağlantısı** (ilk kurulum için)
- **Yönetici izinleri** (kurulum için)

### Çalışma Zamanı

- **Node.js** (v18.0.0 veya üzeri) - Installer otomatik kontrol eder
- **İnternet bağlantısı** (opsiyonel, sadece email gönderimi için)

## 🐛 Sorun Giderme

### Setup.exe çalışmıyor

**Sorun:** Setup.exe açılmıyor veya hata veriyor

**Çözüm:**
1. Yönetici olarak çalıştırın (sağ tık → "Run as administrator")
2. Antivirus yazılımını geçici olarak kapatın
3. Windows Defender'ı kontrol edin
4. Setup.exe'yi farklı bir konuma kopyalayın

### Node.js bulunamadı

**Sorun:** "Node.js is not installed" hatası

**Çözüm:**
1. Node.js'i yükleyin: https://nodejs.org/
2. LTS versiyonunu seçin (v18.0.0 veya üzeri)
3. Kurulum sonrası bilgisayarı yeniden başlatın
4. Setup.exe'yi tekrar çalıştırın

### Port 3001 zaten kullanılıyor

**Sorun:** "Port 3001 is already in use" hatası

**Çözüm:**
1. Görev Yöneticisi'ni açın (Ctrl + Shift + Esc)
2. "Node.js" process'ini bulun ve sonlandırın
3. Uygulamayı tekrar başlatın

### Server başlatılamadı

**Sorun:** "Server could not be started" hatası

**Çözüm:**
1. Kurulum dizinindeki `temp` klasörünün yazılabilir olduğundan emin olun
2. Antivirus yazılımını kontrol edin
3. Windows Firewall'u kontrol edin
4. Uygulamayı yönetici olarak çalıştırın

### Excel dosyası yüklenemiyor

**Sorun:** Excel dosyası yüklenirken hata oluşuyor

**Çözüm:**
1. Excel dosyasının doğru formatta olduğundan emin olun (.xlsx)
2. Dosya boyutunun 50MB'dan küçük olduğundan emin olun
3. `temp` klasörünün yazılabilir olduğundan emin olun
4. Uygulamayı yönetici olarak çalıştırın

## 📝 Notlar

- **Kurulum dizini:** Varsayılan olarak `C:\Program Files\LocalCRM`
- **Veri dizini:** `C:\Program Files\LocalCRM\temp` (Excel dosyaları burada saklanır)
- **Log dosyaları:** `C:\Users\<Kullanıcı>\AppData\Roaming\LocalCRM\logs`
- **Kaldırma:** Windows Ayarlar → Uygulamalar → LocalCRM → Kaldır

## 🔄 Güncelleme

Yeni bir versiyon yüklemek için:

1. Eski versiyonu kaldırın (opsiyonel)
2. Yeni setup.exe'yi çalıştırın
3. Kurulum sihirbazını takip edin
4. Verileriniz korunacaktır (temp klasörü)

## 🎯 Özellikler

- ✅ Otomatik Node.js kontrolü
- ✅ Tek tıkla kurulum
- ✅ Masaüstü kısayolu
- ✅ Başlat menüsü entegrasyonu
- ✅ Otomatik server başlatma
- ✅ Veri yedekleme (temp klasörü)
- ✅ Kaldırma desteği

## 📞 Destek

Sorun yaşarsanız:

1. Bu rehberi tekrar okuyun
2. GitHub Issues'da arama yapın
3. Yeni bir issue oluşturun

## 🎉 Başarılı!

Setup.exe başarıyla oluşturuldu ve kullanıma hazır!

**İyi çalışmalar! 🚀**

