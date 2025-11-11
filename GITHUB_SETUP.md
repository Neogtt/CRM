# 📦 GitHub'a Yükleme ve Deployment

## 1. GitHub'a Yükleme

### İlk Kurulum

```bash
# 1. Git repository oluştur
cd /Users/kemalcelikkalkan/localcrm
git init

# 2. Tüm dosyaları ekle
git add .

# 3. İlk commit
git commit -m "Initial commit: LocalCRM Node.js implementation"

# 4. GitHub'da yeni repository oluştur
# - https://github.com adresine git
# - "New repository" butonuna tıkla
# - Repository adı: localcrm (veya istediğiniz ad)
# - Public veya Private seçin
# - "Create repository" butonuna tıkla

# 5. Remote ekle ve push et
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git
git branch -M main
git push -u origin main
```

### Önemli Notlar

- ✅ `.env` dosyası `.gitignore`'da (güvenlik)
- ✅ `temp/` klasörü git'e eklenmiyor (Excel dosyaları local)
- ✅ `files/` klasörü git'e eklenmiyor (PDF'ler, resimler)
- ✅ `node_modules/` git'e eklenmiyor

## 2. Deployment Seçenekleri

### 🚀 Seçenek 1: Railway.app (En Kolay - Önerilen)

**Neden Railway?**
- ✅ 5 dakikada deploy
- ✅ Otomatik HTTPS
- ✅ GitHub entegrasyonu
- ✅ Ücretsiz $5 kredi/ay
- ✅ Kolay environment variables

**Adımlar:**
1. https://railway.app → "Start a New Project"
2. "Deploy from GitHub repo" seç
3. GitHub repository'yi seç
4. Environment Variables ekle:
   ```
   NODE_ENV=production
   PORT=3001
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```
5. Deploy! (Otomatik public URL alırsınız)

**Not:** Railway'de file system geçici olabilir. Excel dosyaları için persistent storage gerekebilir.

---

### 🖥️ Seçenek 2: DigitalOcean VPS (En Esnek)

