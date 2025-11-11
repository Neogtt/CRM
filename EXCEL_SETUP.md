# 📊 Excel Setup Rehberi

## İlk Kurulum - Excel Template Sistemi

Program remote çalışacak şekilde yapılandırılmıştır. Excel dosyası remote server'da saklanır ve ilk kurulumda boş bir template oluşturulur.

## 🚀 İlk Kurulum Adımları

### 1. Program İlk Kez Çalıştırıldığında

Program ilk kez çalıştırıldığında:
- ✅ Boş bir Excel template dosyası otomatik oluşturulur (`temp/local.xlsx`)
- ✅ Tüm sayfalar (sheets) doğru header'lar ile oluşturulur
- ✅ Genel Bakış sayfasında "İlk Kurulum" uyarısı görüntülenir

### 2. Excel Template İndirme

Genel Bakış sayfasında iki seçenek sunulur:

#### A) Demo Veri ile Template İndir
- Örnek bir müşteri (Demo Şirket A.Ş.) ile template indirilir
- Format örneği olarak kullanılabilir
- Demo müşteri ID'si: `demo-001`

#### B) Boş Template İndir
- Sadece header'ları içeren boş template indirilir
- Kendi verilerinizi ekleyebilirsiniz

### 3. Excel Dosyasını Doldurma

İndirilen template'i açın ve verilerinizi ekleyin:

**Müşteriler Sayfası:**
- ID: Otomatik oluşturulur (boş bırakabilirsiniz)
- Müşteri Adı: Zorunlu
- Telefon, E-posta, Adres, Ülke: İsteğe bağlı
- Satış Temsilcisi, Kategori, Durum: İsteğe bağlı
- Vade (Gün): Sayısal değer
- Ödeme Şekli: Metin

**Diğer Sayfalar:**
- Teklifler
- Proformalar
- Evraklar (Faturalar)
- Siparişler
- ETA
- Fuar Kayıtları
- Etkileşim Günlüğü
- Tahsilat Planı
- Hedefler

### 4. Excel Import

1. Doldurduğunuz Excel dosyasını kaydedin
2. Genel Bakış sayfasından "Excel Import" butonuna tıklayın
3. Excel dosyanızı seçin
4. Birleştirme modunu seçin:
   - **Append**: Mevcut verilere ekler
   - **Replace**: Mevcut verileri siler ve yeni verileri yükler
5. Import butonuna tıklayın
6. Başarılı import sonrası otomatik olarak Genel Bakış sayfasına yönlendirilirsiniz

## 📋 Excel Sayfa Yapısı

### Müşteriler
```
ID | Müşteri Adı | Telefon | E-posta | Adres | Ülke | Satış Temsilcisi | Kategori | Durum | Vade (Gün) | Ödeme Şekli
```

### Teklifler
```
ID | Müşteri Adı | Tarih | Teklif No | Tutar | Ürün/Hizmet | Açıklama | Durum | PDF
```

### Proformalar
```
ID | Müşteri Adı | Tarih | Proforma No | Tutar | Açıklama | Durum | PDF | Sipariş Formu | Vade (gün) | Termin Tarihi | Sevk Durumu | Ulaşma Tarihi
```

### Evraklar (Faturalar)
```
ID | Müşteri Adı | Fatura No | Proforma No | Fatura Tarihi | Vade Tarihi | Tutar | Ödenen Tutar | Ödendi | Commercial Invoice | Sağlık Sertifikası | Packing List | Konşimento | İhracat Beyannamesi | Fatura PDF | Sipariş Formu | Yük Resimleri | EK Belgeler
```

### Siparişler
```
ID | Müşteri Adı | Tarih | Sipariş No | Tutar | Durum
```

### ETA
```
ID | Proforma No | Müşteri Adı | Sevk Tarihi | ETA Tarihi | Ulaşma Tarihi | Durum | Açıklama
```

### Fuar Kayıtları
```
ID | Fuar Adı | Müşteri Adı | Ülke | Telefon | E-mail | Satış Temsilcisi | Açıklamalar | Görüşme Kalitesi | Tarih
```

### Etkileşim Günlüğü
```
ID | Müşteri Adı | Tarih | Tip | Açıklama
```

### Tahsilat Planı
```
ID | Müşteri Adı | Fatura No | Vade Tarihi | Tutar | Ödenen Tutar | Kalan Bakiye | Ödendi
```

### Hedefler
```
ID | Yıl | Ciro Hedefi | Oluşturma Tarihi | Güncelleme Tarihi
```

## 🔄 Excel Dosyası Yönetimi

### Excel İndirme
- Genel Bakış sayfasından "Excel İndir" butonuna tıklayarak mevcut Excel dosyasını indirebilirsiniz
- Dosya adı: `LocalCRM_Data_YYYY-MM-DD.xlsx`

### Excel Durumu
Genel Bakış sayfasında Excel dosyası durumu gösterilir:
- Müşteri sayısı
- Teklif sayısı
- Proforma sayısı
- Fatura sayısı

## 📝 Önemli Notlar

1. **ID Alanı**: ID alanı boş bırakılırsa, import sırasında otomatik olarak UUID oluşturulur
2. **Tarih Formatı**: Tarihler Excel'de date formatında olmalıdır (örn: 2024-01-15)
3. **Sayısal Alanlar**: Tutar, Vade (Gün), Ciro Hedefi gibi alanlar sayısal olmalıdır
4. **Sayfa İsimleri**: Sayfa isimleri tam olarak eşleşmeli (büyük/küçük harf duyarlı değil)
5. **Demo Veri**: Demo müşteri (ID: `demo-001`) hasData kontrolünde filtrelenir

## 🛠️ Troubleshooting

### Excel Import Hatası
- Dosya formatını kontrol edin (.xlsx veya .xls)
- Sayfa isimlerinin doğru olduğundan emin olun
- Header'ların doğru olduğundan emin olun
- Tarih formatlarını kontrol edin

### Veri Görünmüyor
- Excel import sonrası sayfayı yenileyin
- Excel status'u kontrol edin (Genel Bakış sayfası)
- Console loglarını kontrol edin

### Template İndirme Hatası
- Backend servisinin çalıştığından emin olun
- Temp klasörünün yazma izni olduğundan emin olun

## 🚀 Remote Deployment

Remote server'da çalıştırırken:
1. Excel dosyası server'da `temp/local.xlsx` konumunda saklanır
2. İlk kurulumda boş template otomatik oluşturulur
3. Kullanıcı template'i indirip doldurur
4. Doldurulan Excel import edilir
5. Program normal çalışmaya devam eder

## 📞 Destek

Sorun yaşarsanız:
1. Console loglarını kontrol edin
2. Excel dosyası formatını kontrol edin
3. Backend servisinin çalıştığından emin olun
4. Temp klasörü izinlerini kontrol edin

