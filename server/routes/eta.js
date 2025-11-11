const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Get all ETA records
router.get('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    res.json(data.eta || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ETA by proforma number
router.get('/proforma/:proformaNo', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const etaRecords = (data.eta || []).filter(e => e['Proforma No'] === req.params.proformaNo);
    res.json(etaRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new ETA record
router.post('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const newETA = {
      id: require('uuid').v4(),
      ...req.body,
      'Sevk Tarihi': req.body['Sevk Tarihi'] || new Date().toISOString().split('T')[0],
    };
    
    data.eta = data.eta || [];
    data.eta.push(newETA);
    
    await dataService.saveDataToExcel(data);
    res.json(newETA);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update ETA record
router.put('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.eta || []).findIndex(e => e.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'ETA record not found' });
    }
    
    data.eta[index] = {
      ...data.eta[index],
      ...req.body,
    };
    
    await dataService.saveDataToExcel(data);
    res.json(data.eta[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete ETA record
router.delete('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    data.eta = (data.eta || []).filter(e => 
      e.id !== req.params.id && e.ID !== req.params.id
    );
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ETA tracking (shipped orders with ETA)
router.get('/tracking/all', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const shipped = (data.proformas || []).filter(p => p['Sevk Durumu'] === 'Sevkedildi');
    
    // Merge with ETA data
    const etaLookup = {};
    (data.eta || []).forEach(eta => {
      const proformaNo = eta['Proforma No'];
      if (!etaLookup[proformaNo] || new Date(eta['ETA Tarihi']) > new Date(etaLookup[proformaNo]['ETA Tarihi'])) {
        etaLookup[proformaNo] = eta;
      }
    });
    
    const tracking = shipped.map(order => {
      const eta = etaLookup[order['Proforma No']];
      const today = new Date();
      const etaDate = eta ? new Date(eta['ETA Tarihi']) : null;
      const daysRemaining = etaDate ? Math.ceil((etaDate - today) / (1000 * 60 * 60 * 24)) : null;
      
      return {
        ...order,
        'ETA Tarihi': eta ? eta['ETA Tarihi'] : null,
        'Kalan Gün': daysRemaining,
      };
    });
    
    res.json(tracking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get shipped orders (for ETA tracking page)
router.get('/shipped-orders', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const shipped = (data.proformas || []).filter(p => p['Sevk Durumu'] === 'Sevkedildi');
    
    // Get unique customer + proforma combinations
    const uniqueOrders = [];
    const seen = new Set();
    
    shipped.forEach(order => {
      const customer = order['Müşteri Adı'] || '';
      const proforma = order['Proforma No'] || '';
      const key = `${customer}|${proforma}`;
      
      if (!seen.has(key) && customer && proforma) {
        seen.add(key);
        uniqueOrders.push(order);
      }
    });
    
    res.json(uniqueOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get delivered orders
router.get('/delivered', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const delivered = (data.proformas || []).filter(p => p['Sevk Durumu'] === 'Ulaşıldı');
    res.json(delivered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark order as delivered (Ulaştı)
router.post('/mark-delivered', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const { customerName, proformaNo } = req.body;
    
    // Remove from ETA
    data.eta = (data.eta || []).filter(eta => 
      !(eta['Müşteri Adı'] === customerName && eta['Proforma No'] === proformaNo)
    );
    
    // Update proforma
    const proformaIndex = (data.proformas || []).findIndex(p => 
      p['Müşteri Adı'] === customerName && p['Proforma No'] === proformaNo
    );
    
    if (proformaIndex !== -1) {
      data.proformas[proformaIndex]['Sevk Durumu'] = 'Ulaşıldı';
      data.proformas[proformaIndex]['Ulaşma Tarihi'] = new Date().toISOString().split('T')[0];
    }
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recall shipment (Sevki Geri Al)
router.post('/recall-shipment', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const { customerName, proformaNo } = req.body;
    
    // Remove from ETA
    data.eta = (data.eta || []).filter(eta => 
      !(eta['Müşteri Adı'] === customerName && eta['Proforma No'] === proformaNo)
    );
    
    // Update proforma - clear Sevk Durumu (returns to Sipariş Operasyonları)
    const proformaIndex = (data.proformas || []).findIndex(p => 
      p['Müşteri Adı'] === customerName && p['Proforma No'] === proformaNo
    );
    
    if (proformaIndex !== -1) {
      data.proformas[proformaIndex]['Sevk Durumu'] = '';
    }
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update or create ETA for customer and proforma
router.post('/update-or-create', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const { customerName, proformaNo, 'Sevk Tarihi': sevkTarihi, 'ETA Tarihi': etaTarihi, 'Açıklama': aciklama } = req.body;
    
    // Find existing ETA
    const existingETAIndex = (data.eta || []).findIndex(eta => 
      eta['Müşteri Adı'] === customerName && eta['Proforma No'] === proformaNo
    );
    
    const etaData = {
      'Müşteri Adı': customerName,
      'Proforma No': proformaNo,
      'Sevk Tarihi': sevkTarihi || new Date().toISOString().split('T')[0],
      'ETA Tarihi': etaTarihi,
      'Açıklama': aciklama || '',
    };
    
    if (existingETAIndex !== -1) {
      // Update existing
      data.eta[existingETAIndex] = {
        ...data.eta[existingETAIndex],
        ...etaData,
      };
    } else {
      // Create new
      const { v4: uuidv4 } = require('uuid');
      data.eta = data.eta || [];
      data.eta.push({
        id: uuidv4(),
        ...etaData,
      });
    }
    
    // Update proforma Sevk Tarihi
    const proformaIndex = (data.proformas || []).findIndex(p => 
      p['Müşteri Adı'] === customerName && p['Proforma No'] === proformaNo
    );
    
    if (proformaIndex !== -1 && sevkTarihi) {
      data.proformas[proformaIndex]['Sevk Tarihi'] = sevkTarihi;
    }
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true, eta: existingETAIndex !== -1 ? data.eta[existingETAIndex] : data.eta[data.eta.length - 1] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

