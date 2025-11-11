const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const emailService = require('../services/email');

// Country to language mapping
const COUNTRY_LANGUAGE_MAP = {
  'Türkiye': 'tr',
  'Turkey': 'tr',
  'Amerika Birleşik Devletleri': 'en',
  'Birleşik Krallık': 'en',
  'Kanada': 'en',
  'Avustralya': 'en',
  'Almanya': 'de',
  'Avusturya': 'de',
  'İsviçre': 'de',
  'Fransa': 'fr',
  'Belçika': 'fr',
  'İspanya': 'es',
  'Meksika': 'es',
  'Kolombiya': 'es',
  'Arjantin': 'es',
  'Birleşik Arap Emirlikleri': 'ar',
  'Suudi Arabistan': 'ar',
  'Katar': 'ar',
  'Kuveyt': 'ar',
  // Additional mappings
  'United Kingdom': 'en',
  'UK': 'en',
  'ABD': 'en',
  'USA': 'en',
  'United States': 'en',
  'Germany': 'de',
  'France': 'fr',
  'Spain': 'es',
  'Italy': 'it',
  'İtalya': 'it',
  'Yeni Zelanda': 'en',
  'New Zealand': 'en',
  'Saudi Arabia': 'ar',
  'UAE': 'ar',
  'United Arab Emirates': 'ar',
  'Mısır': 'ar',
  'Egypt': 'ar',
  'Irak': 'ar',
  'Iraq': 'ar',
  'Ürdün': 'ar',
  'Jordan': 'ar',
  'Lübnan': 'ar',
  'Lebanon': 'ar',
  'Bahreyn': 'ar',
  'Bahrain': 'ar',
  'Oman': 'ar',
  'Umman': 'ar',
};

const LANGUAGE_LABELS = {
  'tr': 'Türkçe',
  'en': 'English',
  'de': 'Deutsch',
  'fr': 'Français',
  'es': 'Español',
  'ar': 'العربية',
};

// Extract unique emails from string
function extractUniqueEmails(emailString) {
  if (!emailString) return [];
  
  const emails = String(emailString)
    .split(/[,;\s]+/)
    .map(email => email.trim())
    .filter(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    });
  
  return [...new Set(emails)];
}

// Get all emails with countries
router.get('/emails', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const emailCountryMap = {};
    const unknownCountryLabel = '(Belirtilmedi)';
    
    // Extract emails from customers
    const customers = data.customers || [];
    customers.forEach(customer => {
      const emailCol = customer['E-posta'] || customer['E-mail'] || '';
      const countryCol = customer['Ülke'] || '';
      
      if (emailCol) {
        const emails = extractUniqueEmails(emailCol);
        const country = countryCol && countryCol.toString().trim() && countryCol.toString().trim().toLowerCase() !== 'nan' 
          ? countryCol.toString().trim() 
          : unknownCountryLabel;
        
        emails.forEach(email => {
          if (!emailCountryMap[email]) {
            emailCountryMap[email] = new Set();
          }
          emailCountryMap[email].add(country);
        });
      }
    });
    
    // Extract emails from fair records
    const fairs = data.fairs || [];
    fairs.forEach(fair => {
      const emailCol = fair['E-mail'] || fair['E-posta'] || '';
      const countryCol = fair['Ülke'] || '';
      
      if (emailCol) {
        const emails = extractUniqueEmails(emailCol);
        const country = countryCol && countryCol.toString().trim() && countryCol.toString().trim().toLowerCase() !== 'nan' 
          ? countryCol.toString().trim() 
          : unknownCountryLabel;
        
        emails.forEach(email => {
          if (!emailCountryMap[email]) {
            emailCountryMap[email] = new Set();
          }
          emailCountryMap[email].add(country);
        });
      }
    });
    
    // Convert Set to Array
    const result = {};
    Object.keys(emailCountryMap).forEach(email => {
      result[email] = Array.from(emailCountryMap[email]);
    });
    
    const allEmails = Object.keys(result).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    const allCountries = [...new Set(Object.values(result).flat())].sort();
    
    res.json({
      emailCountryMap: result,
      allEmails,
      allCountries,
      totalEmails: allEmails.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get holiday template names
router.get('/templates', (req, res) => {
  try {
    const templateNames = emailService.getHolidayTemplateNames();
    res.json(templateNames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get languages for a holiday template
router.get('/templates/:holidayName/languages', (req, res) => {
  try {
    const { holidayName } = req.params;
    const languages = emailService.getHolidayTemplateLanguages(holidayName);
    res.json(languages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get country language mapping
router.get('/country-language-map', (req, res) => {
  res.json({ COUNTRY_LANGUAGE_MAP, LANGUAGE_LABELS });
});

module.exports = router;

