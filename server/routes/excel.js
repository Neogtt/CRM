const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const dataService = require('../services/dataService');
const excelSyncService = require('../services/excelSyncService');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../temp/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'import-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/octet-stream' // Some systems send Excel files as octet-stream
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.'), false);
    }
  }
});

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Dosya boyutu çok büyük. Maksimum 50MB.' });
    }
    return res.status(400).json({ error: 'Dosya yükleme hatası: ' + err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'Dosya yükleme hatası' });
  }
  next();
};

// Sheet name mapping for Excel import
const SHEET_NAME_MAPPING = {
  'Müşteriler': 'customers',
  'Sayfa1': 'customers', // Support "Sayfa1" as customers sheet
  'Teklifler': 'quotes',
  'Proformalar': 'proformas',
  'Evraklar': 'invoices',
  'Faturalar': 'invoices', // Support "Faturalar" as invoices sheet
  'Siparişler': 'orders',
  'ETA': 'eta',
  'Fuar Kayıtları': 'fairs',
  'FuarMusteri': 'fairs', // Support "FuarMusteri" as fairs sheet
  'Etkileşim Günlüğü': 'interactions',
  'Tahsilat Planı': 'paymentPlans',
  'Hedefler': 'goals',
  'Temsilciler': 'representatives',
};

