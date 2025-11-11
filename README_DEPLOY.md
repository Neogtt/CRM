# 🚀 Deployment Hızlı Başlangıç

## GitHub'a Yükleme

```bash
# 1. Git repository oluştur
git init
git add .
git commit -m "Initial commit"

# 2. GitHub'da yeni repo oluştur (github.com)
# 3. Remote ekle ve push et
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git
git branch -M main
git push -u origin main
```

## ⚡ Hızlı Deploy (Railway.app - En Kolay)

1. **Railway'a git:** https://railway.app
2. **"New Project" → "Deploy from GitHub repo"**
3. **Repository'yi seç**
4. **Environment Variables ekle:**
   ```
   NODE_ENV=production
   PORT=3001
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```
5. **Build Settings:**
   - Build Command: `cd client && npm install && npm run build`
   - Start Command: `node server/index.js`
6. **Deploy!** (Otomatik public URL alırsınız)

## 🖥️ VPS Deploy (DigitalOcean - Önerilen)

### 1. Droplet Oluştur
- Ubuntu 22.04
- $6/ay (1GB RAM)

### 2. Kurulum Scripti
```bash
# Server'a SSH ile bağlan
ssh root@YOUR_IP

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
pm2 start server/index.js --name localcrm-backend
pm2 save
pm2 startup
```

### 3. Nginx Konfigürasyonu
```bash
sudo nano /etc/nginx/sites-available/localcrm
```

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        root /var/www/localcrm/client/build;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/localcrm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 👥 Uzaktan Erişim

### Seçenek 1: Domain + VPS (Kalıcı)
- Domain satın al ($10-15/yıl)
- VPS'e bağla
- SSL ekle
- `https://yourdomain.com` ile erişim

### Seçenek 2: Cloudflare Tunnel (Ücretsiz)
```bash
# Server'da
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
./cloudflared tunnel --url http://localhost:3000
```

### Seçenek 3: ngrok (Hızlı Test)
```bash
ngrok http 3000
# Public URL al
```

## 📝 Güncelleme

```bash
cd /var/www/localcrm
git pull
npm install
cd client && npm install && npm run build && cd ..
pm2 restart localcrm-backend
```

## 🔒 Güvenlik

1. **Firewall:**
   ```bash
   sudo ufw allow 22,80,443/tcp
   sudo ufw enable
   ```

2. **SSH Key:** Password yerine SSH key kullan

3. **SSL:** Mutlaka HTTPS kullan

## 💾 Backup

```bash
# Cron job
0 2 * * * tar -czf /backup/localcrm-$(date +\%Y\%m\%d).tar.gz /var/www/localcrm/temp/
```

## 📊 Monitoring

```bash
pm2 monit
pm2 logs
```

## 💡 Öneriler

- **Başlangıç:** Railway.app (kolay, hızlı)
- **Production:** DigitalOcean VPS (tam kontrol, kalıcı)
- **Domain:** Namecheap veya GoDaddy
- **SSL:** Let's Encrypt (ücretsiz)
- **Monitoring:** UptimeRobot (ücretsiz)

