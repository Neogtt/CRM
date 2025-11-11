const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    res.json(data.customers || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const customer = (data.customers || []).find(c => c.id === req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const newCustomer = {
      id: require('uuid').v4(),
      ...req.body,
      'Oluşturma Tarihi': new Date().toISOString(),
    };
    
    data.customers = data.customers || [];
    data.customers.push(newCustomer);
    
    await dataService.saveDataToExcel(data);
    res.json(newCustomer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.customers || []).findIndex(c => c.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    data.customers[index] = {
      ...data.customers[index],
      ...req.body,
      'Güncelleme Tarihi': new Date().toISOString(),
    };
    
    await dataService.saveDataToExcel(data);
    res.json(data.customers[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    data.customers = (data.customers || []).filter(c => c.id !== req.params.id);
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search customers
router.post('/search', async (req, res) => {
  try {
    const { query, filters } = req.body;
    const data = await dataService.loadDataFromExcel();
    let customers = data.customers || [];
    
    // Apply filters
    if (filters) {
      if (filters.country && filters.country.length > 0) {
        customers = customers.filter(c => filters.country.includes(c['Ülke']));
      }
      if (filters.representative && filters.representative.length > 0) {
        customers = customers.filter(c => filters.representative.includes(c['Satış Temsilcisi']));
      }
      if (filters.status && filters.status.length > 0) {
        customers = customers.filter(c => filters.status.includes(c['Durum']));
      }
    }
    
    // Apply search query
    if (query) {
      const searchLower = query.toLowerCase();
      customers = customers.filter(c => {
        return (
          (c['Müşteri Adı'] && c['Müşteri Adı'].toLowerCase().includes(searchLower)) ||
          (c['Telefon'] && c['Telefon'].includes(searchLower)) ||
          (c['E-posta'] && c['E-posta'].toLowerCase().includes(searchLower)) ||
          (c['Adres'] && c['Adres'].toLowerCase().includes(searchLower))
        );
      });
    }
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync endpoint removed - using local storage only
// Google Sheets sync is no longer available

module.exports = router;

