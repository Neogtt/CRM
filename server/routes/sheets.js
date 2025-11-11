const express = require('express');
const router = express.Router();
const googleSheets = require('../services/googleSheets');

// Read sheet
router.get('/read', async (req, res) => {
  try {
    const { spreadsheetId, range } = req.query;
    const data = await googleSheets.readSheet(spreadsheetId, range);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Write to sheet
router.post('/write', async (req, res) => {
  try {
    const { spreadsheetId, range, values } = req.body;
    const result = await googleSheets.writeSheet(spreadsheetId, range, values);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Append to sheet
router.post('/append', async (req, res) => {
  try {
    const { spreadsheetId, range, values } = req.body;
    const result = await googleSheets.appendSheet(spreadsheetId, range, values);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sheet info
router.get('/info/:spreadsheetId', async (req, res) => {
  try {
    const info = await googleSheets.getSheetInfo(req.params.spreadsheetId);
    res.json(info);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

