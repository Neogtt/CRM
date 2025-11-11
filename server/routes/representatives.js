const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const { v4: uuidv4 } = require('uuid');

// Get all representatives
router.get('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const representatives = (data.representatives || []).map(rep => {
      // Parse comma-separated strings back to arrays for frontend
      return {
        ...rep,
        'Bölgeler': rep['Bölgeler'] ? (typeof rep['Bölgeler'] === 'string' ? rep['Bölgeler'].split(',').map(b => b.trim()).filter(b => b) : rep['Bölgeler']) : [],
        'Ülkeler': rep['Ülkeler'] ? (typeof rep['Ülkeler'] === 'string' ? rep['Ülkeler'].split(',').map(u => u.trim()).filter(u => u) : rep['Ülkeler']) : [],
      };
    });
    res.json(representatives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get representative by ID
router.get('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const representative = (data.representatives || []).find(r => r.id === req.params.id);
    if (!representative) {
      return res.status(404).json({ error: 'Representative not found' });
    }
    // Parse comma-separated strings back to arrays
    representative['Bölgeler'] = representative['Bölgeler'] ? (typeof representative['Bölgeler'] === 'string' ? representative['Bölgeler'].split(',').map(b => b.trim()).filter(b => b) : representative['Bölgeler']) : [];
    representative['Ülkeler'] = representative['Ülkeler'] ? (typeof representative['Ülkeler'] === 'string' ? representative['Ülkeler'].split(',').map(u => u.trim()).filter(u => u) : representative['Ülkeler']) : [];
    res.json(representative);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new representative
router.post('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    
    // Validate required fields
    if (!req.body['Temsilci Adı'] || !req.body['Temsilci Adı'].trim()) {
      return res.status(400).json({ error: 'Temsilci Adı gereklidir' });
    }
    
    if (!req.body['Bölgeler'] || !Array.isArray(req.body['Bölgeler']) || req.body['Bölgeler'].length === 0) {
      return res.status(400).json({ error: 'En az bir bölge seçilmelidir' });
    }
    
    // Check if representative with same name already exists
    const existingRep = (data.representatives || []).find(
      r => r['Temsilci Adı'] && r['Temsilci Adı'].toLowerCase().trim() === req.body['Temsilci Adı'].toLowerCase().trim()
    );
    
    if (existingRep) {
      return res.status(400).json({ error: 'Bu isimde bir temsilci zaten mevcut' });
    }
    
    const newRepresentative = {
      id: uuidv4(),
      'Temsilci Adı': req.body['Temsilci Adı'].trim(),
      'Bölgeler': Array.isArray(req.body['Bölgeler']) ? req.body['Bölgeler'].join(', ') : req.body['Bölgeler'],
      'Ülkeler': Array.isArray(req.body['Ülkeler']) && req.body['Ülkeler'].length > 0 
        ? req.body['Ülkeler'].join(', ') 
        : '',
      'Notlar': req.body['Notlar'] || '',
      'Oluşturma Tarihi': new Date().toISOString(),
    };
    
    data.representatives = data.representatives || [];
    data.representatives.push(newRepresentative);
    
    await dataService.saveDataToExcel(data);
    res.json(newRepresentative);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update representative
router.put('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const index = (data.representatives || []).findIndex(r => r.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Representative not found' });
    }
    
    // Validate required fields
    if (!req.body['Temsilci Adı'] || !req.body['Temsilci Adı'].trim()) {
      return res.status(400).json({ error: 'Temsilci Adı gereklidir' });
    }
    
    if (!req.body['Bölgeler'] || !Array.isArray(req.body['Bölgeler']) || req.body['Bölgeler'].length === 0) {
      return res.status(400).json({ error: 'En az bir bölge seçilmelidir' });
    }
    
    // Check if another representative with same name exists (excluding current one)
    const existingRep = (data.representatives || []).find(
      (r, i) => i !== index && r['Temsilci Adı'] && r['Temsilci Adı'].toLowerCase().trim() === req.body['Temsilci Adı'].toLowerCase().trim()
    );
    
    if (existingRep) {
      return res.status(400).json({ error: 'Bu isimde başka bir temsilci zaten mevcut' });
    }
    
    data.representatives[index] = {
      ...data.representatives[index],
      'Temsilci Adı': req.body['Temsilci Adı'].trim(),
      'Bölgeler': Array.isArray(req.body['Bölgeler']) ? req.body['Bölgeler'].join(', ') : req.body['Bölgeler'],
      'Ülkeler': Array.isArray(req.body['Ülkeler']) && req.body['Ülkeler'].length > 0 
        ? req.body['Ülkeler'].join(', ') 
        : '',
      'Notlar': req.body['Notlar'] || '',
      'Güncelleme Tarihi': new Date().toISOString(),
    };
    
    await dataService.saveDataToExcel(data);
    res.json(data.representatives[index]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete representative
router.delete('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const beforeCount = (data.representatives || []).length;
    data.representatives = (data.representatives || []).filter(r => r.id !== req.params.id);
    
    if (data.representatives.length === beforeCount) {
      return res.status(404).json({ error: 'Representative not found' });
    }
    
    await dataService.saveDataToExcel(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get regions list (static list)
router.get('/options/regions', (req, res) => {
  const regions = [
    'Avrupa',
    'Asya',
    'Afrika',
    'Kuzey Amerika',
    'Güney Amerika',
    'Orta Doğu',
    'Okyanusya',
    'Orta Asya',
    'Doğu Avrupa',
    'Batı Avrupa',
    'Güney Avrupa',
    'Kuzey Avrupa',
    'Güneydoğu Asya',
    'Orta Doğu ve Kuzey Afrika (MENA)',
    'Latin Amerika',
    'Karayipler',
    'Diğer'
  ];
  res.json(regions);
});

// Get countries list
router.get('/options/countries', async (req, res) => {
  try {
    const { COUNTRY_LIST } = require('../config/constants');
    res.json(COUNTRY_LIST);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

