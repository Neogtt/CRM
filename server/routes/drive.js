const express = require('express');
const router = express.Router();
const googleDrive = require('../services/googleDrive');

// Get file info
router.get('/file/:fileId', async (req, res) => {
  try {
    const file = await googleDrive.getFile(req.params.fileId);
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List files in folder
router.get('/folder/:folderId', async (req, res) => {
  try {
    const { query } = req.query;
    const files = await googleDrive.listFiles(req.params.folderId, query);
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create folder
router.post('/folder', async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const folder = await googleDrive.createFolder(name, parentId);
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get or create folder
router.post('/folder/get-or-create', async (req, res) => {
  try {
    const { name, parentId } = req.body;
    const folder = await googleDrive.getOrCreateFolder(name, parentId);
    res.json(folder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload file
router.post('/upload', async (req, res) => {
  try {
    // This would typically use multer for file upload
    // For now, we'll return a placeholder
    res.json({ message: 'File upload endpoint - implement with multer' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

