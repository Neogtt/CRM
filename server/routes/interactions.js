const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Get all interactions
router.get('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    res.json(data.interactions || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get interaction by ID
router.get('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const interaction = (data.interactions || []).find(i => i.ID === req.params.id || i.id === req.params.id);
    if (!interaction) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    res.json(interaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new interaction
router.post('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const newInteraction = {
      ID: require('uuid').v4(),
      ...req.body,
      'Tarih': req.body['Tarih'] || new Date().toISOString().split('T')[0],
    };
    
    data.interactions = data.interactions || [];
    data.interactions.push(newInteraction);
    
    await dataService.saveDataToExcel(data);
    res.json(newInteraction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update interaction
router.put('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.interactions || []).findIndex(i => i.ID === req.params.id || i.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Interaction not found' });
    }
    
    data.interactions[index] = {
      ...data.interactions[index],
      ...req.body,
    };
    
    await dataService.saveDataToExcel(data);
    res.json(data.interactions[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete interaction
router.delete('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    data.interactions = (data.interactions || []).filter(i => i.ID !== req.params.id && i.id !== req.params.id);
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search interactions
router.post('/search', async (req, res) => {
  try {
    const { customer, types, searchText, startDate, endDate } = req.body;
    const data = await dataService.loadDataFromExcel();
    let interactions = data.interactions || [];
    
    // Filter by customer
    if (customer && customer !== '(Hepsi)') {
      interactions = interactions.filter(i => i['Müşteri Adı'] === customer);
    }
    
    // Filter by types
    if (types && types.length > 0) {
      interactions = interactions.filter(i => types.includes(i['Tip']));
    }
    
    // Search in description
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      interactions = interactions.filter(i => {
        const desc = String(i['Açıklama'] || '').toLowerCase();
        return desc.includes(searchLower);
      });
    }
    
    // Filter by date range
    if (startDate && endDate) {
      interactions = interactions.filter(i => {
        const interactionDate = new Date(i['Tarih']);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return interactionDate >= start && interactionDate <= end;
      });
    }
    
    // Sort by date (newest first)
    interactions.sort((a, b) => {
      const dateA = new Date(a['Tarih'] || 0);
      const dateB = new Date(b['Tarih'] || 0);
      return dateB - dateA;
    });
    
    res.json(interactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

