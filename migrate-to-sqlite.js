const Database = require('better-sqlite3');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Excel dosyası yolu (mevcut çalışma)
const EXCEL_PATH = path.join(__dirname, 'temp', 'local.xlsx');
// SQLite veritabanı D:\LocalCRMSQL klasöründe
const DB_DIR = 'D:\\LocalCRMSQL';
const DB_PATH = path.join(DB_DIR, 'localcrm.db');

console.log('Migration başlatılıyor...');
console.log('Excel dosyası:', EXCEL_PATH);
console.log('SQLite veritabanı:', DB_PATH);

// Klasör yoksa oluştur
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Excel dosyası var mı kontrol et
if (!fs.existsSync(EXCEL_PATH)) {
  console.error('Excel dosyası bulunamadı:', EXCEL_PATH);
  console.log('Lütfen önce mevcut Excel dosyanızı kontrol edin.');
  process.exit(1);
}

// Veritabanını oluştur
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Tabloları oluştur (database.js'deki şemayı kullan)
function createTables() {
  console.log('Tablolar oluşturuluyor...');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      "Müşteri Adı" TEXT NOT NULL,
      "Telefon" TEXT,
      "E-posta" TEXT,
      "Adres" TEXT,
      "Ülke" TEXT,
      "Satış Temsilcisi" TEXT,
      "Kategori" TEXT,
      "Durum" TEXT,
      "Vade (Gün)" INTEGER,
      "Ödeme Şekli" TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      "Müşteri Adı" TEXT,
      "Tarih" TEXT,
      "Teklif No" TEXT,
      "Tutar" REAL,
      "Ürün/Hizmet" TEXT,
      "Açıklama" TEXT,
      "Durum" TEXT,
      "PDF" TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS proformas (
      id TEXT PRIMARY KEY,
      "Müşteri Adı" TEXT,
      "Tarih" TEXT,
      "Proforma No" TEXT,
      "Tutar" REAL,
      "Açıklama" TEXT,
      "Durum" TEXT,
      "PDF" TEXT,
      "Sipariş Formu" TEXT,
      "Vade (gün)" INTEGER,
      "Termin Tarihi" TEXT,
      "Sevk Durumu" TEXT,
      "Ulaşma Tarihi" TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      "Müşteri Adı" TEXT,
      "Fatura No" TEXT,
      "Proforma No" TEXT,
      "Fatura Tarihi" TEXT,
      "Vade Tarihi" TEXT,
      "Tutar" REAL,
      "Ödenen Tutar" REAL DEFAULT 0,
      "Ödendi" INTEGER DEFAULT 0,
      "Commercial Invoice" TEXT,
      "Sağlık Sertifikası" TEXT,
      "Packing List" TEXT,
      "Konşimento" TEXT,
      "İhracat Beyannamesi" TEXT,
      "Fatura PDF" TEXT,
      "Sipariş Formu" TEXT,
      "Yük Resimleri" TEXT,
      "EK Belgeler" TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      "Müşteri Adı" TEXT,
      "Tarih" TEXT,
      "Sipariş No" TEXT,
      "Tutar" REAL,
      "Durum" TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS eta (
      id TEXT PRIMARY KEY,
      "Proforma No" TEXT,
      "Müşteri Adı" TEXT,
      "Sevk Tarihi" TEXT,
      "ETA Tarihi" TEXT,
      "Ulaşma Tarihi" TEXT,
      "Durum" TEXT,
      "Açıklama" TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS fairs (
      id TEXT PRIMARY KEY,
      "Fuar Adı" TEXT,
      "Müşteri Adı" TEXT,
      "Ülke" TEXT,
      "Telefon" TEXT,
      "E-mail" TEXT,
      "Satış Temsilcisi" TEXT,
      "Açıklamalar" TEXT,
      "Görüşme Kalitesi" TEXT,
      "Tarih" TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      "Müşteri Adı" TEXT,
      "Tarih" TEXT,
      "Tip" TEXT,
      "Satış Temsilcisi" TEXT,
      "Açıklama" TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_plans (
      id TEXT PRIMARY KEY,
      "Müşteri Adı" TEXT,
      "Fatura No" TEXT,
      "Vade Tarihi" TEXT,
      "Tutar" REAL,
      "Ödenen Tutar" REAL DEFAULT 0,
      "Kalan Bakiye" REAL,
      "Ödendi" INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      "Yıl" INTEGER,
      "Ciro Hedefi" REAL,
      "Oluşturma Tarihi" TEXT,
      "Güncelleme Tarihi" TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS representatives (
      id TEXT PRIMARY KEY,
      "Temsilci Adı" TEXT NOT NULL,
      "Ülkeler" TEXT,
      "E-posta" TEXT,
      "Telefon" TEXT,
      "Notlar" TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Index'ler oluştur
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers("Müşteri Adı");
    CREATE INDEX IF NOT EXISTS idx_proformas_no ON proformas("Proforma No");
    CREATE INDEX IF NOT EXISTS idx_invoices_no ON invoices("Fatura No");
    CREATE INDEX IF NOT EXISTS idx_quotes_no ON quotes("Teklif No");
    CREATE INDEX IF NOT EXISTS idx_orders_no ON orders("Sipariş No");
    CREATE INDEX IF NOT EXISTS idx_eta_proforma ON eta("Proforma No");
    CREATE INDEX IF NOT EXISTS idx_fairs_date ON fairs("Tarih");
    CREATE INDEX IF NOT EXISTS idx_interactions_customer ON interactions("Müşteri Adı");
    CREATE INDEX IF NOT EXISTS idx_representatives_name ON representatives("Temsilci Adı");
  `);

  console.log('Tablolar oluşturuldu.');
}

// Excel'den veri oku ve SQLite'a yaz
function migrateData() {
  console.log('Excel dosyası okunuyor...');
  const workbook = XLSX.readFile(EXCEL_PATH);
  
  const sheetMappings = {
    'Müşteriler': 'customers',
    'Teklifler': 'quotes',
    'Proformalar': 'proformas',
    'Evraklar': 'invoices',
    'Faturalar': 'invoices', // Alternatif isim
    'Siparişler': 'orders',
    'ETA': 'eta',
    'Fuar Kayıtları': 'fairs',
    'FuarMusteri': 'fairs', // Alternatif isim
    'Etkileşim Günlüğü': 'interactions',
    'Tahsilat Planı': 'payment_plans',
    'Hedefler': 'goals',
    'Temsilciler': 'representatives'
  };

  let totalMigrated = 0;

  for (const [sheetName, tableName] of Object.entries(sheetMappings)) {
    if (!workbook.SheetNames.includes(sheetName)) {
      console.log(`Sheet bulunamadı: ${sheetName}, atlanıyor...`);
      continue;
    }

    console.log(`\n${sheetName} sheet'i işleniyor...`);
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (jsonData.length === 0) {
      console.log(`  Boş sheet, atlanıyor.`);
      continue;
    }

    // ID yoksa oluştur
    jsonData.forEach(row => {
      if (!row.ID || row.ID === '') {
        row.ID = uuidv4();
      }
    });

    // SQLite'a insert
    const columns = Object.keys(jsonData[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const insert = db.prepare(`INSERT OR REPLACE INTO ${tableName} (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`);

    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        const values = columns.map(col => {
          const val = row[col];
          // Boş string'leri NULL'a çevir
          if (val === '' || val === null || val === undefined) {
            return null;
          }
          return val;
        });
        insert.run(...values);
      }
    });

    insertMany(jsonData);
    console.log(`  ${jsonData.length} kayıt migrate edildi.`);
    totalMigrated += jsonData.length;
  }

  console.log(`\n✅ Migration tamamlandı! Toplam ${totalMigrated} kayıt migrate edildi.`);
  return totalMigrated;
}

// Ana işlem
try {
  createTables();
  const count = migrateData();
  console.log(`\n✅ Veritabanı hazır: ${DB_PATH}`);
  console.log(`📊 Toplam ${count} kayıt migrate edildi.`);
} catch (error) {
  console.error('❌ Migration hatası:', error);
  process.exit(1);
} finally {
  db.close();
}