// Download Excel template
router.get('/template', (req, res) => {
  try {
    const withDemo = req.query.demo === 'true';
    const tempPath = path.join(__dirname, '../../temp', `template_${Date.now()}.xlsx`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create template file
    const templatePath = dataService.createTemplateFile(withDemo, tempPath);
    
    const filename = `LocalCRM_Template${withDemo ? '_Demo' : '_Empty'}.xlsx`;
    res.download(templatePath, filename, (err) => {
      if (err) {
        console.error('Error downloading template:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Template indirme hatası' });
        }
      }
      // Clean up temp file after download (with delay to ensure download completes)
      setTimeout(() => {
        try {
          if (fs.existsSync(templatePath)) {
            fs.unlinkSync(templatePath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up template file:', cleanupError);
        }
      }, 5000);
    });
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Template oluşturma hatası: ' + error.message });
  }
});

// Download current Excel file
router.get('/download', (req, res) => {
  try {
    const localExcelPath = path.join(__dirname, '../../temp/local.xlsx');
    if (!fs.existsSync(localExcelPath)) {
      return res.status(404).json({ error: 'Excel dosyası bulunamadı' });
    }
    
    const filename = `LocalCRM_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.download(localExcelPath, filename, (err) => {
      if (err) {
        console.error('Error downloading Excel:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Excel indirme hatası' });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading Excel:', error);
    res.status(500).json({ error: 'Excel indirme hatası: ' + error.message });
  }
});

// Check if Excel file exists and has data
router.get('/status', async (req, res) => {
  try {
    const data = await dataService.loadDataFromExcel();
    const localExcelPath = path.join(__dirname, '../../temp/local.xlsx');
    const exists = fs.existsSync(localExcelPath);
    
    // Check if there's any real data (more than just headers or demo data)
    // Filter out demo customer (ID starts with 'demo-')
    const realCustomers = data.customers.filter(c => !c.ID || !c.ID.startsWith('demo-'));
    const hasData = exists && (
      realCustomers.length > 0 || // Real customers (not demo)
      data.quotes.length > 0 ||
      data.proformas.length > 0 ||
      data.invoices.length > 0 ||
      data.interactions.length > 0
    );
    
    res.json({
      exists,
      hasData,
      customersCount: data.customers.length,
      quotesCount: data.quotes.length,
      proformasCount: data.proformas.length,
      invoicesCount: data.invoices.length,
      representativesCount: data.representatives ? data.representatives.length : 0,
      goalsCount: data.goals ? data.goals.length : 0,
      interactionsCount: data.interactions ? data.interactions.length : 0,
      fairsCount: data.fairs ? data.fairs.length : 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import Excel file
router.post('/import', upload.single('file'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi' });
    }

    const filePath = req.file.path;
    const mergeMode = req.body.mergeMode || 'replace'; // 'replace' or 'append'
    let selectedSheets = [];
    if (req.body.sheets) {
      try {
        selectedSheets = typeof req.body.sheets === 'string' ? JSON.parse(req.body.sheets) : req.body.sheets;
      } catch (e) {
        console.warn('Error parsing sheets parameter:', e);
        selectedSheets = [];
      }
    }

    console.log('Importing Excel file:', filePath);
    console.log('Merge mode:', mergeMode);
    console.log('Selected sheets:', selectedSheets);

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    console.log('Available sheets in Excel:', sheetNames);

    // Load current data
    const currentData = await dataService.loadDataFromExcel();

    // Process each sheet
    const importResults = {};
    let hasImportedData = false;

    for (const sheetName of sheetNames) {
      // Map sheet name to our data key
      const dataKey = SHEET_NAME_MAPPING[sheetName];
      
      // If specific sheets are selected, only import those
      if (selectedSheets.length > 0 && !selectedSheets.includes(sheetName) && !selectedSheets.includes(dataKey)) {
        continue;
      }

      if (!dataKey) {
        console.log(`Skipping unknown sheet: ${sheetName}`);
        continue;
      }

      try {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          console.log(`Sheet ${sheetName} is empty, skipping`);
          continue;
        }

        console.log(`Importing ${jsonData.length} rows from sheet: ${sheetName} -> ${dataKey}`);

        // Process and clean data
        const processedData = processSheetData(dataKey, jsonData);

        if (mergeMode === 'append') {
          // Append to existing data
          const existingData = currentData[dataKey] || [];
          currentData[dataKey] = [...existingData, ...processedData];
        } else {
          // Replace existing data
          currentData[dataKey] = processedData;
        }

        importResults[sheetName] = {
          success: true,
          rowsImported: processedData.length,
          dataKey: dataKey,
        };

        hasImportedData = true;
      } catch (error) {
        console.error(`Error processing sheet ${sheetName}:`, error);
        importResults[sheetName] = {
          success: false,
          error: error.message,
        };
      }
    }

    // Save imported data
    if (hasImportedData) {
      await dataService.saveDataToExcel(currentData);
      console.log('Data saved successfully');
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error deleting uploaded file:', error);
    }

    res.json({
      success: true,
      message: 'Excel dosyası başarıyla import edildi',
      results: importResults,
      sheetsProcessed: Object.keys(importResults).length,
    });
  } catch (error) {
    console.error('Error importing Excel:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Excel import hatası: ' + (error.message || 'Bilinmeyen hata') });
  }
});

// Helper function to process sheet data
function processSheetData(dataKey, jsonData) {
  return jsonData.map((row, index) => {
    const processedRow = { ...row };

    // Generate ID if not present
    if (!processedRow.ID && !processedRow.id) {
      processedRow.ID = uuidv4();
    } else if (processedRow.id && !processedRow.ID) {
      processedRow.ID = processedRow.id;
    }

    // Convert date strings to proper format
    const dateFields = ['Tarih', 'Fatura Tarihi', 'Vade Tarihi', 'Sevk Tarihi', 'ETA Tarihi', 'Ulaşma Tarihi', 'Termin Tarihi', 'Oluşturma Tarihi', 'Güncelleme Tarihi'];
    dateFields.forEach(field => {
      if (processedRow[field]) {
        try {
          // Try to parse Excel date (number) or date string
          if (typeof processedRow[field] === 'number') {
            // Excel date serial number
            const excelDate = XLSX.SSF.parse_date_code(processedRow[field]);
            if (excelDate) {
              processedRow[field] = new Date(excelDate.y, excelDate.m - 1, excelDate.d).toISOString().split('T')[0];
            }
          } else if (typeof processedRow[field] === 'string') {
            // Try to parse date string
            const date = new Date(processedRow[field]);
            if (!isNaN(date.getTime())) {
              processedRow[field] = date.toISOString().split('T')[0];
            }
          }
        } catch (error) {
          console.warn(`Error parsing date field ${field}:`, error);
        }
      }
    });

    // Clean numeric fields
    const numericFields = ['Tutar', 'Ödenen Tutar', 'Kalan Bakiye', 'Vade (Gün)', 'Ciro Hedefi', 'Görüşme Kalitesi'];
    numericFields.forEach(field => {
      if (processedRow[field] !== undefined && processedRow[field] !== null && processedRow[field] !== '') {
        const numValue = dataService.smartToNum(processedRow[field]);
        if (!isNaN(numValue)) {
          processedRow[field] = numValue;
        }
      }
    });

    return processedRow;
  });
}

// Export the processSheetData function for use in route
router.processSheetData = processSheetData;

// Manual sync with Google Drive
router.post('/sync', async (req, res) => {
  try {
    const syncService = excelSyncService.getInstance();
    const result = await syncService.manualSync();
    
    res.json({
      success: result.success,
      message: result.message,
      action: result.action || 'none',
    });
  } catch (error) {
    console.error('Error during manual sync:', error);
    res.status(500).json({ 
      success: false,
      error: 'Senkronizasyon hatası: ' + error.message 
    });
  }
});

// Get sync status
router.get('/sync/status', async (req, res) => {
  try {
    const syncService = excelSyncService.getInstance();
    const localModTime = syncService.getLocalFileModificationTime();
    const driveModTime = await syncService.getDriveFileModificationTime();
    
    let status = 'unknown';
    let message = '';
    
    if (!localModTime && !driveModTime) {
      status = 'no_files';
      message = 'Hiçbir dosya bulunamadı';
    } else if (!localModTime) {
      status = 'drive_only';
      message = 'Sadece Drive\'da dosya var';
    } else if (!driveModTime) {
      status = 'local_only';
      message = 'Sadece local\'de dosya var';
    } else {
      const localTime = localModTime.getTime();
      const driveTime = driveModTime.getTime();
      const timeDiff = Math.abs(localTime - driveTime);
      
      if (timeDiff < 1000) {
        status = 'synced';
        message = 'Dosyalar senkronize';
      } else if (driveTime > localTime) {
        status = 'drive_newer';
        message = 'Drive\'daki dosya daha yeni';
      } else {
        status = 'local_newer';
        message = 'Local dosya daha yeni';
      }
    }
    
    res.json({
      status,
      message,
      localModTime: localModTime ? localModTime.toISOString() : null,
      driveModTime: driveModTime ? driveModTime.toISOString() : null,
      isSyncing: syncService.isSyncing,
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    res.status(500).json({ 
      error: 'Durum kontrolü hatası: ' + error.message 
    });
  }
});

module.exports = router;
