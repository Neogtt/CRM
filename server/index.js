const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from React app
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  console.log('Serving static files from:', buildPath);
} else {
  console.warn('Warning: Build folder not found at:', buildPath);
  console.warn('Make sure to run "npm run build" in the client directory');
}

// Import routes
const customerRoutes = require('./routes/customers');
const quoteRoutes = require('./routes/quotes');
const proformaRoutes = require('./routes/proformas');
const invoiceRoutes = require('./routes/invoices');
const orderRoutes = require('./routes/orders');
const etaRoutes = require('./routes/eta');
const fairRoutes = require('./routes/fairs');
const analyticsRoutes = require('./routes/analytics');
const emailRoutes = require('./routes/email');
const driveRoutes = require('./routes/drive');
const sheetsRoutes = require('./routes/sheets');
const interactionsRoutes = require('./routes/interactions');
const excelRoutes = require('./routes/excel');
const filesRoutes = require('./routes/files');
const contentArchiveRoutes = require('./routes/contentArchive');
const goalsRoutes = require('./routes/goals');
const holidayGreetingsRoutes = require('./routes/holidayGreetings');
const representativesRoutes = require('./routes/representatives');
const authRoutes = require('./routes/auth');
const menusRoutes = require('./routes/menus');
const cleanupRoutes = require('./routes/cleanup');
const migrationRoutes = require('./routes/migration');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menus', menusRoutes);
app.use('/api/cleanup', cleanupRoutes);
app.use('/api/migration', migrationRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/proformas', proformaRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/eta', etaRoutes);
app.use('/api/fairs', fairRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/drive', driveRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/content-archive', contentArchiveRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/holiday-greetings', holidayGreetingsRoutes);
app.use('/api/representatives', representativesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EXPO CRM API is running' });
});

// Serve React app
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../client/build', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).json({
      error: 'Frontend build not found',
      message: 'Please run "npm run build" in the client directory',
      path: indexPath
    });
  }
});

// Error handling middleware - must be after all routes
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Sunucu hatası',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Initialize Excel sync service
const excelSyncService = require('./services/excelSyncService');

// Start server and initialize sync
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize Excel sync on startup
  try {
    const syncService = excelSyncService.getInstance();
    console.log('Initializing Excel file synchronization...');
    
    // Sync on startup (compare and load the newer file)
    await syncService.syncOnStartup();
    
    // Start periodic sync (every 10 minutes) - only if Drive is accessible
    await syncService.startPeriodicSync();
    
    console.log('Excel sync service initialized successfully');
  } catch (error) {
    console.error('Error initializing Excel sync service:', error.message || error);
    console.warn('Continuing without sync service. Local file will be used.');
  }
});

