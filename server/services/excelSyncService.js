const fs = require('fs');
const path = require('path');
const { getInstance } = require('./googleDrive');
const dataService = require('./dataService');

class ExcelSyncService {
  constructor() {
    // Google Drive file ID - environment variable'dan al veya default kullan
    this.driveFileId = process.env.GOOGLE_DRIVE_EXCEL_FILE_ID || '1Hu83--tLsRw_vzaQP5zez-5ctHYILDnG';
    this.localExcelPath = path.join(__dirname, '../../temp/local.xlsx');
    this.syncInterval = null; // 10 dakika = 600000 ms
    this.isSyncing = false;
    this.lastLocalModification = null;
  }

  /**
   * Local dosyanın son değiştirilme tarihini al
   */
  getLocalFileModificationTime() {
    try {
      if (!fs.existsSync(this.localExcelPath)) {
        return null;
      }
      const stats = fs.statSync(this.localExcelPath);
      return stats.mtime;
    } catch (error) {
      console.error('Error getting local file modification time:', error);
      return null;
    }
  }

  /**
   * Drive'daki dosyanın son değiştirilme tarihini al
   */
  async getDriveFileModificationTime() {
    try {
      let driveService;
      try {
        driveService = getInstance();
      } catch (error) {
        // Google credentials yoksa veya Drive servisi başlatılamıyorsa
        if (error.message && (error.message.includes('credentials') || error.message.includes('not available'))) {
          console.warn('Google Drive service not available. Sync service will use local file only.');
          return null;
        }
        throw error;
      }
      
      const fileInfo = await driveService.getFile(this.driveFileId);
      
      if (fileInfo && fileInfo.modifiedTime) {
        return new Date(fileInfo.modifiedTime);
      }
      return null;
    } catch (error) {
      // Google credentials yoksa veya Drive erişilemiyorsa sessizce null döndür
      if (error.message && (error.message.includes('credentials') || error.message.includes('not available'))) {
        console.warn('Google Drive credentials not found. Sync service will use local file only.');
        return null;
      }
      console.error('Error getting drive file modification time:', error.message || error);
      return null;
    }
  }

