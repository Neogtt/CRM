# 🚀 Render.com Deployment Rehberi

## Render.com'da Deploy Etme

### 1. Render.com'a Giriş
1. https://render.com adresine gidin
2. GitHub hesabınızla giriş yapın
3. "New +" butonuna tıklayın
4. "Web Service" seçin

### 2. Repository Bağlama
1. "Connect a repository" seçin
2. GitHub repository'nizi seçin: `Neogtt/localcrm`
3. Repository'yi authorize edin

### 3. Build Ayarları

#### Önemli Ayarlar:
- **Name**: `localcrm` (veya istediğiniz isim)
- **Environment**: `Node`
- **Region**: En yakın bölgeyi seçin
- **Branch**: `main`

#### Build Command:
```bash
npm install && cd client && npm install && npm run build
```

#### Start Command:
```bash
node server/index.js
```

### 4. Environment Variables

Aşağıdaki environment variables'ı ekleyin:

```
NODE_ENV=production
PORT=10000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Not:** Render.com otomatik olarak `PORT` environment variable'ını set eder, ancak manuel olarak da ekleyebilirsiniz.

### 5. Deploy

1. "Create Web Service" butonuna tıklayın
2. Render.com build işlemini başlatacak
3. Build süreci tamamlandıktan sonra uygulama otomatik olarak deploy edilecek
4. Logs sekmesinden build ve runtime loglarını izleyebilirsiniz

## 🔧 Sorun Giderme

### Hata: "ENOENT: no such file or directory, stat '/opt/render/project/src/client/build/index.html'"

Bu hata, frontend'in build edilmediği anlamına gelir.

#### Çözüm 1: Build Command'ı Kontrol Edin
Build command'ın şu şekilde olduğundan emin olun:
```bash
npm install && cd client && npm install && npm run build
```

#### Çözüm 2: Build Path'i Kontrol Edin
Server'ın build klasörünü doğru yerde aradığından emin olun. `server/index.js` dosyasında:
```javascript
const buildPath = path.join(__dirname, '../client/build');
```

#### Çözüm 3: Manual Build Test
Local'de test edin:
```bash
npm install
cd client
npm install
npm run build
cd ..
node server/index.js
```

### Build Başarısız Oluyorsa

1. **Node Version**: Render.com'da Node.js versiyonunu kontrol edin
   - `package.json`'da `engines` field'ı ekleyin:
   ```json
   "engines": {
     "node": ">=18.0.0",
     "npm": ">=9.0.0"
   }
   ```

2. **Build Logs**: Render.com'daki "Logs" sekmesinden build hatalarını kontrol edin

3. **Dependencies**: Tüm dependencies'in doğru yüklendiğinden emin olun

### Port Hatası

Render.com otomatik olarak `PORT` environment variable'ını set eder. Server'ın bu port'u kullanması gerekiyor:

```javascript
const PORT = process.env.PORT || 3001;
```

Render.com'da bu genellikle `10000` port'udur.

### Static Files Serve Edilmiyor

Eğer static files (CSS, JS) yüklenmiyorsa:

1. Build klasörünün doğru yerde olduğundan emin olun
2. `express.static` middleware'inin doğru path'i kullandığından emin olun
3. Build sonrası `client/build` klasörünün oluştuğunu kontrol edin

## 📝 Render.com Özellikleri

### Otomatik Deploy
- Her `git push` sonrası otomatik deploy
- Manual deploy seçeneği de mevcut

### Environment Variables
- Güvenli şekilde saklanır
- Her service için ayrı ayrı set edilir

### Logs
- Real-time logs
- Build logs
- Runtime logs

### Health Checks
- Otomatik health check
- Custom health check endpoint eklenebilir

## 🎯 Önerilen Ayarlar

### Build Settings
- **Build Command**: `npm install && cd client && npm install && npm run build`
- **Start Command**: `node server/index.js`
- **Node Version**: 18.x veya üzeri

### Environment Variables
```env
NODE_ENV=production
PORT=10000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Disk Space
- Render.com ücretsiz tier'de 512MB disk space verir
- Excel dosyaları ve PDF'ler için yeterli olmalı
- Gerekirse persistent disk eklenebilir

## 🔄 Güncelleme

Kod güncellemeleri için:
1. Local'de değişiklikleri yapın
2. Git commit ve push yapın
3. Render.com otomatik olarak deploy edecek

## 💡 İpuçları

1. **İlk Deploy**: İlk deploy biraz uzun sürebilir (5-10 dakika)
2. **Build Time**: Build süresi genellikle 3-5 dakika
3. **Cold Start**: Ücretsiz tier'de uygulama 15 dakika idle kalırsa uyur
4. **Logs**: Her zaman logs'u kontrol edin
5. **Environment Variables**: Hassas bilgileri environment variables olarak saklayın

## 📞 Destek

Sorun yaşarsanız:
1. Render.com logs'unu kontrol edin
2. Build logs'unu kontrol edin
3. Environment variables'ı kontrol edin
4. Local'de test edin

## 🚀 Hızlı Başlangıç

1. Render.com'a gidin
2. "New Web Service" seçin
3. Repository'yi bağlayın
4. Build ve Start command'ları ayarlayın
5. Environment variables'ı ekleyin
6. Deploy edin!

---

**Not:** Render.com ücretsiz tier'de uygulama 15 dakika idle kalırsa uyur. İlk istek biraz yavaş olabilir (cold start).

