const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Excel'deki hardcoded temsilci isimlerini temizle
router.post('/cleanup-representatives', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    
    // Hardcoded temsilci isimleri
    const hardcodedNames = [
      'KEMAL İLKER ÇELİKKALKAN',
      'HÜSEYİN POLAT',
      'EFE YILDIRIM',
      'FERHAT ŞEKEROĞLU',
      'Ferhat ŞEKEROĞLU',
      'Ferhat ŞEKEROĞLI'
    ];
    
    let cleaned = false;
    
    // Müşteriler tablosundaki hardcoded isimleri temizle
    if (data.customers && data.customers.length > 0) {
      data.customers = data.customers.map(customer => {
        if (customer['Satış Temsilcisi'] && hardcodedNames.includes(customer['Satış Temsilcisi'])) {
          customer['Satış Temsilcisi'] = ''; // Boş bırak
          cleaned = true;
        }
        return customer;
      });
    }
    
    // Fuar Kayıtları tablosundaki hardcoded isimleri temizle
    if (data.fairs && data.fairs.length > 0) {
      data.fairs = data.fairs.map(fair => {
        if (fair['Satış Temsilcisi'] && hardcodedNames.includes(fair['Satış Temsilcisi'])) {
          fair['Satış Temsilcisi'] = ''; // Boş bırak
          cleaned = true;
        }
        return fair;
      });
    }
    
    // Evraklar tablosundaki hardcoded isimleri temizle
    if (data.invoices && data.invoices.length > 0) {
      data.invoices = data.invoices.map(invoice => {
        if (invoice['Satış Temsilcisi'] && hardcodedNames.includes(invoice['Satış Temsilcisi'])) {
          invoice['Satış Temsilcisi'] = ''; // Boş bırak
          cleaned = true;
        }
        return invoice;
      });
    }
    
    // Proformalar tablosundaki hardcoded isimleri temizle
    if (data.proformas && data.proformas.length > 0) {
      data.proformas = data.proformas.map(proforma => {
        if (proforma['Satış Temsilcisi'] && hardcodedNames.includes(proforma['Satış Temsilcisi'])) {
          proforma['Satış Temsilcisi'] = ''; // Boş bırak
          cleaned = true;
        }
        return proforma;
      });
    }
    
    if (cleaned) {
      await dataService.saveDataToExcel(data);
      res.json({ 
        success: true, 
        message: 'Hardcoded temsilci isimleri temizlendi.',
        cleaned: true
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Temizlenecek hardcoded isim bulunamadı.',
        cleaned: false
      });
    }
  } catch (error) {
    console.error('Error cleaning representatives:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

