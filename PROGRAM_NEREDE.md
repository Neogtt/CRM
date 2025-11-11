# 📍 EXPO CRM Programı Nerede?

## 🌐 Program Tarayıcıda Çalışır!

EXPO CRM bir web uygulamasıdır. Program başladıktan sonra **tarayıcınızda** açmanız gerekir.

## 🚀 Nasıl Erişilir?

### 1. Otomatik Açılma
Program başlatıldığında, 10 saniye sonra tarayıcı otomatik olarak açılır.

### 2. Manuel Açma
Eğer tarayıcı otomatik açılmazsa:

1. **Tarayıcınızı açın** (Chrome, Safari, Firefox, vb.)
2. **Adres çubuğuna şunu yazın:**
   ```
   http://localhost:3000
   ```
3. **Enter'a basın**

## 📍 Adresler

- **Frontend (Ana Uygulama):** http://localhost:3000
  - Bu adresi tarayıcıda açmanız gerekir!
  - Tüm CRM özellikleri burada

- **Backend API:** http://localhost:3001
  - API endpoint'leri burada çalışır
  - Test için: http://localhost:3001/api/health

## ✅ Program Çalışıyor mu Kontrol Edin

### Terminal'de Kontrol:
```bash
# Portları kontrol et
lsof -i :3000 -i :3001

# Process'leri kontrol et
ps aux | grep node
```

### Tarayıcıda Kontrol:
1. http://localhost:3000 adresini açın
2. Eğer "Cannot connect" hatası alıyorsanız, program henüz başlamamıştır
3. Birkaç saniye bekleyip tekrar deneyin

## 🔧 Program Başlamıyorsa

### Yöntem 1: Masaüstü Kısayolu
1. Masaüstündeki **"EXPO CRM.command"** dosyasına çift tıklayın
2. Terminal penceresi açılacak
3. Birkaç saniye bekleyin
4. Tarayıcıda http://localhost:3000 adresini açın

### Yöntem 2: Terminal'den Başlatma
```bash
cd /Users/kemalcelikkalkan/localcrm

# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend (yeni bir terminal açın)
cd client
npm start
```

### Yöntem 3: Hızlı Başlatma
```bash
cd /Users/kemalcelikkalkan/localcrm
./hizli-baslat.sh
```

## 📱 Program Nasıl Görünür?

Program başladığında:
- Sol tarafta menü görünür (Genel Bakış, Müşteriler, vb.)
- Sağ tarafta içerik görünür
- Modern, temiz bir arayüz

## 🛑 Programı Durdurma

1. Terminal penceresinde **Ctrl+C** tuşlarına basın
2. Veya Terminal'i kapatın

## 💡 İpuçları

- Program ilk başlatmada biraz zaman alabilir (bağımlılıklar yükleniyor)
- Backend başladıktan sonra Frontend başlar
- Her iki servis de çalıştıktan sonra tarayıcıda açabilirsiniz
- Port 3000 veya 3001 kullanımda ise, önceki process'i durdurun

## ❓ Hala Sorun mu Var?

1. Terminal çıktısını kontrol edin
2. `backend.log` ve `frontend.log` dosyalarını kontrol edin
3. Portların kullanılabilir olduğundan emin olun
4. Node.js'in yüklü olduğundan emin olun: `node -v`

