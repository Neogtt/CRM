# EXPO CRM - Başlatma Talimatları

## Hızlı Başlatma

### Yöntem 1: Masaüstü Kısayolu (Önerilen)
1. Masaüstündeki **"EXPO CRM.command"** dosyasına çift tıklayın
2. Terminal penceresi açılacak
3. Birkaç saniye bekleyin
4. Tarayıcı otomatik olarak açılacak (http://localhost:3000)

### Yöntem 2: Terminal'den Başlatma
```bash
cd /Users/kemalcelikkalkan/localcrm
./start-crm.command
```

### Yöntem 3: Manuel Başlatma

**Terminal 1 (Backend):**
```bash
cd /Users/kemalcelikkalkan/localcrm
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd /Users/kemalcelikkalkan/localcrm/client
npm start
```

## Program Nerede?

Uygulama çalıştığında:

1. **Backend API:** http://localhost:3001
   - API endpoint'leri burada çalışır
   - Tarayıcıdan http://localhost:3001/api/health adresini açarak test edebilirsiniz

2. **Frontend (Ana Uygulama):** http://localhost:3000
   - **Bu adresi tarayıcınızda açmanız gerekir!**
   - Tarayıcı otomatik açılmazsa, manuel olarak açın
   - Chrome, Safari veya Firefox'ta çalışır

## Sorun Giderme

### Program Başlamıyorsa

1. **Portlar kullanımda mı kontrol edin:**
   ```bash
   lsof -i :3000 -i :3001
   ```

2. **Node.js yüklü mü kontrol edin:**
   ```bash
   node -v
   npm -v
   ```

3. **Bağımlılıklar yüklü mü kontrol edin:**
   ```bash
   ls node_modules
   ls client/node_modules
   ```

4. **.env dosyası var mı kontrol edin:**
   ```bash
   ls -la .env
   ```

### Tarayıcı Açılmıyorsa

Manuel olarak şu adresi açın:
```
http://localhost:3000
```

### Backend Hata Veriyorsa

Backend log dosyasını kontrol edin:
```bash
cat backend.log
```

### Port Zaten Kullanımda Hatası

Eğer port 3000 veya 3001 kullanımda ise:

```bash
# Portu kullanan process'i bulun
lsof -i :3000
lsof -i :3001

# Process'i durdurun (PID'yi değiştirin)
kill -9 [PID]
```

## Programı Durdurma

1. Terminal penceresinde **Ctrl+C** tuşlarına basın
2. Veya Terminal'i kapatın

## Log Dosyaları

- Backend log: `backend.log`
- Terminal çıktısı: Terminal penceresinde görüntülenir

## Önemli Notlar

- İlk çalıştırmada bağımlılıklar yüklenecektir (5-10 dakika sürebilir)
- Backend başladıktan sonra Frontend başlar
- Frontend başladıktan 10 saniye sonra tarayıcı otomatik açılır
- Eğer tarayıcı açılmazsa, manuel olarak http://localhost:3000 adresini açın

## Yardım

Sorun yaşıyorsanız:
1. Terminal çıktısını kontrol edin
2. `backend.log` dosyasını kontrol edin
3. Portların kullanılabilir olduğundan emin olun
4. Node.js ve npm'in yüklü olduğundan emin olun

