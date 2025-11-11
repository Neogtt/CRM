const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Get all fair records
router.get('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    res.json(data.fairs || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fairs by fair name (must be before /:id route)
router.get('/by-fair/:fairName', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const fairs = (data.fairs || []).filter(f => f['Fuar Adı'] === req.params.fairName);
    res.json(fairs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique fair names
router.get('/unique-fairs', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const uniqueFairs = [...new Set((data.fairs || []).map(f => f['Fuar Adı']).filter(Boolean))].sort();
    res.json(uniqueFairs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fair record by ID
router.get('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const fair = (data.fairs || []).find(f => 
      f.id === req.params.id || f.ID === req.params.id
    );
    if (!fair) {
      return res.status(404).json({ error: 'Fair record not found' });
    }
    res.json(fair);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new fair record
router.post('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const { v4: uuidv4 } = require('uuid');
    const newFair = {
      ID: uuidv4(),
      id: uuidv4(), // Backward compatibility
      ...req.body,
      'Tarih': req.body['Tarih'] || new Date().toISOString().split('T')[0],
      'Görüşme Kalitesi': req.body['Görüşme Kalitesi'] || 3,
    };
    
    data.fairs = data.fairs || [];
    data.fairs.push(newFair);
    
    await dataService.saveDataToExcel(data);
    res.json(newFair);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update fair record
router.put('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.fairs || []).findIndex(f => 
      f.id === req.params.id || f.ID === req.params.id
    );
    
    if (index === -1) {
      return res.status(404).json({ error: 'Fair record not found' });
    }
    
    data.fairs[index] = {
      ...data.fairs[index],
      ...req.body,
      // Preserve ID
      id: data.fairs[index].id || data.fairs[index].ID,
      ID: data.fairs[index].id || data.fairs[index].ID,
    };
    
    await dataService.saveDataToExcel(data);
    res.json(data.fairs[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete fair record
router.delete('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    data.fairs = (data.fairs || []).filter(f => 
      f.id !== req.params.id && f.ID !== req.params.id
    );
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