  /**
   * Drive'dan Excel dosyasını indir ve local'e kaydet
   */
  async downloadFromDrive() {
    try {
      console.log('Downloading Excel file from Google Drive...');
      let driveService;
      try {
        driveService = getInstance();
      } catch (error) {
        if (error.message && (error.message.includes('credentials') || error.message.includes('not available'))) {
          throw new Error('Google Drive credentials not configured. Cannot download from Drive.');
        }
        throw error;
      }
      
      // Ensure temp directory exists
      const tempDir = path.dirname(this.localExcelPath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Download file
      await driveService.downloadFile(this.driveFileId, this.localExcelPath);
      
      // Update last modification time
      this.lastLocalModification = this.getLocalFileModificationTime();
      
      console.log('Excel file downloaded successfully from Drive');
      return true;
    } catch (error) {
      if (error.message && (error.message.includes('credentials') || error.message.includes('not available'))) {
        throw new Error('Google Drive credentials not configured. Cannot download from Drive.');
      }
      console.error('Error downloading file from Drive:', error.message || error);
      throw error;
    }
  }

  /**
   * Local Excel dosyasını Drive'a yükle
   */
  async uploadToDrive() {
    try {
      if (!fs.existsSync(this.localExcelPath)) {
        console.warn('Local Excel file does not exist, skipping upload');
        return false;
      }

      console.log('Uploading Excel file to Google Drive...');
      let driveService;
      try {
        driveService = getInstance();
      } catch (error) {
        if (error.message && (error.message.includes('credentials') || error.message.includes('not available'))) {
          throw new Error('Google Drive credentials not configured. Cannot upload to Drive.');
        }
        throw error;
      }
      
      // Update file on Drive
      await driveService.updateFile(this.driveFileId, this.localExcelPath, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Update last modification time
      this.lastLocalModification = this.getLocalFileModificationTime();
      
      console.log('Excel file uploaded successfully to Drive');
      return true;
    } catch (error) {
      if (error.message && (error.message.includes('credentials') || error.message.includes('not available'))) {
        throw new Error('Google Drive credentials not configured. Cannot upload to Drive.');
      }
      console.error('Error uploading file to Drive:', error.message || error);
      throw error;
    }
  }

  /**
   * Local ve Drive dosyalarını karşılaştır ve güncel olanı yükle
   */
  async syncOnStartup() {
    try {
      if (this.isSyncing) {
        console.log('Sync already in progress, skipping...');
        return;
      }

      this.isSyncing = true;
      console.log('Starting Excel file synchronization on startup...');

      const localModTime = this.getLocalFileModificationTime();
      let driveModTime = null;
      
      // Drive erişimini kontrol et
      try {
        driveModTime = await this.getDriveFileModificationTime();
      } catch (error) {
        // Google credentials yoksa veya Drive erişilemiyorsa, sadece local kullan
        if (error.message && error.message.includes('credentials')) {
          console.warn('Google Drive credentials not configured. Using local file only.');
          if (localModTime) {
            this.lastLocalModification = localModTime;
          }
          this.isSyncing = false;
          return;
        }
        throw error;
      }

      // Eğer local dosya yoksa, drive'dan indir
      if (!localModTime) {
        if (driveModTime) {
          console.log('Local Excel file not found, downloading from Drive...');
          try {
            await this.downloadFromDrive();
          } catch (error) {
            console.warn('Could not download from Drive, will use local file when available:', error.message);
          }
        } else {
          console.log('Neither local nor Drive file found. Will create local file when data is saved.');
        }
        this.isSyncing = false;
        return;
      }

      // Eğer drive dosyası yoksa veya erişilemiyorsa, local'i kullan
      if (!driveModTime) {
        console.log('Drive file not accessible, using local file only...');
        this.lastLocalModification = localModTime;
        this.isSyncing = false;
        return;
      }

      // Tarihleri karşılaştır (milisaniye cinsinden)
      const localTime = localModTime.getTime();
      const driveTime = driveModTime.getTime();
      const timeDiff = Math.abs(localTime - driveTime);

      // 1 saniyeden az fark varsa, dosyalar aynı kabul edilir
      if (timeDiff < 1000) {
        console.log('Local and Drive files are in sync');
        this.lastLocalModification = localModTime;
        this.isSyncing = false;
        return;
      }

      // Hangisi daha yeni?
      if (driveTime > localTime) {
        console.log('Drive file is newer, downloading from Drive...');
        console.log(`Drive: ${driveModTime.toISOString()}, Local: ${localModTime.toISOString()}`);
        try {
          await this.downloadFromDrive();
        } catch (error) {
          console.warn('Could not download from Drive, keeping local file:', error.message);
        }
      } else {
        console.log('Local file is newer, uploading to Drive...');
        console.log(`Local: ${localModTime.toISOString()}, Drive: ${driveModTime.toISOString()}`);
        try {
          await this.uploadToDrive();
        } catch (error) {
          console.warn('Could not upload to Drive, keeping local file:', error.message);
        }
      }

      this.isSyncing = false;
      console.log('Excel file synchronization completed');
    } catch (error) {
      console.error('Error during startup sync:', error.message || error);
      this.isSyncing = false;
      // Hata durumunda local dosyayı kullanmaya devam et
      const localModTime = this.getLocalFileModificationTime();
      if (localModTime) {
        this.lastLocalModification = localModTime;
      }
    }
  }

  /**
   * Local dosyada değişiklik olup olmadığını kontrol et
   */
  hasLocalFileChanged() {
    try {
      const currentModTime = this.getLocalFileModificationTime();
      if (!currentModTime || !this.lastLocalModification) {
        return false;
      }
      
      // Son sync'ten sonra değişiklik var mı?
      return currentModTime.getTime() > this.lastLocalModification.getTime();
    } catch (error) {
      console.error('Error checking local file changes:', error);
      return false;
    }
  }

  /**
   * Periyodik olarak local değişiklikleri Drive'a yükle
   */
  async syncToDrivePeriodically() {
    try {
      if (this.isSyncing) {
        console.log('Sync already in progress, skipping periodic sync...');
        return;
      }

      // Local dosyada değişiklik var mı?
      if (!this.hasLocalFileChanged()) {
        console.log('No local changes detected, skipping periodic sync');
        return;
      }

      console.log('Local file has changed, uploading to Drive...');
      this.isSyncing = true;
      
      try {
        await this.uploadToDrive();
        console.log('Periodic sync to Drive completed');
      } catch (error) {
        // Google credentials yoksa veya Drive erişilemiyorsa, sessizce devam et
        if (error.message && error.message.includes('credentials')) {
          console.warn('Google Drive credentials not configured. Skipping periodic sync.');
        } else {
          console.error('Error during periodic sync to Drive:', error.message || error);
        }
      } finally {
        this.isSyncing = false;
      }
    } catch (error) {
      console.error('Error during periodic sync to Drive:', error.message || error);
      this.isSyncing = false;
    }
  }

  /**
   * Otomatik senkronizasyonu başlat
   */
  async startPeriodicSync() {
    // Önce Drive erişimini kontrol et
    try {
      await this.getDriveFileModificationTime();
      // Eğer başarılıysa, periyodik sync'i başlat
    } catch (error) {
      if (error.message && error.message.includes('credentials')) {
        console.warn('Google Drive credentials not configured. Periodic sync will not start.');
        return;
      }
      // Diğer hatalar için yine de başlat (belki geçici bir sorundur)
    }

    // Her 10 dakikada bir (600000 ms) local değişiklikleri drive'a yükle
    const SYNC_INTERVAL = 10 * 60 * 1000; // 10 dakika

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncToDrivePeriodically();
    }, SYNC_INTERVAL);

    console.log(`Periodic sync started: every ${SYNC_INTERVAL / 1000 / 60} minutes`);
  }

