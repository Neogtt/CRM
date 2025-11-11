const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Base directories for content archive
const CONTENT_ARCHIVE_BASE_DIR = path.join(__dirname, '../../files/İçerik Arşivi');
const KALITE_DIR = path.join(CONTENT_ARCHIVE_BASE_DIR, 'Kalite');
const URUN_RESIMLERI_DIR = path.join(CONTENT_ARCHIVE_BASE_DIR, 'Ürün Resimleri');
const MEDYA_DIR = path.join(CONTENT_ARCHIVE_BASE_DIR, 'Medya');

// Ensure directories exist
[CONTENT_ARCHIVE_BASE_DIR, KALITE_DIR, URUN_RESIMLERI_DIR, MEDYA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Folder mapping
const FOLDER_MAP = {
  'kalite': KALITE_DIR,
  'ürün-resimleri': URUN_RESIMLERI_DIR,
  'medya': MEDYA_DIR,
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderType = req.body.folderType || 'kalite';
    const folderPath = FOLDER_MAP[folderType] || KALITE_DIR;
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${safeName}_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Get folder structure
router.get('/folders', (req, res) => {
  try {
    const folders = [
      {
        id: 'kalite',
        name: 'Kalite',
        path: KALITE_DIR,
      },
      {
        id: 'ürün-resimleri',
        name: 'Ürün Resimleri',
        path: URUN_RESIMLERI_DIR,
      },
      {
        id: 'medya',
        name: 'Medya',
        path: MEDYA_DIR,
      },
    ];
    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get files in a folder
router.get('/files/:folderType', (req, res) => {
  try {
    const folderType = req.params.folderType;
    const folderPath = FOLDER_MAP[folderType];
    
    if (!folderPath) {
      return res.status(400).json({ error: 'Invalid folder type' });
    }
    
    if (!fs.existsSync(folderPath)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(folderPath, { withFileTypes: true })
      .filter(dirent => dirent.isFile())
      .map(dirent => {
        const filePath = path.join(folderPath, dirent.name);
        const stats = fs.statSync(filePath);
        return {
          name: dirent.name,
          size: stats.size,
          modified: stats.mtime,
          type: path.extname(dirent.name).toLowerCase(),
        };
      })
      .sort((a, b) => b.modified - a.modified); // Sort by modified date, newest first
    
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    res.json({
      success: true,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      folderType: req.body.folderType,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete file
router.delete('/files/:folderType/:filename', (req, res) => {
  try {
    const folderType = req.params.folderType;
    const filename = req.params.filename;
    const folderPath = FOLDER_MAP[folderType];
    
    if (!folderPath) {
      return res.status(400).json({ error: 'Invalid folder type' });
    }
    
    const filePath = path.join(folderPath, filename);
    
    // Security check: ensure file is within the folder
    if (!filePath.startsWith(folderPath)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve file
router.get('/files/:folderType/:filename', (req, res) => {
  try {
    const folderType = req.params.folderType;
    const filename = decodeURIComponent(req.params.filename);
    const folderPath = FOLDER_MAP[folderType];
    
    if (!folderPath) {
      return res.status(400).json({ error: 'Invalid folder type' });
    }
    
    const filePath = path.join(folderPath, filename);
    
    // Security check: ensure file is within the folder (prevent directory traversal)
    const resolvedPath = path.resolve(filePath);
    const resolvedFolder = path.resolve(folderPath);
    if (!resolvedPath.startsWith(resolvedFolder)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

