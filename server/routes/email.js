const express = require('express');
const router = express.Router();
const emailService = require('../services/email');

// Send email
router.post('/send', async (req, res) => {
  try {
    const { to, subject, body, attachments, isHTML } = req.body;
    const result = await emailService.sendEmail(to, subject, body, attachments || [], isHTML !== false);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send bulk email
router.post('/send-bulk', async (req, res) => {
  try {
    const { recipients, subject, body, attachments, isHTML } = req.body;
    const results = await emailService.sendBulkEmail(recipients, subject, body, attachments || [], isHTML !== false);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get holiday template
router.get('/templates/holiday/:holidayName', (req, res) => {
  try {
    const { holidayName } = req.params;
    const { language = 'tr' } = req.query;
    const template = emailService.getHolidayTemplate(holidayName, language);
    
    if (!template) {
      return res.status(404).json({ error: 'Holiday template not found' });
    }
    
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fair template
router.get('/templates/fair', (req, res) => {
  try {
    const { language = 'tr' } = req.query;
    const template = emailService.getFairTemplate(language);
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extract emails from string
router.post('/extract-emails', (req, res) => {
  try {
    const { emailString } = req.body;
    const emails = emailService.extractUniqueEmails(emailString);
    res.json({ emails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

