# 🚀 Hızlı Başlangıç - Deployment

## GitHub'a Yükleme

```bash
# 1. Repository oluştur
git init
git add .
git commit -m "Initial commit"

# 2. GitHub'da yeni repo oluştur
# 3. Push et
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git
git branch -M main
git push -u origin main
```

## 🎯 Önerilen Deployment Seçenekleri

### 1️⃣ Railway.app (En Kolay - Önerilen Başlangıç)

**Avantajlar:**
- ✅ 5 dakikada deploy
- ✅ Otomatik HTTPS
- ✅ GitHub entegrasyonu
- ✅ Ücretsiz tier ($5 kredi/ay)

**Adımlar:**
1. https://railway.app → Sign up with GitHub
2. "New Project" → "Deploy from GitHub repo"
3. Repository'yi seç
4. Environment Variables ekle:
   ```
   NODE_ENV=production
   PORT=3001
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```
5. Deploy! (Otomatik public URL)

**Not:** Railway'de file system geçici olabilir. Excel dosyaları için persistent storage gerekebilir.

---

### 2️⃣ DigitalOcean VPS (En Esnek - Production)

**Avantajlar:**
- ✅ Tam kontrol
- ✅ Kalıcı storage (Excel dosyaları için ideal)
- ✅ $6/ay başlangıç
- ✅ Domain bağlanabilir

**Hızlı Kurulum:**
```bash
# 1. DigitalOcean'da Ubuntu 22.04 droplet oluştur ($6/ay)

# 2. SSH ile bağlan
ssh root@YOUR_SERVER_IP

# 3. Kurulum scripti çalıştır
curl -fsSL https://raw.githubusercontent.com/your-repo/setup.sh | bash

# VEYA manuel kurulum:

# Node.js kur
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 kur
sudo npm install -g pm2

# Nginx kur
sudo apt-get install nginx

# Projeyi klonla
cd /var/www
git clone https://github.com/KULLANICI_ADI/REPO_ADI.git localcrm
cd localcrm

# Dependencies
npm install
cd client && npm install && npm run build && cd ..

# .env oluştur
nano .env
# (SMTP bilgilerini ekle)

# PM2 ile başlat
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Nginx konfigürasyonu
sudo nano /etc/nginx/sites-available/localcrm
# (DEPLOY.md'deki nginx config'i yapıştır)

sudo ln -s /etc/nginx/sites-available/localcrm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

### 3️⃣ Render.com (Ücretsiz Tier)

**Avantajlar:**
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

## 👥 Arkadaşınız İçin Uzaktan Erişim

### Seçenek 1: Domain + VPS (Kalıcı Çözüm)
1. Domain satın al (Namecheap, GoDaddy - $10-15/yıl)
2. VPS'e domain'i bağla (DNS ayarları)
3. SSL ekle (Let's Encrypt - ücretsiz)
4. `https://yourdomain.com` ile erişim

### Seçenek 2: Cloudflare Tunnel (Ücretsiz)
```bash
# Server'da
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
./cloudflared tunnel --url http://localhost:3000
# Public URL alırsınız (örn: https://xxxx.trycloudflare.com)
```

### Seçenek 3: ngrok (Hızlı Test)
```bash
# Server'da
ngrok http 3000
# Public URL alırsınız
```

### Seçenek 4: SSH Tunneling (Geçici)
```bash
# Arkadaşınızın bilgisayarında
ssh -L 3000:localhost:3000 user@server-ip
# Sonra localhost:3000'den erişebilir
```

---

## 📊 Maliyet Karşılaştırması

| Platform | Aylık | Özellikler |
|----------|-------|------------|
| **Railway** | $5-20 | Kolay, otomatik, sınırlı storage |
| **DigitalOcean** | $6-12 | Tam kontrol, kalıcı storage |
| **Render** | $0-25 | Ücretsiz tier, idle uyur |
| **Linode** | $5 | Ucuz, tam kontrol |
| **Hetzner** | €4.15 | Avrupa, çok ucuz |

---

## 🔒 Güvenlik Checklist

- [ ] `.env` dosyası git'e eklenmemeli
- [ ] Firewall aktif (sadece 22, 80, 443 portları açık)
- [ ] SSL/HTTPS kullan (Let's Encrypt ücretsiz)
- [ ] SSH key authentication (password değil)
- [ ] Fail2Ban kurulu (brute force koruması)
- [ ] Düzenli backup (Excel dosyaları)

---

## 🆘 Sorun Giderme

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

## 📝 Güncelleme

```bash
cd /var/www/localcrm
git pull
npm install
cd client && npm install && npm run build && cd ..
pm2 restart localcrm-backend
```

---

## 💡 Önerilen Yol

**Başlangıç için:**
1. Railway.app ile test et (5 dakika)
2. Beğenirsen → DigitalOcean VPS'e geç ($6/ay)
3. Domain ekle ($10/yıl)
4. SSL ekle (Let's Encrypt - ücretsiz)

**Production için:**
- DigitalOcean VPS ($6-12/ay)
- Domain ($10-15/yıl)
- PM2 + Nginx
- Let's Encrypt SSL
- Günlük backup

---

Daha detaylı bilgi için `DEPLOY.md` dosyasına bakın.

