# Deployment Rehberi

## 1. GitHub'a Yükleme

### İlk Kurulum
```bash
# Git repository oluştur
git init
git add .
git commit -m "Initial commit"

# GitHub'da yeni repository oluştur, sonra:
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git
git branch -M main
git push -u origin main
```

### Önemli Notlar
- `.env` dosyası `.gitignore`'da olmalı (sensitive bilgiler)
- `temp/` klasörü git'e eklenmemeli (Excel dosyaları local)
- Production'da environment variables kullanılmalı

## 2. Deployment Seçenekleri

### Seçenek 1: VPS (Önerilen - En Esnek)

#### A) DigitalOcean Droplet ($6/ay)
1. **DigitalOcean'da Droplet oluştur:**
   - Ubuntu 22.04 LTS
   - 1GB RAM minimum (2GB önerilir)
   - $6/ay başlangıç

2. **SSH ile bağlan:**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

3. **Node.js kurulumu:**
   ```bash
   # Node.js 18.x kur
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # PM2 kur (process manager)
   sudo npm install -g pm2
   
   # Nginx kur (reverse proxy)
   sudo apt-get install nginx
   ```

4. **Projeyi klonla:**
   ```bash
   cd /var/www
   git clone https://github.com/KULLANICI_ADI/REPO_ADI.git localcrm
   cd localcrm
   
   # Dependencies kur
   npm install
   cd client
   npm install
   cd ..
   ```

5. **Environment variables ayarla:**
   ```bash
   # .env dosyası oluştur
   nano .env
   ```
   ```env
   NODE_ENV=production
   PORT=3001
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

6. **PM2 ile backend başlat:**
   ```bash
   cd /var/www/localcrm
   pm2 start server/index.js --name "localcrm-backend"
   pm2 save
   pm2 startup
   ```

7. **Frontend build:**
   ```bash
   cd client
   npm run build
   ```

8. **Nginx konfigürasyonu:**
   ```bash
   sudo nano /etc/nginx/sites-available/localcrm
   ```
   ```nginx
   server {
       listen 80;
       server_name YOUR_DOMAIN_OR_IP;

       # Frontend
       location / {
           root /var/www/localcrm/client/build;
           try_files $uri $uri/ /index.html;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   ```bash
   sudo ln -s /etc/nginx/sites-available/localcrm /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Firewall ayarları:**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

#### B) Linode veya Hetzner (Daha Ucuz Alternatifler)
- Linode: $5/ay
- Hetzner: €4.15/ay
- Aynı kurulum adımları geçerli

### Seçenek 2: Railway.app (Kolay Deploy)

1. **Railway'a kaydol:** https://railway.app
2. **GitHub repository'yi bağla**
3. **Environment variables ekle:**
   - `NODE_ENV=production`
   - `PORT=3001`
   - SMTP bilgileri
4. **Build komutları:**
   - Build: `npm install && cd client && npm install && npm run build`
   - Start: `node server/index.js`
5. **Not:** Railway'de file system geçici olabilir, Excel dosyaları için persistent storage gerekebilir

### Seçenek 3: Render.com (Ücretsiz Tier)

1. **Render'a kaydol:** https://render.com
2. **Web Service oluştur:**
   - GitHub repo'yu bağla
   - Build Command: `cd client && npm install && npm run build`
   - Start Command: `node server/index.js`
3. **Environment variables ekle**
4. **Not:** Ücretsiz tier'de uygulama 15 dakika idle kalırsa uyur

## 3. Uzaktan Erişim (Arkadaşınız için)

### Seçenek 1: VPS + Domain (En İyi)
1. Domain satın al (Namecheap, GoDaddy - $10-15/yıl)
2. VPS'e domain'i bağla
3. SSL sertifikası ekle (Let's Encrypt - ücretsiz):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```
4. Arkadaşınız `https://yourdomain.com` adresinden erişebilir

### Seçenek 2: SSH Tunneling (Geçici Çözüm)
```bash
# Arkadaşınızın bilgisayarında:
ssh -L 3000:localhost:3000 USER@YOUR_SERVER_IP
# Sonra localhost:3000'den erişebilir
```

### Seçenek 3: Cloudflare Tunnel (Ücretsiz)
1. Cloudflare hesabı oluştur
2. Cloudflare Tunnel kur:
   ```bash
   # Server'da
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
   chmod +x cloudflared
   ./cloudflared tunnel --url http://localhost:3000
   ```
3. Public URL alırsınız

### Seçenek 4: ngrok (Hızlı Test)
```bash
# Server'da
ngrok http 3000
# Public URL alırsınız (ücretsiz tier'de sınırlı)
```

## 4. Güvenlik Önerileri

1. **Firewall:**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **SSH Key Authentication:**
   ```bash
   # Password yerine SSH key kullan
   ssh-keygen -t rsa -b 4096
   ```

3. **Fail2Ban (Brute force koruması):**
   ```bash
   sudo apt install fail2ban
   ```

4. **SSL/HTTPS:** Mutlaka kullanın (Let's Encrypt ücretsiz)

5. **Environment Variables:** Hassas bilgileri `.env`'de tutun, git'e eklemeyin

## 5. Backup Stratejisi

### Excel Dosyası Yedekleme
```bash
# Cron job ile günlük yedekleme
crontab -e
# Ekleyin:
0 2 * * * tar -czf /backup/localcrm-$(date +\%Y\%m\%d).tar.gz /var/www/localcrm/temp/
```

### Database Backup (Eğer ileride PostgreSQL'e geçilirse)
```bash
# PostgreSQL backup
0 3 * * * pg_dump -U user dbname > /backup/db-$(date +\%Y\%m\%d).sql
```

## 6. Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 logs
```

### Uptime Monitoring
- UptimeRobot (ücretsiz)
- Pingdom
- StatusCake

## 7. Güncelleme Süreci

```bash
# Server'da
cd /var/www/localcrm
git pull origin main
npm install
cd client
npm install
npm run build
cd ..
pm2 restart localcrm-backend
```

## 8. Troubleshooting

### Port zaten kullanımda:
```bash
sudo lsof -i :3001
sudo kill -9 PID
```

### Nginx hatası:
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### PM2 logları:
```bash
pm2 logs localcrm-backend
```

## 9. Maliyet Karşılaştırması

| Seçenek | Aylık Maliyet | Kolaylık | Özellikler |
|---------|--------------|----------|------------|
| DigitalOcean | $6-12 | Orta | Tam kontrol, kalıcı storage |
| Railway | $5-20 | Kolay | Otomatik deploy, sınırlı storage |
| Render | $0-25 | Kolay | Ücretsiz tier var, idle uyur |
| Linode | $5 | Orta | Tam kontrol, ucuz |
| Hetzner | €4.15 | Orta | Avrupa, ucuz |

## 10. Önerilen Setup

**Başlangıç için:**
- DigitalOcean Droplet ($6/ay) + Domain ($10/yıl)
- PM2 + Nginx
- Let's Encrypt SSL
- Günlük backup

**İleride:**
- PostgreSQL'e geçiş (daha güvenilir)
- Redis cache (performans)
- Load balancer (yüksek trafik için)
- CDN (statik dosyalar için)

