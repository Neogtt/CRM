const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const { v4: uuidv4 } = require('uuid');

// Get all pending orders (Status: "Siparişe Dönüştü", Shipment Status: not "Sevkedildi" or "Ulaşıldı")
// Excel mantığı: Durum = "Siparişe Dönüştü" ve Sevk Durumu != "Sevkedildi" ve != "Ulaşıldı"
// Yani sipariş hala fabrikada ve sevk edilmeyi bekliyor
router.get('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const orders = (data.proformas || []).filter(p => {
      // Durum "Siparişe Dönüştü" olmalı
      if (p['Durum'] !== 'Siparişe Dönüştü') {
        return false;
      }
      
      // Sevk Durumu boş, null, undefined veya "Sevkedildi"/"Ulaşıldı" dışında bir değer olmalı
      const sevkDurumu = (p['Sevk Durumu'] || '').toString().trim();
      if (sevkDurumu === 'Sevkedildi' || sevkDurumu === 'Ulaşıldı') {
        return false;
      }
      
      return true;
    });
    
    // Sort by Termin Tarihi and Tarih
    orders.sort((a, b) => {
      const dateA = new Date(a['Termin Tarihi'] || a['Tarih'] || 0);
      const dateB = new Date(b['Termin Tarihi'] || b['Tarih'] || 0);
      return dateA - dateB;
    });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID (only pending orders)
router.get('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const order = (data.proformas || []).find(p => {
      // Check ID match
      if (p.ID !== req.params.id && p.id !== req.params.id) {
        return false;
      }
      
      // Durum "Siparişe Dönüştü" olmalı
      if (p['Durum'] !== 'Siparişe Dönüştü') {
        return false;
      }
      
      // Sevk Durumu boş, null, undefined veya "Sevkedildi"/"Ulaşıldı" dışında bir değer olmalı
      const sevkDurumu = (p['Sevk Durumu'] || '').toString().trim();
      if (sevkDurumu === 'Sevkedildi' || sevkDurumu === 'Ulaşıldı') {
        return false;
      }
      
      return true;
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found or already shipped/delivered' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update termin date (only for pending orders)
router.put('/:id/termin-date', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.proformas || []).findIndex(p => {
      // Check ID match
      if (p.ID !== req.params.id && p.id !== req.params.id) {
        return false;
      }
      
      // Durum "Siparişe Dönüştü" olmalı
      if (p['Durum'] !== 'Siparişe Dönüştü') {
        return false;
      }
      
      // Sevk Durumu boş, null, undefined veya "Sevkedildi"/"Ulaşıldı" dışında bir değer olmalı
      const sevkDurumu = (p['Sevk Durumu'] || '').toString().trim();
      if (sevkDurumu === 'Sevkedildi' || sevkDurumu === 'Ulaşıldı') {
        return false;
      }
      
      return true;
    });
    
    if (index === -1) {
      return res.status(404).json({ error: 'Order not found or already shipped/delivered' });
    }
    
    data.proformas[index]['Termin Tarihi'] = req.body['Termin Tarihi'];
    
    await dataService.saveDataToExcel(data);
    res.json(data.proformas[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ship order (send to ETA tracking) - only for pending orders
router.post('/:id/ship', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const orderIndex = (data.proformas || []).findIndex(p => {
      // Check ID match
      if (p.ID !== req.params.id && p.id !== req.params.id) {
        return false;
      }
      
      // Durum "Siparişe Dönüştü" olmalı
      if (p['Durum'] !== 'Siparişe Dönüştü') {
        return false;
      }
      
      // Sevk Durumu boş, null, undefined veya "Sevkedildi"/"Ulaşıldı" dışında bir değer olmalı
      const sevkDurumu = (p['Sevk Durumu'] || '').toString().trim();
      if (sevkDurumu === 'Sevkedildi' || sevkDurumu === 'Ulaşıldı') {
        return false;
      }
      
      return true;
    });
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found or already shipped/delivered' });
    }
    
    const order = data.proformas[orderIndex];
    
    // Update order shipment status
    data.proformas[orderIndex]['Sevk Durumu'] = 'Sevkedildi';
    data.proformas[orderIndex]['Sevk Tarihi'] = req.body['Sevk Tarihi'] || new Date().toISOString().split('T')[0];
    
    // Add or update ETA tracking
    data.eta = data.eta || [];
    const existingEtaIndex = data.eta.findIndex(e => 
      e['Müşteri Adı'] === order['Müşteri Adı'] && 
      e['Proforma No'] === order['Proforma No']
    );
    
    if (existingEtaIndex !== -1) {
      // Update existing ETA
      data.eta[existingEtaIndex]['Sevk Tarihi'] = data.proformas[orderIndex]['Sevk Tarihi'];
      data.eta[existingEtaIndex]['Açıklama'] = order['Açıklama'] || '';
    } else {
      // Create new ETA entry
      data.eta.push({
        ID: uuidv4(),
        id: uuidv4(),
        'Müşteri Adı': order['Müşteri Adı'],
        'Proforma No': order['Proforma No'],
        'Sevk Tarihi': data.proformas[orderIndex]['Sevk Tarihi'],
        'ETA Tarihi': '',
        'Açıklama': order['Açıklama'] || '',
      });
    }
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true, message: 'Sipariş sevkedildi ve ETA takibine gönderildi!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Put order back to pending (recall) - only for pending orders
router.post('/:id/recall', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.proformas || []).findIndex(p => {
      // Check ID match
      if (p.ID !== req.params.id && p.id !== req.params.id) {
        return false;
      }
      
      // Durum "Siparişe Dönüştü" olmalı
      if (p['Durum'] !== 'Siparişe Dönüştü') {
        return false;
      }
      
      // Sevk Durumu boş, null, undefined veya "Sevkedildi"/"Ulaşıldı" dışında bir değer olmalı
      const sevkDurumu = (p['Sevk Durumu'] || '').toString().trim();
      if (sevkDurumu === 'Sevkedildi' || sevkDurumu === 'Ulaşıldı') {
        return false;
      }
      
      return true;
    });
    
    if (index === -1) {
      return res.status(404).json({ error: 'Order not found or already shipped/delivered' });
    }
    
    // Change status back to "Beklemede"
    data.proformas[index]['Durum'] = 'Beklemede';
    data.proformas[index]['Sevk Durumu'] = '';
    data.proformas[index]['Termin Tarihi'] = '';
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true, message: 'Sipariş tekrar bekleyen proformalar listesine alındı!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get total pending shipment amount
router.get('/stats/total', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const orders = (data.proformas || []).filter(p => {
      // Durum "Siparişe Dönüştü" olmalı
      if (p['Durum'] !== 'Siparişe Dönüştü') {
        return false;
      }
      
      // Sevk Durumu boş, null, undefined veya "Sevkedildi"/"Ulaşıldı" dışında bir değer olmalı
      const sevkDurumu = (p['Sevk Durumu'] || '').toString().trim();
      if (sevkDurumu === 'Sevkedildi' || sevkDurumu === 'Ulaşıldı') {
        return false;
      }
      
      return true;
    });
    
    const total = orders.reduce((sum, order) => {
      return sum + dataService.smartToNum(order['Tutar']);
    }, 0);
    
    res.json({ total, count: orders.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
