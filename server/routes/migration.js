const express = require('express');
const router = express.Router();
const ExcelToSQLiteMigrator = require('../services/migrateExcelToSQLite');

// Excel'den SQLite'a migration endpoint'i
router.post('/excel-to-sqlite', async (req, res) => {
  try {
    const migrator = new ExcelToSQLiteMigrator();
    const result = await migrator.migrate();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Migration başarılı! ${result.migratedCount || 0} kayıt migrate edildi.`,
        migratedCount: result.migratedCount || 0
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Migration başarısız'
      });
    }
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Migration sırasında hata oluştu'
    });
  }
});

module.exports = router;

