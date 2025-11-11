# .env Dosyası Yapılandırması

`.env` dosyası oluşturuldu! Şimdi aşağıdaki ayarları yapılandırmanız gerekebilir:

## ⚠️ Önemli Notlar

**Temel kullanım için şu anki ayarlar yeterlidir!** Program Google API'siz de çalışabilir (sadece bazı özellikler devre dışı kalır).

## 🔧 Yapılandırma Seçenekleri

### 1. Temel Kullanım (Önerilen - Şu an için yeterli)
Şu anki `.env` dosyası ile program çalışacaktır. Google API'ler olmadan da temel özellikler kullanılabilir.

### 2. Google Sheets/Drive Entegrasyonu (Opsiyonel)

Eğer Google Sheets ve Drive entegrasyonu istiyorsanız:

1. **Google Cloud Console'da:**
   - Yeni proje oluşturun
   - Google Sheets API ve Google Drive API'lerini etkinleştirin
   - Service Account oluşturun
   - JSON key dosyasını indirin

2. **JSON key dosyasını proje dizinine koyun:**
   ```bash
   # service-account-key.json dosyasını proje dizinine kopyalayın
   ```

3. **.env dosyasını düzenleyin:**
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   GOOGLE_SHEETS_ID=your_actual_sheets_id
   EXCEL_FILE_ID=your_actual_excel_file_id
   ```

### 3. Email Yapılandırması (Opsiyonel)

Eğer email gönderme özelliğini kullanmak istiyorsanız:

1. **Gmail kullanıyorsanız:**
   - Google Hesabınızda "App Password" oluşturun
   - `.env` dosyasını düzenleyin:
     ```
     SMTP_USER=your_email@gmail.com
     SMTP_PASS=your_app_password
     ```

2. **Diğer SMTP servisleri için:**
   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS değerlerini düzenleyin

## 🚀 Şimdi Ne Yapmalı?

1. **Programı başlatın:**
   ```bash
   # Masaüstündeki "EXPO CRM.command" dosyasına çift tıklayın
   # veya
   ./start-crm.command
   ```

2. **Tarayıcıda açın:**
   - http://localhost:3000

## ✅ Varsayılan Ayarlar

Şu anki `.env` dosyası ile:
- ✅ Program çalışacak
- ✅ Temel özellikler kullanılabilir
- ⚠️ Google Sheets/Drive özellikleri çalışmayacak (opsiyonel)
- ⚠️ Email gönderme çalışmayacak (opsiyonel)

## 📝 Notlar

- Google API'ler olmadan da program çalışır (sadece bazı özellikler devre dışı)
- Email yapılandırması opsiyoneldir
- Temel CRM özellikleri (müşteri yönetimi, teklifler, vb.) Google API'siz de çalışır

## 🔒 Güvenlik

- `.env` dosyası `.gitignore`'da olduğu için Git'e yüklenmez
- Hassas bilgileri (şifreler, API key'ler) `.env` dosyasında saklayın
- `.env` dosyasını asla paylaşmayın