  /**
   * Otomatik senkronizasyonu durdur
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic sync stopped');
    }
  }

  /**
   * Manuel senkronizasyon (API endpoint için)
   */
  async manualSync() {
    try {
      if (this.isSyncing) {
        return { success: false, message: 'Sync already in progress' };
      }

      this.isSyncing = true;
      
      const localModTime = this.getLocalFileModificationTime();
      let driveModTime = null;
      
      try {
        driveModTime = await this.getDriveFileModificationTime();
      } catch (error) {
        if (error.message && error.message.includes('credentials')) {
          this.isSyncing = false;
          return { 
            success: false, 
            message: 'Google Drive credentials not configured. Please set GOOGLE_APPLICATION_CREDENTIALS environment variable.' 
          };
        }
        throw error;
      }

      if (!localModTime && !driveModTime) {
        this.isSyncing = false;
        return { success: false, message: 'No files found' };
      }

      if (!localModTime) {
        try {
          await this.downloadFromDrive();
          this.isSyncing = false;
          return { success: true, message: 'Downloaded from Drive', action: 'download' };
        } catch (error) {
          this.isSyncing = false;
          return { success: false, message: error.message || 'Could not download from Drive' };
        }
      }

      if (!driveModTime) {
        try {
          await this.uploadToDrive();
          this.isSyncing = false;
          return { success: true, message: 'Uploaded to Drive', action: 'upload' };
        } catch (error) {
          this.isSyncing = false;
          return { success: false, message: error.message || 'Could not upload to Drive' };
        }
      }

      const localTime = localModTime.getTime();
      const driveTime = driveModTime.getTime();

      if (Math.abs(localTime - driveTime) < 1000) {
        this.isSyncing = false;
        return { success: true, message: 'Files are in sync', action: 'none' };
      }

      if (driveTime > localTime) {
        try {
          await this.downloadFromDrive();
          this.isSyncing = false;
          return { success: true, message: 'Downloaded from Drive', action: 'download' };
        } catch (error) {
          this.isSyncing = false;
          return { success: false, message: error.message || 'Could not download from Drive' };
        }
      } else {
        try {
          await this.uploadToDrive();
          this.isSyncing = false;
          return { success: true, message: 'Uploaded to Drive', action: 'upload' };
        } catch (error) {
          this.isSyncing = false;
          return { success: false, message: error.message || 'Could not upload to Drive' };
        }
      }
    } catch (error) {
      this.isSyncing = false;
      return { success: false, message: error.message || 'Sync failed' };
    }
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new ExcelSyncService();
    }
    return instance;
  },
};