**Neden DigitalOcean?**
- ✅ Tam kontrol
- ✅ Kalıcı storage (Excel dosyaları için ideal)
- ✅ $6/ay başlangıç
- ✅ Domain bağlanabilir
- ✅ SSL (Let's Encrypt - ücretsiz)

**Hızlı Kurulum Scripti:**

```bash
# 1. DigitalOcean'da Ubuntu 22.04 droplet oluştur ($6/ay)
# 2. SSH ile bağlan
ssh root@YOUR_SERVER_IP

# 3. Kurulum
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2

# 4. Projeyi klonla
cd /var/www
git clone https://github.com/KULLANICI_ADI/REPO_ADI.git localcrm
cd localcrm

# 5. Dependencies
npm install
cd client && npm install && npm run build && cd ..

# 6. .env oluştur
nano .env
# (SMTP bilgilerini ekle)

# 7. PM2 ile başlat
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 8. Nginx konfigürasyonu (DEPLOY.md'ye bak)
# 9. SSL (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com
```

Detaylı kurulum için `DEPLOY.md` dosyasına bakın.

---

### 🌐 Seçenek 3: Render.com (Ücretsiz Tier)

**Neden Render?**
- ✅ Ücretsiz tier var
- ✅ Kolay deploy
- ⚠️ 15 dakika idle kalırsa uyur

**Adımlar:**
1. https://render.com → Sign up
2. "New Web Service" → GitHub repo bağla
3. Settings:
   - Build Command: `cd client && npm install && npm run build`
   - Start Command: `node server/index.js`
4. Environment Variables ekle
5. Deploy!

---

## 3. Arkadaşınız İçin Uzaktan Erişim

### Seçenek 1: Domain + VPS (Kalıcı Çözüm) ⭐

1. **Domain satın al:**
   - Namecheap: https://www.namecheap.com ($10-15/yıl)
   - GoDaddy: https://www.godaddy.com ($10-15/yıl)

2. **DNS ayarları:**
   - Domain'in DNS ayarlarına git
   - A record ekle:
     - Host: `@`
     - Value: VPS IP adresi
     - TTL: 3600

3. **VPS'e domain'i bağla:**
   - Nginx konfigürasyonunda `server_name yourdomain.com;` kullan
   - SSL ekle: `sudo certbot --nginx -d yourdomain.com`

4. **Erişim:**
   - Arkadaşınız `https://yourdomain.com` adresinden erişebilir
   - SSL ile güvenli bağlantı

---

### Seçenek 2: Cloudflare Tunnel (Ücretsiz) ⭐

**Avantajlar:**
- ✅ Ücretsiz
- ✅ Domain gerektirmez
- ✅ SSL otomatik
- ✅ Kolay kurulum

**Kurulum:**
```bash
# Server'da
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
./cloudflared tunnel --url http://localhost:3000
```

**Sonuç:**
- Public URL alırsınız (örn: `https://xxxx.trycloudflare.com`)
- Arkadaşınız bu URL'den erişebilir
- Ücretsiz ve güvenli

---

### Seçenek 3: ngrok (Hızlı Test)

```bash
# Server'da
ngrok http 3000
# Public URL alırsınız
```

**Not:** Ücretsiz tier'de URL her başlatışta değişir.

---

### Seçenek 4: SSH Tunneling (Geçici)

```bash
# Arkadaşınızın bilgisayarında
ssh -L 3000:localhost:3000 user@server-ip
# Sonra localhost:3000'den erişebilir
```

---

## 4. Güvenlik Checklist

- [ ] `.env` dosyası git'e eklenmemeli ✅
- [ ] Firewall aktif (sadece 22, 80, 443 portları açık)
- [ ] SSL/HTTPS kullan (Let's Encrypt ücretsiz)
- [ ] SSH key authentication (password değil)
- [ ] Fail2Ban kurulu (brute force koruması)
- [ ] Düzenli backup (Excel dosyaları)

---

## 5. Güncelleme Süreci

```bash
# Server'da
cd /var/www/localcrm
git pull origin main
npm install
cd client && npm install && npm run build && cd ..
pm2 restart localcrm-backend
```

---

## 6. Önerilen Yol

### Başlangıç için:
1. **Railway.app** ile test et (5 dakika)
2. Beğenirsen → **DigitalOcean VPS**'e geç ($6/ay)
3. Domain ekle ($10-15/yıl)
4. SSL ekle (Let's Encrypt - ücretsiz)

### Production için:
- **DigitalOcean VPS** ($6-12/ay)
- **Domain** ($10-15/yıl)
- **PM2** + **Nginx**
- **Let's Encrypt SSL**
- **Günlük backup**

---

## 7. Maliyet Karşılaştırması

| Platform | Aylık | Özellikler |
|----------|-------|------------|
| **Railway** | $5-20 | Kolay, otomatik, sınırlı storage |
| **DigitalOcean** | $6-12 | Tam kontrol, kalıcı storage |
| **Render** | $0-25 | Ücretsiz tier, idle uyur |
| **Linode** | $5 | Ucuz, tam kontrol |
| **Hetzner** | €4.15 | Avrupa, çok ucuz |

---

## 8. Yardımcı Dosyalar

- `DEPLOY.md` - Detaylı deployment rehberi
- `QUICK_START.md` - Hızlı başlangıç
- `ecosystem.config.js` - PM2 konfigürasyonu
- `Dockerfile` - Docker desteği
- `deploy.sh` - Deployment script

---

## 9. Sorun Giderme

### Port zaten kullanımda
```bash
sudo lsof -i :3001
sudo kill -9 PID
```

### PM2 logları
```bash
pm2 logs localcrm-backend
pm2 monit
```

### Nginx hatası
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

---

Daha detaylı bilgi için `DEPLOY.md` ve `QUICK_START.md` dosyalarına bakın.

