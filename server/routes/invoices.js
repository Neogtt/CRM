const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const { v4: uuidv4 } = require('uuid');

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    // Invoices are stored in "Evraklar" sheet (data.invoices)
    res.json(data.invoices || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending orders (shipped but not invoiced)
router.get('/pending-orders', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    
    // Get shipped orders (Sevk Durumu = "Sevkedildi" and Durum = "Siparişe Dönüştü")
    const shippedOrders = (data.proformas || []).filter(p => {
      return p['Sevk Durumu'] === 'Sevkedildi' && 
             p['Durum'] === 'Siparişe Dönüştü';
    });
    
    // Sort by Termin Tarihi and Tarih
    shippedOrders.sort((a, b) => {
      const dateA = new Date(a['Termin Tarihi'] || a['Tarih'] || 0);
      const dateB = new Date(b['Termin Tarihi'] || b['Tarih'] || 0);
      return dateA - dateB;
    });
    
    // Filter out orders that already have invoices
    const existingInvoices = data.invoices || [];
    const invoicePairs = new Set();
    existingInvoices.forEach(inv => {
      const customer = (inv['Müşteri Adı'] || '').toString().trim().toLowerCase();
      const proforma = (inv['Proforma No'] || '').toString().trim().toLowerCase();
      if (customer || proforma) {
        invoicePairs.add(`${customer}|${proforma}`);
      }
    });
    
    const pendingOrders = shippedOrders.filter(order => {
      const customer = (order['Müşteri Adı'] || '').toString().trim().toLowerCase();
      const proforma = (order['Proforma No'] || '').toString().trim().toLowerCase();
      const key = `${customer}|${proforma}`;
      return !invoicePairs.has(key) && proforma !== '';
    });
    
    res.json(pendingOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const invoice = (data.invoices || []).find(i => 
      (i.ID === req.params.id || i.id === req.params.id)
    );
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new invoice
router.post('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    
    // Check for duplicate (Müşteri Adı + Proforma No)
    const existingInvoices = data.invoices || [];
    const customer = (req.body['Müşteri Adı'] || '').toString().trim().toLowerCase();
    const proforma = (req.body['Proforma No'] || '').toString().trim().toLowerCase();
    
    const duplicate = existingInvoices.find(inv => {
      const invCustomer = (inv['Müşteri Adı'] || '').toString().trim().toLowerCase();
      const invProforma = (inv['Proforma No'] || '').toString().trim().toLowerCase();
      return invCustomer === customer && invProforma === proforma;
    });
    
    if (duplicate) {
      return res.status(400).json({ 
        error: 'Bu müşteri ve proforma için zaten bir fatura kaydı var!' 
      });
    }
    
    const newInvoice = {
      ID: uuidv4(),
      id: uuidv4(),
      'Müşteri Adı': req.body['Müşteri Adı'] || '',
      'Proforma No': req.body['Proforma No'] || '',
      'Fatura No': req.body['Fatura No'] || '',
      'Fatura Tarihi': req.body['Fatura Tarihi'] || new Date().toISOString().split('T')[0],
      'Tutar': req.body['Tutar'] || '',
      'Ödenen Tutar': req.body['Ödenen Tutar'] || 0,
      'Vade (gün)': req.body['Vade (gün)'] || '',
      'Vade Tarihi': req.body['Vade Tarihi'] || '',
      'Ülke': req.body['Ülke'] || '',
      'Satış Temsilcisi': req.body['Satış Temsilcisi'] || '',
      'Ödeme Şekli': req.body['Ödeme Şekli'] || '',
      'Commercial Invoice': req.body['Commercial Invoice'] || '',
      'Sağlık Sertifikası': req.body['Sağlık Sertifikası'] || '',
      'Packing List': req.body['Packing List'] || '',
      'Konşimento': req.body['Konşimento'] || '',
      'İhracat Beyannamesi': req.body['İhracat Beyannamesi'] || '',
      'Fatura PDF': req.body['Fatura PDF'] || '',
      'Sipariş Formu': req.body['Sipariş Formu'] || '',
      'Yük Resimleri': req.body['Yük Resimleri'] || '',
      'EK Belgeler': req.body['EK Belgeler'] || '',
      'Ödendi': req.body['Ödendi'] === true || req.body['Ödendi'] === 'true',
    };
    
    data.invoices = data.invoices || [];
    data.invoices.push(newInvoice);
    
    await dataService.saveDataToExcel(data);
    res.json(newInvoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.invoices || []).findIndex(i => 
      (i.ID === req.params.id || i.id === req.params.id)
    );
    
    if (index === -1) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    // Update invoice
    data.invoices[index] = {
      ...data.invoices[index],
      ...req.body,
      // Preserve ID
      ID: data.invoices[index].ID || data.invoices[index].id,
      id: data.invoices[index].ID || data.invoices[index].id,
    };
    
    await dataService.saveDataToExcel(data);
    res.json(data.invoices[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    data.invoices = (data.invoices || []).filter(i => 
      (i.ID !== req.params.id && i.id !== req.params.id)
    );
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update invoice dates
router.put('/:id/dates', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.invoices || []).findIndex(i => 
      (i.ID === req.params.id || i.id === req.params.id)
    );
    
    if (index === -1) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const invoiceDate = req.body['Fatura Tarihi'];
    const dueDate = req.body['Vade Tarihi'];
    
    data.invoices[index]['Fatura Tarihi'] = invoiceDate;
    data.invoices[index]['Vade Tarihi'] = dueDate;
    
    // Calculate Vade (gün)
    if (invoiceDate && dueDate) {
      const invoice = new Date(invoiceDate);
      const due = new Date(dueDate);
      const days = Math.floor((due - invoice) / (1000 * 60 * 60 * 24));
      data.invoices[index]['Vade (gün)'] = days.toString();
    }
    
    await dataService.saveDataToExcel(data);
    res.json(data.invoices[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get invoices by date range
router.post('/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const data = await dataService.loadDataFromExcel();
    
    let invoices = data.invoices || [];
    
    if (startDate && endDate) {
      invoices = invoices.filter(inv => {
        const invDate = new Date(inv['Fatura Tarihi'] || inv['Tarih']);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return invDate >= start && invDate <= end;
      });
    }
    
    const total = invoices.reduce((sum, inv) => {
      return sum + dataService.smartToNum(inv['Tutar']);
    }, 0);
    
    res.json({ invoices, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get total invoice amount
router.get('/stats/total', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const invoices = data.invoices || [];
    
    const total = invoices.reduce((sum, inv) => {
      return sum + dataService.smartToNum(inv['Tutar']);
    }, 0);
    
    res.json({ total, count: invoices.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
