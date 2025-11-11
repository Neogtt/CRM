const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const { v4: uuidv4 } = require('uuid');

// Get all goals
router.get('/', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const goals = (data.goals || []).sort((a, b) => {
      const yearA = parseInt(a['Yıl'] || 0);
      const yearB = parseInt(b['Yıl'] || 0);
      return yearB - yearA; // Sort descending by year
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get goal by year
router.get('/year/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const data = await dataService.loadDataFromExcel();
    const goal = (data.goals || []).find(g => parseInt(g['Yıl']) === year);
    
    if (!goal) {
      return res.status(404).json({ error: 'Hedef bulunamadı' });
    }
    
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get goal by ID
router.get('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const goal = (data.goals || []).find(g => g.ID === req.params.id || g.id === req.params.id);
    
    if (!goal) {
      return res.status(404).json({ error: 'Hedef bulunamadı' });
    }
    
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update goal
router.post('/', async (req, res) => {
  try {
    const { Yıl, 'Ciro Hedefi': CiroHedefi } = req.body;
    
    if (!Yıl || !CiroHedefi) {
      return res.status(400).json({ error: 'Yıl ve Ciro Hedefi gereklidir' });
    }
    
    const data = await dataService.loadDataFromExcel();
    const goals = data.goals || [];
    
    // Check if goal for this year already exists
    const existingGoalIndex = goals.findIndex(g => parseInt(g['Yıl']) === parseInt(Yıl));
    
    const goalData = {
      ID: existingGoalIndex >= 0 ? goals[existingGoalIndex].ID : uuidv4(),
      Yıl: parseInt(Yıl),
      'Ciro Hedefi': parseFloat(CiroHedefi) || 0,
      'Oluşturma Tarihi': existingGoalIndex >= 0 ? goals[existingGoalIndex]['Oluşturma Tarihi'] : new Date().toISOString(),
      'Güncelleme Tarihi': new Date().toISOString(),
    };
    
    if (existingGoalIndex >= 0) {
      // Update existing goal
      goals[existingGoalIndex] = goalData;
    } else {
      // Add new goal
      goals.push(goalData);
    }
    
    // Save to Excel
    await dataService.saveDataToExcel({
      ...data,
      goals,
    });
    
    res.json(goalData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update goal
router.put('/:id', async (req, res) => {
  try {
    const { Yıl, 'Ciro Hedefi': CiroHedefi } = req.body;
    
    const data = await dataService.loadDataFromExcel();
    const goals = data.goals || [];
    
    const goalIndex = goals.findIndex(g => g.ID === req.params.id || g.id === req.params.id);
    
    if (goalIndex === -1) {
      return res.status(404).json({ error: 'Hedef bulunamadı' });
    }
    
    const updatedGoal = {
      ...goals[goalIndex],
      ...(Yıl !== undefined && { Yıl: parseInt(Yıl) }),
      ...(CiroHedefi !== undefined && { 'Ciro Hedefi': parseFloat(CiroHedefi) || 0 }),
      'Güncelleme Tarihi': new Date().toISOString(),
    };
    
    goals[goalIndex] = updatedGoal;
    
    // Save to Excel
    await dataService.saveDataToExcel({
      ...data,
      goals,
    });
    
    res.json(updatedGoal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const goals = (data.goals || []).filter(g => g.ID !== req.params.id && g.id !== req.params.id);
    
    // Save to Excel
    await dataService.saveDataToExcel({
      ...data,
      goals,
    });
    
    res.json({ message: 'Hedef silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current year goal with progress
router.get('/current/progress', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const data = await dataService.loadDataFromExcel();
    const goal = (data.goals || []).find(g => parseInt(g['Yıl']) === currentYear);
    
    if (!goal) {
      return res.json({ 
        goal: null, 
        currentYear,
        message: 'Bu yıl için hedef tanımlanmamış' 
      });
    }
    
    // Calculate current progress from invoices
    const invoices = (data.invoices || []).filter(inv => {
      const dateCol = inv['Fatura Tarihi'] || inv['Tarih'];
      if (!dateCol) return false;
      
      try {
        const invDate = new Date(dateCol);
        return invDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    });
    
    const currentCiro = invoices.reduce((sum, inv) => {
      return sum + dataService.smartToNum(inv['Tutar']);
    }, 0);
    
    // Calculate pending orders total (orders waiting in factory - Durum: "Siparişe Dönüştü", Sevk Durumu: not "Sevkedildi" or "Ulaşıldı")
    const pendingOrders = (data.proformas || []).filter(p => {
      const durum = p['Durum'];
      const sevkDurumu = p['Sevk Durumu'] || '';
      
      // Check if order date is in current year
      const orderDate = p['Tarih'];
      if (orderDate) {
        try {
          const orderYear = new Date(orderDate).getFullYear();
          if (orderYear !== currentYear) return false;
        } catch {
          return false;
        }
      }
      
      return durum === 'Siparişe Dönüştü' && 
             sevkDurumu !== 'Sevkedildi' && 
             sevkDurumu !== 'Ulaşıldı';
    });
    
    const pendingOrdersTotal = pendingOrders.reduce((sum, order) => {
      return sum + dataService.smartToNum(order['Tutar']);
    }, 0);
    
    // Total potential ciro (current ciro + pending orders)
    const totalPotentialCiro = currentCiro + pendingOrdersTotal;
    
    const targetCiro = dataService.smartToNum(goal['Ciro Hedefi']) || 0;
    const progressPercentage = targetCiro > 0 ? (currentCiro / targetCiro) * 100 : 0;
    const totalProgressPercentage = targetCiro > 0 ? (totalPotentialCiro / targetCiro) * 100 : 0;
    const remaining = Math.max(0, targetCiro - currentCiro);
    const remainingWithPending = Math.max(0, targetCiro - totalPotentialCiro);
    
    res.json({
      goal,
      currentYear,
      currentCiro,
      pendingOrdersTotal,
      totalPotentialCiro,
      targetCiro,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      totalProgressPercentage: Math.round(totalProgressPercentage * 100) / 100,
      remaining,
      remainingWithPending,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

