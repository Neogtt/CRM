const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Base directories
const PROFORMA_BASE_DIR = path.join(__dirname, '../../files/Proforma Klasörü');
const SIPARIS_FORMU_BASE_DIR = path.join(__dirname, '../../files/Sipariş Formu Klasörü');
const FATURA_EVRAK_BASE_DIR = path.join(__dirname, '../../files/Fatura Evrakları Klasörü');

// Ensure base directories exist
[PROFORMA_BASE_DIR, SIPARIS_FORMU_BASE_DIR, FATURA_EVRAK_BASE_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper function to get safe folder name
function getSafeFolderName(name) {
  if (!name) return 'Bilinmeyen';
  // Remove invalid characters for folder names
  // Windows'ta geçersiz karakterler: < > : " / \ | ? *
  // Ayrıca başta ve sonda nokta ve boşluk olamaz
  let safeName = name
    .replace(/[<>:"/\\|?*]/g, '') // Geçersiz karakterleri kaldır
    .replace(/\s+/g, ' ') // Çoklu boşlukları tek boşluğa çevir
    .trim() // Başta ve sondaki boşlukları kaldır
    .replace(/^\.+/, '') // Başta nokta varsa kaldır
    .replace(/\.+$/, '') // Sonda nokta varsa kaldır
    .substring(0, 100); // Limit length
  
  // Eğer boş kaldıysa veya sadece boşluk varsa
  if (!safeName || safeName.trim() === '') {
    return 'Bilinmeyen';
  }
  
  return safeName;
}

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fileType = req.body.fileType || 'proforma'; // 'proforma' or 'siparis-formu'
    
    // Get customer name from request body - check multiple possible sources
    let customerName = req.body.customerName;
    
    // If customerName is empty or undefined, try to get from other fields
    if (!customerName || customerName.trim() === '') {
      customerName = req.body['Müşteri Adı'] || 
                     req.body['Musteri Adi'] || 
                     req.body['customerName'] ||
                     null;
    }
    
    // If still no customer name, log error but continue with 'Bilinmeyen'
    if (!customerName || customerName.trim() === '') {
      console.error('WARNING: Customer name not found in request. Fields:', Object.keys(req.body));
      customerName = 'Bilinmeyen';
    }
    
    let baseDir;
    if (fileType === 'siparis-formu') {
      baseDir = SIPARIS_FORMU_BASE_DIR;
    } else if (fileType === 'invoice-document') {
      baseDir = FATURA_EVRAK_BASE_DIR;
    } else {
      baseDir = PROFORMA_BASE_DIR;
    }
    const safeCustomerName = getSafeFolderName(customerName);
    const customerDir = path.join(baseDir, safeCustomerName);
    
    // Create customer directory if it doesn't exist
    try {
      if (!fs.existsSync(customerDir)) {
        fs.mkdirSync(customerDir, { recursive: true });
        console.log(`Created customer directory: ${customerDir}`);
      }
    } catch (error) {
      console.error(`Error creating customer directory: ${customerDir}`, error);
      // Fallback: try to create in base directory with a simpler name
      const fallbackDir = path.join(baseDir, 'Bilinmeyen');
      try {
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        cb(null, fallbackDir);
        return;
      } catch (fallbackError) {
        console.error(`Error creating fallback directory: ${fallbackDir}`, fallbackError);
        cb(new Error('Failed to create directory'), null);
        return;
      }
    }
    
    console.log(`Uploading ${fileType} to: ${customerDir} for customer: ${customerName}`);
    cb(null, customerDir);
  },
  filename: (req, file, cb) => {
    const proformaNo = req.body.proformaNo || req.body['Proforma No'] || '';
    const fileType = req.body.fileType || 'proforma';
    
    // Tarih formatı: YYYYMMDD (Proforma tarihinden alınacak)
    let tarih = '';
    if (req.body.tarih || req.body['Tarih']) {
      const tarihValue = req.body.tarih || req.body['Tarih'];
      // Tarih formatını YYYYMMDD'ye çevir
      if (tarihValue.includes('-')) {
        // YYYY-MM-DD formatından YYYYMMDD'ye çevir
        tarih = tarihValue.replace(/-/g, '');
      } else if (tarihValue.includes('/')) {
        // DD/MM/YYYY veya MM/DD/YYYY formatından YYYYMMDD'ye çevir
        const parts = tarihValue.split('/');
        if (parts.length === 3) {
          // DD/MM/YYYY formatını varsay
          tarih = `${parts[2]}${parts[1].padStart(2, '0')}${parts[0].padStart(2, '0')}`;
        } else {
          tarih = tarihValue.replace(/\//g, '');
        }
      } else {
        tarih = tarihValue.replace(/[^0-9]/g, ''); // Sadece rakamları al
      }
    }
    
    // Eğer tarih yoksa, bugünün tarihini kullan
    if (!tarih || tarih.length !== 8) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      tarih = `${year}${month}${day}`;
    }
    
    // Proforma No'yu temizle (geçersiz karakterleri kaldır)
    const safeProformaNo = (proformaNo || '').replace(/[<>:"/\\|?*]/g, '').trim();
    
    let filename = '';
    if (fileType === 'siparis-formu') {
      // Format: Proforma_No_SiparişFormu.pdf
      filename = `${safeProformaNo}_SiparişFormu.pdf`;
    } else if (fileType === 'invoice-document') {
      const documentType = req.body.documentType || 'Document';
      // Evrak tipine göre isimlendir
      const safeDocumentType = documentType.replace(/[<>:"/\\|?*]/g, '').trim();
      filename = `${safeProformaNo}_${safeDocumentType}.pdf`;
    } else {
      // Format: Proforma_No_Tarih.pdf
      filename = `${safeProformaNo}_${tarih}.pdf`;
    }
    
    console.log(`Generated filename: ${filename} for proforma: ${proformaNo}, date: ${tarih}`);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece PDF dosyaları yüklenebilir'));
    }
  }
});

// Upload Proforma PDF
router.post('/upload/proforma', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF dosyası yüklenmedi' });
    }
    
    // Return file URL for accessing the file
    const fileType = req.body.fileType || 'proforma';
    const folderName = fileType === 'siparis-formu' ? 'Sipariş Formu Klasörü' : 'Proforma Klasörü';
    const customerName = getSafeFolderName(req.body.customerName || 'Bilinmeyen');
    const fileName = req.file.filename;
    
    // URL format: /api/files/{folder}/{customer}/{filename}
    const fileUrl = `/api/files/${encodeURIComponent(folderName)}/${encodeURIComponent(customerName)}/${encodeURIComponent(fileName)}`;
    
    res.json({
      success: true,
      filePath: req.file.path,
      fileUrl: fileUrl,
      fileName: req.file.filename,
      message: 'Proforma PDF başarıyla yüklendi'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload Invoice Document (Commercial Invoice, Packing List, etc.)
router.post('/upload/invoice-document', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF dosyası yüklenmedi' });
    }
    
    // Get customer name from request
    let customerName = req.body?.customerName || 
                       req.body?.['Müşteri Adı'] || 
                       req.body?.['Musteri Adi'] || 
                       req.body?.['customerName'] ||
                       '';
    
    if (customerName) {
      customerName = customerName.trim();
    }
    
    console.log('=== Invoice Document Upload Debug ===');
    console.log('Request body:', req.body);
    console.log('Customer name:', customerName);
    console.log('Document type:', req.body.documentType);
    console.log('File path:', req.file.path);
    
    // If customer name is still empty, try to extract from filename
    if (!customerName || customerName === '' || customerName === 'Bilinmeyen') {
      console.warn('Customer name is empty or Bilinmeyen! Checking filename...');
      const filenameMatch = req.file.filename.match(/^([^_]+)_/);
      if (filenameMatch && filenameMatch[1] && filenameMatch[1] !== 'Bilinmeyen') {
        customerName = filenameMatch[1];
        console.log('Extracted customer name from filename:', customerName);
      }
    }
    
    // If still no valid customer name, return error
    if (!customerName || customerName.trim() === '' || customerName === 'Bilinmeyen') {
      console.error('Could not determine customer name');
      return res.status(400).json({ 
        error: 'Müşteri adı bulunamadı. Lütfen müşteri adını kontrol edin.',
        debug: {
          body: req.body,
          filename: req.file.filename,
          path: req.file.path
        }
      });
    }
    
    // Return file URL for accessing the file
    const fileType = req.body?.fileType || 'invoice-document';
    const folderName = 'Fatura Evrakları Klasörü';
    const safeCustomerName = getSafeFolderName(customerName);
    const fileName = req.file.filename;
    
    // Check if file was saved to wrong directory (Bilinmeyen)
    // If so, move it to correct directory
    const currentPath = req.file.path;
    const correctDir = path.join(FATURA_EVRAK_BASE_DIR, safeCustomerName);
    const correctPath = path.join(correctDir, fileName);
    
    // If file is in wrong location, move it
    if (currentPath !== correctPath && currentPath.includes('Bilinmeyen')) {
      console.log(`Moving file from ${currentPath} to ${correctPath}`);
      
      // Ensure correct directory exists
      if (!fs.existsSync(correctDir)) {
        fs.mkdirSync(correctDir, { recursive: true });
      }
      
      // Move file
      if (fs.existsSync(currentPath)) {
        fs.renameSync(currentPath, correctPath);
        console.log('File moved successfully to:', correctPath);
      }
      
      // Update req.file.path for response
      req.file.path = correctPath;
    }
    
    // URL format: /api/files/{folder}/{customer}/{filename}
    const fileUrl = `/api/files/${encodeURIComponent(folderName)}/${encodeURIComponent(safeCustomerName)}/${encodeURIComponent(fileName)}`;
    
    res.json({
      success: true,
      filePath: req.file.path,
      fileUrl: fileUrl,
      fileName: fileName,
      customerName: customerName,
      documentType: req.body.documentType,
      message: 'Evrak PDF başarıyla yüklendi'
    });
  } catch (error) {
    console.error('Error uploading Invoice Document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload Sipariş Formu PDF
router.post('/upload/siparis-formu', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF dosyası yüklenmedi' });
    }
    
    // Get customer name from request - check multiple sources
    // Note: req.body should be available after multer processes the form
    let customerName = req.body?.customerName || 
                       req.body?.['Müşteri Adı'] || 
                       req.body?.['Musteri Adi'] || 
                       req.body?.['customerName'] ||
                       '';
    
    // Trim whitespace
    if (customerName) {
      customerName = customerName.trim();
    }
    
    console.log('=== Sipariş Formu Upload Debug ===');
    console.log('Request body:', req.body);
    console.log('Request body keys:', Object.keys(req.body || {}));
    console.log('Customer name from body:', customerName);
    console.log('File path:', req.file.path);
    console.log('File destination:', req.file.destination);
    console.log('File filename:', req.file.filename);
    
    // If customer name is still empty, try to extract from filename
    // Filename format: CustomerName_ProformaNo_SiparisFormu_timestamp.pdf
    if (!customerName || customerName === '' || customerName === 'Bilinmeyen') {
      console.warn('Customer name is empty or Bilinmeyen! Checking filename...');
      
      // Try to extract from filename
      const filenameMatch = req.file.filename.match(/^([^_]+)_/);
      if (filenameMatch && filenameMatch[1] && filenameMatch[1] !== 'Bilinmeyen') {
        customerName = filenameMatch[1];
        console.log('Extracted customer name from filename:', customerName);
      }
    }
    
    // If still no valid customer name, return error
    if (!customerName || customerName.trim() === '' || customerName === 'Bilinmeyen') {
      console.error('Could not determine customer name');
      return res.status(400).json({ 
        error: 'Müşteri adı bulunamadı. Lütfen müşteri adını kontrol edin.',
        debug: {
          body: req.body,
          filename: req.file.filename,
          path: req.file.path
        }
      });
    }
    
    // Return file URL for accessing the file
    const fileType = req.body?.fileType || 'siparis-formu';
    const folderName = 'Sipariş Formu Klasörü';
    const safeCustomerName = getSafeFolderName(customerName);
    const fileName = req.file.filename;
    
    // Check if file was saved to wrong directory (Bilinmeyen)
    // If so, move it to correct directory
    const currentPath = req.file.path;
    const correctDir = path.join(SIPARIS_FORMU_BASE_DIR, safeCustomerName);
    const correctPath = path.join(correctDir, fileName);
    
    // If file is in wrong location, move it
    if (currentPath !== correctPath && currentPath.includes('Bilinmeyen')) {
      console.log(`Moving file from ${currentPath} to ${correctPath}`);
      
      // Ensure correct directory exists
      if (!fs.existsSync(correctDir)) {
        fs.mkdirSync(correctDir, { recursive: true });
      }
      
      // Move file
      if (fs.existsSync(currentPath)) {
        fs.renameSync(currentPath, correctPath);
        console.log('File moved successfully to:', correctPath);
      }
      
      // Update req.file.path for response
      req.file.path = correctPath;
    }
    
    // URL format: /api/files/{folder}/{customer}/{filename}
    const fileUrl = `/api/files/${encodeURIComponent(folderName)}/${encodeURIComponent(safeCustomerName)}/${encodeURIComponent(fileName)}`;
    
    res.json({
      success: true,
      filePath: req.file.path,
      fileUrl: fileUrl,
      fileName: fileName,
      customerName: customerName,
      message: 'Sipariş Formu PDF başarıyla yüklendi'
    });
  } catch (error) {
    console.error('Error uploading Sipariş Formu:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve uploaded files - must be last route (wildcard route)
// This route handles paths like: /api/files/Proforma%20Klasörü/CustomerName/filename.pdf
router.get('*', (req, res) => {
  try {
    // Remove /api/files prefix from the request path
    let filePath = req.path;
    if (filePath.startsWith('/api/files')) {
      filePath = filePath.replace(/^\/api\/files\/?/, '');
    }
    // Also handle direct access
    if (filePath.startsWith('/')) {
      filePath = filePath.substring(1);
    }
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    // Decode URI components
    const decodedPath = decodeURIComponent(filePath);
    const pathParts = decodedPath.split('/').filter(p => p); // Remove empty parts
    
    // Security: only allow access to specific folders
    const allowedFolders = ['Proforma Klasörü', 'Sipariş Formu Klasörü', 'Fatura Evrakları Klasörü'];
    if (pathParts.length < 2 || !allowedFolders.includes(pathParts[0])) {
      return res.status(403).json({ error: 'Unauthorized folder access. Path: ' + decodedPath });
    }
    
    const fullPath = path.join(__dirname, '../../files', ...pathParts);
    const resolvedPath = path.resolve(fullPath);
    const filesDir = path.resolve(path.join(__dirname, '../../files'));
    
    // Security check: ensure file is within files directory
    if (!resolvedPath.startsWith(filesDir)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({ error: 'File not found: ' + resolvedPath });
    }
    
    // Check if it's a file (not a directory)
    const stats = fs.statSync(resolvedPath);
    if (!stats.isFile()) {
      return res.status(403).json({ error: 'Path is not a file' });
    }
    
    // Set content type for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(resolvedPath)}"`);
    res.sendFile(resolvedPath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

