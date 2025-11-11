const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const DatabaseService = require('./databaseService');
const { v4: uuidv4 } = require('uuid');

/**
 * Excel dosyasından SQLite veritabanına veri migrate etme script'i
 * Mevcut Excel dosyasındaki tüm verileri SQLite'a aktarır
 */
class ExcelToSQLiteMigrator {
  constructor() {
    this.excelPath = path.join(__dirname, '../../temp/local.xlsx');
    this.dbService = new DatabaseService();
  }
  
  readSheet(workbook, sheetName) {
    try {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
        return [];
      }
      return XLSX.utils.sheet_to_json(sheet, { defval: null });
    } catch (error) {
      console.warn(`Sheet "${sheetName}" okunamadı:`, error.message);
      return [];
    }
  }
  
  async migrate() {
    try {
      console.log('Excel\'den SQLite\'a veri migrate işlemi başlatılıyor...');
      
      if (!fs.existsSync(this.excelPath)) {
        console.warn('Excel dosyası bulunamadı:', this.excelPath);
        console.log('Boş bir SQLite veritabanı oluşturuldu.');
        return { success: true, message: 'Excel dosyası bulunamadı, boş veritabanı oluşturuldu.' };
      }
      
      // Excel dosyasını oku
      const workbook = XLSX.readFile(this.excelPath);
      
      // Transaction başlat
      const transaction = this.dbService.db.transaction(() => {
        let migratedCount = 0;
        
        // Müşteriler
        const customers = this.readSheet(workbook, 'Müşteriler');
        if (customers && customers.length > 0) {
          customers.forEach(customer => {
            if (!customer.id) customer.id = uuidv4();
            this.dbService.insert('customers', customer);
            migratedCount++;
          });
          console.log(`✓ ${customers.length} müşteri migrate edildi`);
        }
        
        // Teklifler
        const quotes = this.readSheet(workbook, 'Teklifler');
        if (quotes && quotes.length > 0) {
          quotes.forEach(quote => {
            if (!quote.id) quote.id = uuidv4();
            this.dbService.insert('quotes', quote);
            migratedCount++;
          });
          console.log(`✓ ${quotes.length} teklif migrate edildi`);
        }
        
        // Proformalar
        const proformas = this.readSheet(workbook, 'Proformalar');
        if (proformas && proformas.length > 0) {
          proformas.forEach(proforma => {
            if (!proforma.id) proforma.id = uuidv4();
            this.dbService.insert('proformas', proforma);
            migratedCount++;
          });
          console.log(`✓ ${proformas.length} proforma migrate edildi`);
        }
        
        // Evraklar (Faturalar)
        let invoices = this.readSheet(workbook, 'Evraklar');
        if (!invoices || invoices.length === 0) {
          invoices = this.readSheet(workbook, 'Faturalar');
        }
        if (invoices && invoices.length > 0) {
          invoices.forEach(invoice => {
            if (!invoice.id) invoice.id = uuidv4();
            // Ödendi boolean'ını integer'a çevir
            if (invoice.Ödendi === true || invoice.Ödendi === 'true' || invoice.Ödendi === 1) {
              invoice.Ödendi = 1;
            } else {
              invoice.Ödendi = 0;
            }
            this.dbService.insert('invoices', invoice);
            migratedCount++;
          });
          console.log(`✓ ${invoices.length} fatura migrate edildi`);
        }
        
        // Siparişler
        const orders = this.readSheet(workbook, 'Siparişler');
        if (orders && orders.length > 0) {
          orders.forEach(order => {
            if (!order.id) order.id = uuidv4();
            this.dbService.insert('orders', order);
            migratedCount++;
          });
          console.log(`✓ ${orders.length} sipariş migrate edildi`);
        }
        
        // ETA
        const eta = this.readSheet(workbook, 'ETA');
        if (eta && eta.length > 0) {
          eta.forEach(etaItem => {
            if (!etaItem.id) etaItem.id = uuidv4();
            this.dbService.insert('eta', etaItem);
            migratedCount++;
          });
          console.log(`✓ ${eta.length} ETA kaydı migrate edildi`);
        }
        
        // Fuar Kayıtları
        let fairs = this.readSheet(workbook, 'Fuar Kayıtları');
        if (!fairs || fairs.length === 0) {
          fairs = this.readSheet(workbook, 'FuarMusteri');
        }
        if (fairs && fairs.length > 0) {
          fairs.forEach(fair => {
            if (!fair.id) fair.id = uuidv4();
            this.dbService.insert('fairs', fair);
            migratedCount++;
          });
          console.log(`✓ ${fairs.length} fuar kaydı migrate edildi`);
        }
        
        // Etkileşim Günlüğü
        const interactions = this.readSheet(workbook, 'Etkileşim Günlüğü');
        if (interactions && interactions.length > 0) {
          interactions.forEach(interaction => {
            if (!interaction.id) interaction.id = uuidv4();
            this.dbService.insert('interactions', interaction);
            migratedCount++;
          });
          console.log(`✓ ${interactions.length} etkileşim kaydı migrate edildi`);
        }
        
        // Tahsilat Planı
        const paymentPlans = this.readSheet(workbook, 'Tahsilat Planı');
        if (paymentPlans && paymentPlans.length > 0) {
          paymentPlans.forEach(plan => {
            if (!plan.id) plan.id = uuidv4();
            // Ödendi boolean'ını integer'a çevir
            if (plan.Ödendi === true || plan.Ödendi === 'true' || plan.Ödendi === 1) {
              plan.Ödendi = 1;
            } else {
              plan.Ödendi = 0;
            }
            this.dbService.insert('payment_plans', plan);
            migratedCount++;
          });
          console.log(`✓ ${paymentPlans.length} tahsilat planı migrate edildi`);
        }
        
        // Hedefler
        const goals = this.readSheet(workbook, 'Hedefler');
        if (goals && goals.length > 0) {
          goals.forEach(goal => {
            if (!goal.id) goal.id = uuidv4();
            this.dbService.insert('goals', goal);
            migratedCount++;
          });
          console.log(`✓ ${goals.length} hedef migrate edildi`);
        }
        
        // Temsilciler
        const representatives = this.readSheet(workbook, 'Temsilciler');
        if (representatives && representatives.length > 0) {
          representatives.forEach(rep => {
            if (!rep.id) rep.id = uuidv4();
            this.dbService.insert('representatives', rep);
            migratedCount++;
          });
          console.log(`✓ ${representatives.length} temsilci migrate edildi`);
        }
        
        return { success: true, migratedCount };
      });
      
      const result = transaction();
      
      console.log(`\n✅ Migration tamamlandı! Toplam ${result.migratedCount} kayıt migrate edildi.`);
      return { success: true, migratedCount: result.migratedCount };
      
    } catch (error) {
      console.error('Migration hatası:', error);
      return { success: false, error: error.message };
    }
  }
}

// Eğer doğrudan çalıştırılıyorsa
if (require.main === module) {
  const migrator = new ExcelToSQLiteMigrator();
  migrator.migrate()
    .then(result => {
      if (result.success) {
        console.log('Migration başarılı!');
        process.exit(0);
      } else {
        console.error('Migration başarısız:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Migration hatası:', error);
      process.exit(1);
    });
}

module.exports = ExcelToSQLiteMigrator;

