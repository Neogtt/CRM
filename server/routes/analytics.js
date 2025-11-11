const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Get overview statistics
router.get('/overview', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    
    // Pending quotes
    const pendingQuotes = (data.quotes || []).filter(q => q['Durum'] === 'Açık');
    const quotesTotal = pendingQuotes.reduce((sum, q) => sum + dataService.smartToNum(q['Tutar']), 0);
    
    // Pending proformas
    const pendingProformas = (data.proformas || []).filter(p => p['Durum'] === 'Beklemede');
    const proformasTotal = pendingProformas.reduce((sum, p) => sum + dataService.smartToNum(p['Tutar']), 0);
    
    // Shipped orders
    const shipped = (data.proformas || []).filter(p => p['Sevk Durumu'] === 'Sevkedildi');
    
    // Total invoices
    const invoices = data.invoices || [];
    const invoicesTotal = invoices.reduce((sum, inv) => sum + dataService.smartToNum(inv['Tutar']), 0);
    
    res.json({
      pendingQuotes: {
        count: pendingQuotes.length,
        total: quotesTotal,
      },
      pendingProformas: {
        count: pendingProformas.length,
        total: proformasTotal,
      },
      shipped: {
        count: shipped.length,
      },
      invoices: {
        count: invoices.length,
        total: invoicesTotal,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sales analytics by date range
router.post('/sales', async (req, res) => {
  try {
    const { startDate, endDate, customer, segment } = req.body;
    const data = await dataService.loadDataFromExcel();
    
    let invoices = (data.invoices || []).filter(inv => {
      // Only include invoices with valid date
      const dateCol = inv['Fatura Tarihi'] || inv['Tarih'];
      return dateCol && dateCol.toString().trim() !== '';
    });
    
    // Filter by date range
    if (startDate && endDate) {
      invoices = invoices.filter(inv => {
        const dateCol = inv['Fatura Tarihi'] || inv['Tarih'];
        if (!dateCol) return false;
        
        try {
          const invDate = new Date(dateCol);
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          invDate.setHours(0, 0, 0, 0);
          return invDate >= start && invDate <= end;
        } catch {
          return false;
        }
      });
    }
    
    // Filter by segment first (before customer filter)
    if (segment && segment !== 'Tüm Segmentler') {
      const customers = data.customers || [];
      const customerSegments = {};
      customers.forEach(c => {
        if (c['Kategori'] && c['Müşteri Adı']) {
          customerSegments[c['Müşteri Adı']] = c['Kategori'];
        }
      });
      
      invoices = invoices.filter(inv => {
        const customerName = inv['Müşteri Adı'];
        const customerSegment = customerSegments[customerName] || 'Belirtilmemiş';
        return customerSegment === segment;
      });
    }
    
    // Filter by customer
    if (customer && customer !== 'Tüm Müşteriler') {
      invoices = invoices.filter(inv => inv['Müşteri Adı'] === customer);
    }
    
    // Calculate total
    const total = invoices.reduce((sum, inv) => sum + dataService.smartToNum(inv['Tutar']), 0);
    
    // Top customers (top 5)
    const customerTotals = {};
    invoices.forEach(inv => {
      const customer = inv['Müşteri Adı'] || 'Bilinmeyen Müşteri';
      const amount = dataService.smartToNum(inv['Tutar']);
      customerTotals[customer] = (customerTotals[customer] || 0) + amount;
    });
    
    const topCustomers = Object.entries(customerTotals)
      .map(([name, total]) => ({ 'Müşteri Adı': name, 'Toplam Ciro': total }))
      .sort((a, b) => b['Toplam Ciro'] - a['Toplam Ciro'])
      .slice(0, 5);
    
    // Customer percentages for pie chart
    const customerPercentages = Object.entries(customerTotals)
      .map(([name, total]) => ({
        'Müşteri Adı': name,
        'Tutar_num': total,
        'Yüzde': total > 0 && total > 0 ? (total / Object.values(customerTotals).reduce((a, b) => a + b, 0)) * 100 : 0
      }))
      .sort((a, b) => b['Tutar_num'] - a['Tutar_num']);
    
    res.json({
      invoices,
      total,
      count: invoices.length,
      topCustomers,
      customerPercentages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get total invoice amount
router.get('/sales/total', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const invoices = (data.invoices || []).filter(inv => {
      const dateCol = inv['Fatura Tarihi'] || inv['Tarih'];
      return dateCol && dateCol.toString().trim() !== '';
    });
    
    const total = invoices.reduce((sum, inv) => sum + dataService.smartToNum(inv['Tutar']), 0);
    
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get date range for invoices
router.get('/sales/date-range', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const invoices = (data.invoices || []).filter(inv => {
      const dateCol = inv['Fatura Tarihi'] || inv['Tarih'];
      return dateCol && dateCol.toString().trim() !== '';
    });
    
    if (invoices.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return res.json({ minDate: today, maxDate: today });
    }
    
    const dates = invoices
      .map(inv => {
        const dateCol = inv['Fatura Tarihi'] || inv['Tarih'];
        if (!dateCol) return null;
        try {
          return new Date(dateCol);
        } catch {
          return null;
        }
      })
      .filter(d => d !== null);
    
    if (dates.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      return res.json({ minDate: today, maxDate: today });
    }
    
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    res.json({
      minDate: minDate.toISOString().split('T')[0],
      maxDate: maxDate.toISOString().split('T')[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique segments from customers
router.get('/sales/segments', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const customers = data.customers || [];
    const segments = [...new Set(customers.map(c => c['Kategori']).filter(Boolean))].sort();
    res.json(segments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique customers from invoices (filtered by date range if provided)
router.post('/sales/customers', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const data = await dataService.loadDataFromExcel();
    
    let invoices = (data.invoices || []).filter(inv => {
      const dateCol = inv['Fatura Tarihi'] || inv['Tarih'];
      return dateCol && dateCol.toString().trim() !== '';
    });
    
    // Filter by date range if provided
    if (startDate && endDate) {
      invoices = invoices.filter(inv => {
        const dateCol = inv['Fatura Tarihi'] || inv['Tarih'];
        if (!dateCol) return false;
        
        try {
          const invDate = new Date(dateCol);
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          invDate.setHours(0, 0, 0, 0);
          return invDate >= start && invDate <= end;
        } catch {
          return false;
        }
      });
    }
    
    const customers = [...new Set(invoices.map(inv => inv['Müşteri Adı']).filter(Boolean))].sort();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending orders (orders waiting in factory - Durum: "Siparişe Dönüştü", Sevk Durumu: not "Sevkedildi" or "Ulaşıldı")
router.get('/sales/pending-orders', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    
    // Get orders that are "Siparişe Dönüştü" and not yet shipped or delivered
    const pendingOrders = (data.proformas || []).filter(p => {
      const durum = p['Durum'];
      const sevkDurumu = p['Sevk Durumu'] || '';
      
      return durum === 'Siparişe Dönüştü' && 
             sevkDurumu !== 'Sevkedildi' && 
             sevkDurumu !== 'Ulaşıldı';
    });
    
    // Calculate total
    const total = pendingOrders.reduce((sum, order) => {
      return sum + dataService.smartToNum(order['Tutar']);
    }, 0);
    
    // Sort by Termin Tarihi or Tarih
    pendingOrders.sort((a, b) => {
      const dateA = new Date(a['Termin Tarihi'] || a['Tarih'] || 0);
      const dateB = new Date(b['Termin Tarihi'] || b['Tarih'] || 0);
      return dateA - dateB;
    });
    
    res.json({
      orders: pendingOrders,
      total,
      count: pendingOrders.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

