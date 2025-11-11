const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Get all proformas
router.get('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    res.json(data.proformas || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending proformas (must be before /:id route)
router.get('/pending/all', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const pendingProformas = (data.proformas || []).filter(p => p['Durum'] === 'Beklemede');
    
    const total = pendingProformas.reduce((sum, p) => {
      return sum + dataService.smartToNum(p['Tutar']);
    }, 0);
    
    res.json({ proformas: pendingProformas, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get orders waiting for shipment (must be before /:id route)
router.get('/shipment/pending', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const orders = (data.proformas || []).filter(p => 
      p['Durum'] === 'Siparişe Dönüştü' && 
      p['Sevk Durumu'] && 
      !['Sevkedildi', 'Ulaşıldı'].includes(p['Sevk Durumu'])
    );
    
    const total = orders.reduce((sum, o) => {
      return sum + dataService.smartToNum(o['Tutar']);
    }, 0);
    
    res.json({ orders, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shipped orders (must be before /:id route)
router.get('/shipment/shipped', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const shipped = (data.proformas || []).filter(p => 
      p['Sevk Durumu'] === 'Sevkedildi' && p['Sevk Durumu'] !== 'Ulaşıldı'
    );
    
    res.json(shipped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get delivered orders (must be before /:id route)
router.get('/shipment/delivered', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const delivered = (data.proformas || []).filter(p => p['Sevk Durumu'] === 'Ulaşıldı');
    
    // Sort by delivery date, get last 5
    delivered.sort((a, b) => {
      const dateA = new Date(a['Ulaşma Tarihi'] || 0);
      const dateB = new Date(b['Ulaşma Tarihi'] || 0);
      return dateB - dateA;
    });
    
    res.json(delivered.slice(0, 5));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get proformas by customer (must be before /:id route)
router.get('/customer/:customerName', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const proformas = (data.proformas || []).filter(p => p['Müşteri Adı'] === req.params.customerName);
    res.json(proformas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Convert to order (must be before /:id route)
router.post('/:id/convert-to-order', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.proformas || []).findIndex(p => p.id === req.params.id || p.ID === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Proforma not found' });
    }
    
    data.proformas[index]['Durum'] = 'Siparişe Dönüştü';
    data.proformas[index]['Sipariş Formu'] = req.body['Sipariş Formu'] || '';
    data.proformas[index]['Sevk Durumu'] = '';
    
    await dataService.saveDataToExcel(data);
    res.json(data.proformas[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get proforma by ID (must be last to avoid conflicts)
router.get('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const proforma = (data.proformas || []).find(p => p.id === req.params.id || p.ID === req.params.id || p['Proforma No'] === req.params.id);
    if (!proforma) {
      return res.status(404).json({ error: 'Proforma not found' });
    }
    res.json(proforma);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new proforma
router.post('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    
    // Check for duplicate proforma number for same customer
    const existing = (data.proformas || []).find(
      p => p['Müşteri Adı'] === req.body['Müşteri Adı'] && 
           p['Proforma No'] === req.body['Proforma No']
    );
    
    if (existing) {
      return res.status(400).json({ error: 'Bu Proforma No bu müşteri için zaten kayıtlı.' });
    }
    
    const newProforma = {
      ID: require('uuid').v4(),
      id: require('uuid').v4(), // Backward compatibility
      ...req.body,
      'Tarih': req.body['Tarih'] || new Date().toISOString().split('T')[0],
      'Durum': req.body['Durum'] || 'Beklemede',
      'Sevk Durumu': req.body['Sevk Durumu'] || '',
      'Sipariş Formu': req.body['Sipariş Formu'] || '',
      'Termin Tarihi': req.body['Termin Tarihi'] || '',
      'Ulaşma Tarihi': req.body['Ulaşma Tarihi'] || '',
    };
    
    data.proformas = data.proformas || [];
    data.proformas.push(newProforma);
    
    await dataService.saveDataToExcel(data);
    res.json(newProforma);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update proforma
router.put('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.proformas || []).findIndex(p => p.id === req.params.id || p.ID === req.params.id || p['Proforma No'] === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Proforma not found' });
    }
    
    data.proformas[index] = {
      ...data.proformas[index],
      ...req.body,
    };
    
    await dataService.saveDataToExcel(data);
    res.json(data.proformas[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update delivery date for delivered order
router.put('/:id/update-delivery-date', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.proformas || []).findIndex(p => 
      (p.id === req.params.id || p.ID === req.params.id) &&
      p['Sevk Durumu'] === 'Ulaşıldı'
    );
    
    if (index === -1) {
      return res.status(404).json({ error: 'Delivered order not found' });
    }
    
    data.proformas[index]['Ulaşma Tarihi'] = req.body['Ulaşma Tarihi'] || new Date().toISOString().split('T')[0];
    
    await dataService.saveDataToExcel(data);
    res.json(data.proformas[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Return delivered order back to shipping (Yola Geri Al)
router.post('/:id/return-to-shipping', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.proformas || []).findIndex(p => 
      (p.id === req.params.id || p.ID === req.params.id) &&
      p['Sevk Durumu'] === 'Ulaşıldı'
    );
    
    if (index === -1) {
      return res.status(404).json({ error: 'Delivered order not found' });
    }
    
    const customerName = data.proformas[index]['Müşteri Adı'];
    const proformaNo = data.proformas[index]['Proforma No'];
    
    // Update proforma
    data.proformas[index]['Sevk Durumu'] = 'Sevkedildi';
    data.proformas[index]['Ulaşma Tarihi'] = '';
    
    // Create or update ETA
    const { 'ETA Tarihi': etaTarihi, 'Açıklama': aciklama } = req.body;
    const existingETAIndex = (data.eta || []).findIndex(eta => 
      eta['Müşteri Adı'] === customerName && eta['Proforma No'] === proformaNo
    );
    
    const sevkTarihi = data.proformas[index]['Sevk Tarihi'] || new Date().toISOString().split('T')[0];
    
    if (existingETAIndex !== -1) {
      // Update existing ETA
      data.eta[existingETAIndex]['Sevk Tarihi'] = sevkTarihi;
      if (etaTarihi) {
        data.eta[existingETAIndex]['ETA Tarihi'] = etaTarihi;
      }
      if (aciklama) {
        data.eta[existingETAIndex]['Açıklama'] = aciklama;
      }
    } else {
      // Create new ETA
      const { v4: uuidv4 } = require('uuid');
      data.eta = data.eta || [];
      data.eta.push({
        id: uuidv4(),
        'Müşteri Adı': customerName,
        'Proforma No': proformaNo,
        'Sevk Tarihi': sevkTarihi,
        'ETA Tarihi': etaTarihi || '',
        'Açıklama': aciklama || 'Geri alındı - tekrar yolda',
      });
    }
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true, proforma: data.proformas[index] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete proforma
router.delete('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    data.proformas = (data.proformas || []).filter(p => p.id !== req.params.id && p.ID !== req.params.id && p['Proforma No'] !== req.params.id);
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

