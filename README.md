# 📊 LocalCRM

LocalCRM, müşteri ilişkileri yönetimi için geliştirilmiş bir Node.js ve React tabanlı web uygulamasıdır.

## 🌟 Özellikler

- ✅ Müşteri Yönetimi (Cari Hesaplar)
- ✅ Teklif Yönetimi
- ✅ Proforma Yönetimi
- ✅ Fatura İşlemleri
- ✅ Sipariş Operasyonları
- ✅ ETA İzleme
- ✅ Fuar Kayıtları
- ✅ Etkileşim Günlüğü
- ✅ Satış Analitiği
- ✅ Hedef Yönetimi
- ✅ Özel Gün Tebrikleri
- ✅ Temsilci Yönetimi
- ✅ Excel Import/Export
- ✅ Email Gönderimi

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js (v18.0.0 veya üzeri)
- npm (v9.0.0 veya üzeri)
- Git

### Windows Kurulumu (Önerilen)

**Windows kullanıcıları için en kolay yöntem:**

1. Node.js'i yükleyin: https://nodejs.org/
2. Projeyi indirin veya klonlayın
3. `setup-windows.bat` dosyasına **çift tıklayın** (otomatik kurulum)
4. `start-crm.bat` dosyasına **çift tıklayın** (uygulamayı başlat)
5. Tarayıcıda açın: **http://localhost:3001**

**Detaylı Windows kurulum rehberi:** [WINDOWS_KURULUM.md](./WINDOWS_KURULUM.md)

### Linux/macOS Kurulumu

```bash
# Repository'yi klonlayın
git clone https://github.com/Neogtt/localcrm.git

# Klasöre gidin
cd localcrm

# Bağımlılıkları yükleyin
npm install
cd client && npm install && cd ..

# Environment variables oluşturun
cp .env.example .env
# .env dosyasını düzenleyin

# Uygulamayı çalıştırın
npm start        # Server
npm run client   # Client (ayrı terminal)
```

Detaylı kurulum için [KURULUM.md](./KURULUM.md) dosyasını okuyun.

Hızlı kurulum için [HIZLI_BASLANGIC.md](./HIZLI_BASLANGIC.md) dosyasını okuyun.

## 📁 Proje Yapısı

```
localcrm/
├── client/          # React frontend
├── server/          # Node.js backend
├── temp/            # Excel dosyaları
├── .env             # Environment variables
└── package.json     # Proje yapılandırması
```

## 🔧 Yapılandırma

### Environment Variables

`.env` dosyasında aşağıdaki değişkenleri ayarlayın:

```env
PORT=3001
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
REACT_APP_API_URL=http://localhost:3001/api
```

## 📖 Dokümantasyon

- [WINDOWS_KURULUM.md](./WINDOWS_KURULUM.md) - **Windows kurulum rehberi (Önerilen)**
- [KURULUM.md](./KURULUM.md) - Detaylı kurulum rehberi
- [HIZLI_BASLANGIC.md](./HIZLI_BASLANGIC.md) - Hızlı başlangıç rehberi
- [RENDER_SETUP.md](./RENDER_SETUP.md) - Render.com deployment rehberi
- [ENV_YAPILANDIRMA.md](./ENV_YAPILANDIRMA.md) - Environment variables yapılandırması

## 🚢 Deployment

### Render.com

Render.com'da deploy etmek için [RENDER_SETUP.md](./RENDER_SETUP.md) dosyasını okuyun.

### Diğer Platformlar

- Railway.app
- DigitalOcean
- AWS
- Heroku

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje özel bir projedir.

## 📞 İletişim

Sorularınız için GitHub Issues kullanın.

## 🎉 Teşekkürler

LocalCRM'yi kullandığınız için teşekkürler!

