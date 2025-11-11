const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class DataService {
  constructor() {
    // Excel dosyası SERVER tarafında saklanır - Tüm kullanıcılar aynı Excel dosyasını paylaşır
    // Server'ın çalıştığı dizindeki temp klasöründe bulunur
    // Kullanıcıların local hard diskinde değil, server'da tek bir Excel dosyası vardır
    this.tempDir = path.join(__dirname, '../../temp');
    this.localExcelPath = path.join(this.tempDir, 'local.xlsx');
    
    // Ensure temp directory exists on server
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    
    // Create initial Excel file on server if it doesn't exist
    if (!fs.existsSync(this.localExcelPath)) {
      this.createInitialExcelFile();
    }

    // Cache for data
    this.cache = {
      customers: null,
      quotes: null,
      proformas: null,
      invoices: null,
      orders: null,
      eta: null,
      fairs: null,
      interactions: null,
      goals: null,
      representatives: null,
      lastSync: null,
    };
  }

  createInitialExcelFile(withDemoData = false) {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Create all sheets with proper headers
      this.createSheetWithHeaders(workbook, 'Müşteriler', this.getCustomerHeaders(), withDemoData ? this.getDemoCustomer() : []);
      this.createSheetWithHeaders(workbook, 'Teklifler', this.getQuoteHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Proformalar', this.getProformaHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Evraklar', this.getInvoiceHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Siparişler', this.getOrderHeaders(), []);
      this.createSheetWithHeaders(workbook, 'ETA', this.getETAHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Fuar Kayıtları', this.getFairHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Etkileşim Günlüğü', this.getInteractionHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Tahsilat Planı', this.getPaymentPlanHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Hedefler', this.getGoalHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Temsilciler', this.getRepresentativeHeaders(), []);
      
      XLSX.writeFile(workbook, this.localExcelPath);
      console.log('Initial Excel file created at:', this.localExcelPath, withDemoData ? '(with demo data)' : '(empty)');
    } catch (error) {
      console.error('Error creating initial Excel file:', error);
    }
  }

  createSheetWithHeaders(workbook, sheetName, headers, data = []) {
    // If data is provided, use it; otherwise create empty sheet with headers
    if (data.length > 0) {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    } else {
      // Create sheet with headers only
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }
  }

  getCustomerHeaders() {
    return ['ID', 'Müşteri Adı', 'Telefon', 'E-posta', 'Adres', 'Ülke', 'Satış Temsilcisi', 'Kategori', 'Durum', 'Vade (Gün)', 'Ödeme Şekli'];
  }

  getQuoteHeaders() {
    return ['ID', 'Müşteri Adı', 'Tarih', 'Teklif No', 'Tutar', 'Ürün/Hizmet', 'Açıklama', 'Durum', 'PDF'];
  }

  getProformaHeaders() {
    return ['ID', 'Müşteri Adı', 'Tarih', 'Proforma No', 'Tutar', 'Açıklama', 'Durum', 'PDF', 'Sipariş Formu', 'Vade (gün)', 'Termin Tarihi', 'Sevk Durumu', 'Ulaşma Tarihi'];
  }

  getInvoiceHeaders() {
    return ['ID', 'Müşteri Adı', 'Fatura No', 'Proforma No', 'Fatura Tarihi', 'Vade Tarihi', 'Tutar', 'Ödenen Tutar', 'Ödendi', 'Commercial Invoice', 'Sağlık Sertifikası', 'Packing List', 'Konşimento', 'İhracat Beyannamesi', 'Fatura PDF', 'Sipariş Formu', 'Yük Resimleri', 'EK Belgeler'];
  }

  getOrderHeaders() {
    return ['ID', 'Müşteri Adı', 'Tarih', 'Sipariş No', 'Tutar', 'Durum'];
  }

  getETAHeaders() {
    return ['ID', 'Proforma No', 'Müşteri Adı', 'Sevk Tarihi', 'ETA Tarihi', 'Ulaşma Tarihi', 'Durum', 'Açıklama'];
  }

  getFairHeaders() {
    return ['ID', 'Fuar Adı', 'Müşteri Adı', 'Ülke', 'Telefon', 'E-mail', 'Satış Temsilcisi', 'Açıklamalar', 'Görüşme Kalitesi', 'Tarih'];
  }

  getInteractionHeaders() {
    return ['ID', 'Müşteri Adı', 'Tarih', 'Tip', 'Açıklama'];
  }

  getPaymentPlanHeaders() {
    return ['ID', 'Müşteri Adı', 'Fatura No', 'Vade Tarihi', 'Tutar', 'Ödenen Tutar', 'Kalan Bakiye', 'Ödendi'];
  }

  getGoalHeaders() {
    return ['ID', 'Yıl', 'Ciro Hedefi', 'Oluşturma Tarihi', 'Güncelleme Tarihi'];
  }

  getRepresentativeHeaders() {
    return ['ID', 'Temsilci Adı', 'Bölgeler', 'Ülkeler', 'Notlar', 'Oluşturma Tarihi', 'Güncelleme Tarihi'];
  }

  getDemoCustomer() {
    return [{
      'ID': 'demo-001',
      'Müşteri Adı': 'Demo Şirket A.Ş.',
      'Telefon': '+90 212 123 45 67',
      'E-posta': 'info@demosirket.com',
      'Adres': 'İstanbul, Türkiye',
      'Ülke': 'Türkiye',
      'Satış Temsilcisi': 'Demo Temsilci',
      'Kategori': 'A Kategori',
      'Durum': 'Aktif',
      'Vade (Gün)': '30',
      'Ödeme Şekli': 'Havale/EFT'
    }];
  }
  
  getSheetName(key) {
    const mapping = {
      'customers': 'Müşteriler',
      'quotes': 'Teklifler',
      'proformas': 'Proformalar',
      'invoices': 'Evraklar', // Python kodunda "Evraklar" sheet'i kullanılıyor
      'orders': 'Siparişler',
      'eta': 'ETA',
      'fairs': 'FuarMusteri', // Python kodunda "FuarMusteri" sheet'i kullanılıyor
      'interactions': 'Etkileşim Günlüğü',
      'paymentPlans': 'Tahsilat Planı',
      'goals': 'Hedefler',
      'representatives': 'Temsilciler',
    };
    return mapping[key] || key;
  }

  async loadDataFromExcel() {
    try {
      // Server'daki Excel dosyasını oku - Tüm kullanıcılar aynı dosyayı kullanır
      if (!fs.existsSync(this.localExcelPath)) {
        console.warn('Server Excel file not found, creating new one (empty)');
        this.createInitialExcelFile(false); // Create empty template
        return this.getEmptyDataStructure();
      }
      
      // Read Excel file from server disk
      const workbook = XLSX.readFile(this.localExcelPath);
      
      // Read invoices from "Evraklar" or "Faturalar" sheet (support both)
      let invoices = this.readSheet(workbook, 'Evraklar') || [];
      if (invoices.length === 0) {
        invoices = this.readSheet(workbook, 'Faturalar') || [];
      }
      
      const data = {
        customers: this.readSheet(workbook, 'Müşteriler') || [],
        quotes: this.readSheet(workbook, 'Teklifler') || [],
        proformas: this.readSheet(workbook, 'Proformalar') || [],
        invoices: invoices, // Support both "Evraklar" and "Faturalar" sheet names
        orders: this.readSheet(workbook, 'Siparişler') || [],
        eta: this.readSheet(workbook, 'ETA') || [],
        fairs: this.readSheet(workbook, 'Fuar Kayıtları') || this.readSheet(workbook, 'FuarMusteri') || [], // Excel'de "Fuar Kayıtları" sheet'i kullanılıyor
        interactions: this.readSheet(workbook, 'Etkileşim Günlüğü') || [],
        paymentPlans: this.readSheet(workbook, 'Tahsilat Planı') || [],
        goals: this.readSheet(workbook, 'Hedefler') || [],
        representatives: this.readSheet(workbook, 'Temsilciler') || [],
      };

      // Update cache
      this.cache = {
        ...data,
        lastSync: new Date(),
      };

      return data;
    } catch (error) {
      console.error('Error loading data from Excel:', error);
      // Return empty data structure instead of throwing error
      return this.getEmptyDataStructure();
    }
  }

  getEmptyDataStructure() {
    return {
      customers: [],
      quotes: [],
      proformas: [],
      invoices: [],
      orders: [],
      eta: [],
      fairs: [],
      interactions: [],
      paymentPlans: [],
      goals: [],
      representatives: [],
    };
  }

  readSheet(workbook, sheetName) {
    try {
      if (!workbook.SheetNames.includes(sheetName)) {
        return [];
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      return jsonData;
    } catch (error) {
      console.error(`Error reading sheet ${sheetName}:`, error);
      return [];
    }
  }

  async saveDataToExcel(data) {
    try {
      const workbook = XLSX.utils.book_new();

      // Write each sheet
      if (data.customers && data.customers.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.customers);
        XLSX.utils.book_append_sheet(workbook, ws, 'Müşteriler');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Müşteriler');
      }

      if (data.quotes && data.quotes.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.quotes);
        XLSX.utils.book_append_sheet(workbook, ws, 'Teklifler');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Teklifler');
      }

      if (data.proformas && data.proformas.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.proformas);
        XLSX.utils.book_append_sheet(workbook, ws, 'Proformalar');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Proformalar');
      }

      // Save invoices to "Evraklar" sheet (Python kodunda "Evraklar" sheet'i kullanılıyor)
      // But also check if "Faturalar" sheet exists and merge data if needed
      if (data.invoices && data.invoices.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.invoices);
        XLSX.utils.book_append_sheet(workbook, ws, 'Evraklar');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Evraklar');
      }

      if (data.orders && data.orders.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.orders);
        XLSX.utils.book_append_sheet(workbook, ws, 'Siparişler');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Siparişler');
      }

      if (data.eta && data.eta.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.eta);
        XLSX.utils.book_append_sheet(workbook, ws, 'ETA');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(workbook, ws, 'ETA');
      }

      if (data.fairs && data.fairs.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.fairs);
        XLSX.utils.book_append_sheet(workbook, ws, 'Fuar Kayıtları');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Fuar Kayıtları');
      }

      if (data.interactions && data.interactions.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.interactions);
        XLSX.utils.book_append_sheet(workbook, ws, 'Etkileşim Günlüğü');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Etkileşim Günlüğü');
      }

      if (data.paymentPlans && data.paymentPlans.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.paymentPlans);
        XLSX.utils.book_append_sheet(workbook, ws, 'Tahsilat Planı');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([[]]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Tahsilat Planı');
      }

      if (data.goals && data.goals.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.goals);
        XLSX.utils.book_append_sheet(workbook, ws, 'Hedefler');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([this.getGoalHeaders()]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Hedefler');
      }

      if (data.representatives && data.representatives.length > 0) {
        const ws = XLSX.utils.json_to_sheet(data.representatives);
        XLSX.utils.book_append_sheet(workbook, ws, 'Temsilciler');
      } else {
        const ws = XLSX.utils.aoa_to_sheet([this.getRepresentativeHeaders()]);
        XLSX.utils.book_append_sheet(workbook, ws, 'Temsilciler');
      }

      // Save to server Excel file - Tüm kullanıcılar bu dosyayı paylaşır
      XLSX.writeFile(workbook, this.localExcelPath);
      console.log('Data saved to server Excel file:', this.localExcelPath);

      // Update cache
      this.cache = {
        ...data,
        lastSync: new Date(),
      };

      return true;
    } catch (error) {
      console.error('Error saving data to Excel:', error);
      throw error;
    }
  }

  // Google Sheets sync removed - using local storage only
  async syncWithSheets() {
    // No-op: Google Sheets sync is disabled
    return await this.loadDataFromExcel();
  }

  getCachedData() {
    return this.cache;
  }

  smartToNum(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    
    // Remove currency symbols and spaces
    const cleaned = String(value)
      .replace(/[USD€$₺TLtlTl,\s]/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.');
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'TRY',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  // Create Excel template file (for download)
  createTemplateFile(withDemoData = false, outputPath = null) {
    try {
      const templatePath = outputPath || path.join(this.tempDir, `template_${Date.now()}.xlsx`);
      const workbook = XLSX.utils.book_new();
      
      // Create all sheets with proper headers
      this.createSheetWithHeaders(workbook, 'Müşteriler', this.getCustomerHeaders(), withDemoData ? this.getDemoCustomer() : []);
      this.createSheetWithHeaders(workbook, 'Teklifler', this.getQuoteHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Proformalar', this.getProformaHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Evraklar', this.getInvoiceHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Siparişler', this.getOrderHeaders(), []);
      this.createSheetWithHeaders(workbook, 'ETA', this.getETAHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Fuar Kayıtları', this.getFairHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Etkileşim Günlüğü', this.getInteractionHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Tahsilat Planı', this.getPaymentPlanHeaders(), []);
      this.createSheetWithHeaders(workbook, 'Hedefler', this.getGoalHeaders(), []);
      
      XLSX.writeFile(workbook, templatePath);
      console.log('Template file created at:', templatePath, withDemoData ? '(with demo data)' : '(empty)');
      return templatePath;
    } catch (error) {
      console.error('Error creating template file:', error);
      throw error;
    }
  }
}

module.exports = new DataService();

