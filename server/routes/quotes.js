const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Get all quotes
router.get('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    res.json(data.quotes || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate automatic quote number (must be before /:id route)
router.get('/auto/quote-no', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const quotes = data.quotes || [];
    
    if (quotes.length === 0) {
      return res.json({ quoteNo: 'TKF-0001' });
    }
    
    // Extract numbers from quote numbers
    const numbers = quotes
      .map(q => {
        const quoteNo = String(q['Teklif No'] || '');
        const match = quoteNo.match(/(\d+)$/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(n => n !== null);
    
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    const quoteNo = `TKF-${String(nextNumber).padStart(4, '0')}`;
    
    res.json({ quoteNo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending quotes
router.get('/pending/all', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const pendingQuotes = (data.quotes || []).filter(q => q['Durum'] === 'Açık');
    
    const total = pendingQuotes.reduce((sum, q) => {
      return sum + dataService.smartToNum(q['Tutar']);
    }, 0);
    
    res.json({ quotes: pendingQuotes, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get quote by ID (must be last to avoid conflicts)
router.get('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const quote = (data.quotes || []).find(q => q.id === req.params.id || q.ID === req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new quote
router.post('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const newQuote = {
      ID: require('uuid').v4(),
      id: require('uuid').v4(), // Backward compatibility
      ...req.body,
      'Tarih': req.body['Tarih'] || new Date().toISOString().split('T')[0],
      'Durum': req.body['Durum'] || 'Açık',
    };
    
    data.quotes = data.quotes || [];
    data.quotes.push(newQuote);
    
    await dataService.saveDataToExcel(data);
    res.json(newQuote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Update quote
router.put('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.quotes || []).findIndex(q => q.id === req.params.id || q.ID === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    data.quotes[index] = {
      ...data.quotes[index],
      ...req.body,
    };
    
    await dataService.saveDataToExcel(data);
    res.json(data.quotes[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete quote
router.delete('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    data.quotes = (data.quotes || []).filter(q => q.id !== req.params.id && q.ID !== req.params.id);
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search quotes
router.post('/search', async (req, res) => {
  try {
    const { customer, statuses, startDate, endDate, searchText } = req.body;
    const data = await dataService.loadDataFromExcel();
    let quotes = data.quotes || [];
    
    // Filter by customer
    if (customer && customer !== '(Hepsi)') {
      quotes = quotes.filter(q => q['Müşteri Adı'] === customer);
    }
    
    // Filter by status
    if (statuses && statuses.length > 0) {
      quotes = quotes.filter(q => statuses.includes(q['Durum']));
    }
    
    // Filter by date range
    if (startDate && endDate) {
      quotes = quotes.filter(q => {
        const quoteDate = new Date(q['Tarih']);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return quoteDate >= start && quoteDate <= end;
      });
    }
    
    // Search in text fields
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      quotes = quotes.filter(q => {
        const product = String(q['Ürün/Hizmet'] || '').toLowerCase();
        const description = String(q['Açıklama'] || '').toLowerCase();
        const quoteNo = String(q['Teklif No'] || '').toLowerCase();
        return product.includes(searchLower) || 
               description.includes(searchLower) || 
               quoteNo.includes(searchLower);
      });
    }
    
    // Sort by date (newest first)
    quotes.sort((a, b) => {
      const dateA = new Date(a['Tarih'] || 0);
      const dateB = new Date(b['Tarih'] || 0);
      return dateB - dateA;
    });
    
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

