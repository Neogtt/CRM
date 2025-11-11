const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseService {
  constructor() {
    // SQLite veritabanı D:\LocalCRMSQL klasöründe saklanır
    this.dbDir = 'D:\\LocalCRMSQL';
    this.dbPath = path.join(this.dbDir, 'localcrm.db');
    
    // Klasör yoksa oluştur
    if (!fs.existsSync(this.dbDir)) {
      fs.mkdirSync(this.dbDir, { recursive: true });
      console.log(`Created database directory: ${this.dbDir}`);
    }
    
    // Veritabanını başlat
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
    this.db.pragma('foreign_keys = ON'); // Foreign key constraints
    
    // Tabloları oluştur
    this.initializeTables();
    
    console.log(`SQLite database initialized at: ${this.dbPath}`);
  }
  
  initializeTables() {
    // Müşteriler tablosu
    this.db.exec(`
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
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Teklifler tablosu
    this.db.exec(`
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
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Proformalar tablosu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS proformas (
        id TEXT PRIMARY KEY,
        "Müşteri Adı" TEXT,
        "Tarih" TEXT,
        "Proforma No" TEXT UNIQUE,
        "Tutar" REAL,
        "Açıklama" TEXT,
        "Durum" TEXT,
        "PDF" TEXT,
        "Sipariş Formu" TEXT,
        "Vade (gün)" INTEGER,
        "Termin Tarihi" TEXT,
        "Sevk Durumu" TEXT,
        "Ulaşma Tarihi" TEXT,
        "Satış Temsilcisi" TEXT,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Evraklar (Faturalar) tablosu
    this.db.exec(`
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
        "Satış Temsilcisi" TEXT,
        "Ülke" TEXT,
        "Ödeme Şekli" TEXT,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Siparişler tablosu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        "Müşteri Adı" TEXT,
        "Tarih" TEXT,
        "Sipariş No" TEXT,
        "Tutar" REAL,
        "Durum" TEXT,
        "Proforma No" TEXT,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // ETA tablosu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS eta (
        id TEXT PRIMARY KEY,
        "Proforma No" TEXT,
        "Müşteri Adı" TEXT,
        "Sevk Tarihi" TEXT,
        "ETA Tarihi" TEXT,
        "Ulaşma Tarihi" TEXT,
        "Durum" TEXT,
        "Açıklama" TEXT,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Fuar Kayıtları tablosu
    this.db.exec(`
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
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Etkileşim Günlüğü tablosu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        "Müşteri Adı" TEXT,
        "Tarih" TEXT,
        "Tip" TEXT,
        "Açıklama" TEXT,
        "Satış Temsilcisi" TEXT,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tahsilat Planı tablosu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS payment_plans (
        id TEXT PRIMARY KEY,
        "Müşteri Adı" TEXT,
        "Fatura No" TEXT,
        "Vade Tarihi" TEXT,
        "Tutar" REAL,
        "Ödenen Tutar" REAL DEFAULT 0,
        "Kalan Bakiye" REAL,
        "Ödendi" INTEGER DEFAULT 0,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Hedefler tablosu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        "Yıl" INTEGER,
        "Ciro Hedefi" REAL,
        "Oluşturma Tarihi" TEXT,
        "Güncelleme Tarihi" TEXT,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Temsilciler tablosu
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS representatives (
        id TEXT PRIMARY KEY,
        "Temsilci Adı" TEXT UNIQUE NOT NULL,
        "Ülkeler" TEXT,
        "E-posta" TEXT,
        "Telefon" TEXT,
        "Açıklama" TEXT,
        "created_at" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Index'ler oluştur
    this.createIndexes();
  }
  
  createIndexes() {
    // Müşteri Adı index'leri
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_customers_name ON customers("Müşteri Adı")`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes("Müşteri Adı")`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_proformas_customer ON proformas("Müşteri Adı")`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices("Müşteri Adı")`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders("Müşteri Adı")`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_fairs_customer ON fairs("Müşteri Adı")`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_interactions_customer ON interactions("Müşteri Adı")`);
    
    // Proforma No index'leri
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_proformas_no ON proformas("Proforma No")`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_invoices_proforma ON invoices("Proforma No")`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_eta_proforma ON eta("Proforma No")`);
    
    // Tarih index'leri
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices("Fatura Tarihi")`);
    this.db.exec(`CREATE INDEX IF NOT EXISTS idx_proformas_date ON proformas("Tarih")`);
  }
  
  // Generic insert method
  insert(table, data) {
    const columns = Object.keys(data).map(col => `"${col}"`).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
    const stmt = this.db.prepare(sql);
    return stmt.run(...values);
  }
  
  // Generic update method
  update(table, id, data) {
    const setClause = Object.keys(data).map(col => `"${col}" = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    const sql = `UPDATE ${table} SET ${setClause}, "updated_at" = CURRENT_TIMESTAMP WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    return stmt.run(...values);
  }
  
  // Generic delete method
  delete(table, id) {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    const stmt = this.db.prepare(sql);
    return stmt.run(id);
  }
  
  // Generic get all method
  getAll(table) {
    const sql = `SELECT * FROM ${table} ORDER BY "created_at" DESC`;
    return this.db.prepare(sql).all();
  }
  
  // Generic get by id method
  getById(table, id) {
    const sql = `SELECT * FROM ${table} WHERE id = ?`;
    return this.db.prepare(sql).get(id);
  }
  
  // Get customers
  getCustomers() {
    return this.getAll('customers');
  }
  
  // Get quotes
  getQuotes() {
    return this.getAll('quotes');
  }
  
  // Get proformas
  getProformas() {
    return this.getAll('proformas');
  }
  
  // Get proformas by customer
  getProformasByCustomer(customerName) {
    const sql = `SELECT * FROM proformas WHERE "Müşteri Adı" = ? ORDER BY "Tarih" DESC`;
    return this.db.prepare(sql).all(customerName);
  }
  
  // Get invoices
  getInvoices() {
    return this.getAll('invoices');
  }
  
  // Get orders
  getOrders() {
    return this.getAll('orders');
  }
  
  // Get pending orders (shipped but not invoiced)
  getPendingOrders() {
    const sql = `
      SELECT o.*, p."Müşteri Adı", p."Tarih" as "Termin Tarihi", p."Tutar", p."Açıklama"
      FROM orders o
      LEFT JOIN proformas p ON o."Proforma No" = p."Proforma No"
      WHERE o."Durum" = 'Sevk Edildi'
      AND NOT EXISTS (
        SELECT 1 FROM invoices i WHERE i."Proforma No" = o."Proforma No"
      )
      ORDER BY o."Tarih" DESC
    `;
    return this.db.prepare(sql).all();
  }
  
  // Get ETA
  getETA() {
    return this.getAll('eta');
  }
  
  // Get fairs
  getFairs() {
    return this.getAll('fairs');
  }
  
  // Get interactions
  getInteractions() {
    return this.getAll('interactions');
  }
  
  // Get payment plans
  getPaymentPlans() {
    return this.getAll('payment_plans');
  }
  
  // Get goals
  getGoals() {
    return this.getAll('goals');
  }
  
  // Get representatives
  getRepresentatives() {
    return this.getAll('representatives');
  }
  
  // Load all data (compatible with Excel structure)
  loadDataFromDatabase() {
    return {
      customers: this.getCustomers(),
      quotes: this.getQuotes(),
      proformas: this.getProformas(),
      invoices: this.getInvoices(),
      orders: this.getOrders(),
      eta: this.getETA(),
      fairs: this.getFairs(),
      interactions: this.getInteractions(),
      paymentPlans: this.getPaymentPlans(),
      goals: this.getGoals(),
      representatives: this.getRepresentatives(),
    };
  }
  
  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = DatabaseService;

