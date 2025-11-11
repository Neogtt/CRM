const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.auth = null;
    this.drive = null;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (!credentialsPath || !fs.existsSync(credentialsPath)) {
        throw new Error('Google credentials file not found. Please set GOOGLE_APPLICATION_CREDENTIALS environment variable.');
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
        ],
      });

      const authClient = await this.auth.getClient();
      this.drive = google.drive({ version: 'v3', auth: authClient });
      
      console.log('Google Drive service initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Drive service:', error);
      throw error;
    }
  }

  async getFile(fileId) {
    try {
      if (!this.drive) {
        await this.initializeAuth();
      }

      const response = await this.drive.files.get({
        fileId,
        supportsAllDrives: true,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink',
      });

      return response.data;
    } catch (error) {
      // Re-throw with original error message
      const errorMsg = error.message || 'Error getting file';
      console.error('Error getting file:', errorMsg);
      throw new Error(errorMsg);
    }
  }

  async downloadFile(fileId, destinationPath) {
    try {
      if (!this.drive) {
        await this.initializeAuth();
      }

      const response = await this.drive.files.get(
        {
          fileId,
          alt: 'media',
          supportsAllDrives: true,
        },
        { responseType: 'stream' }
      );

      const dest = fs.createWriteStream(destinationPath);
      response.data.pipe(dest);

      return new Promise((resolve, reject) => {
        dest.on('finish', resolve);
        dest.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  async uploadFile(filePath, fileName, folderId = null, mimeType = null) {
    try {
      if (!this.drive) {
        await this.initializeAuth();
      }

      const fileMetadata = {
        name: fileName,
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const media = {
        mimeType: mimeType || 'application/octet-stream',
        body: fs.createReadStream(filePath),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        supportsAllDrives: true,
        fields: 'id, name, webViewLink',
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async updateFile(fileId, filePath, mimeType = null) {
    try {
      if (!this.drive) {
        await this.initializeAuth();
      }

      const media = {
        mimeType: mimeType || 'application/octet-stream',
        body: fs.createReadStream(filePath),
      };

      const response = await this.drive.files.update({
        fileId,
        media,
        supportsAllDrives: true,
        fields: 'id, name, webViewLink',
      });

      return response.data;
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  }

  async listFiles(folderId, query = '') {
    try {
      if (!this.drive) {
        await this.initializeAuth();
      }

      let q = `'${folderId}' in parents and trashed=false`;
      if (query) {
        q += ` and ${query}`;
      }

      const response = await this.drive.files.list({
        q,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async createFolder(folderName, parentId = null) {
    try {
      if (!this.drive) {
        await this.initializeAuth();
      }

      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        supportsAllDrives: true,
        fields: 'id, name',
      });

      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async getOrCreateFolder(folderName, parentId) {
    try {
      const files = await this.listFiles(parentId, `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`);
      
      if (files.length > 0) {
        return files[0];
      }

      return await this.createFolder(folderName, parentId);
    } catch (error) {
      console.error('Error getting or creating folder:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      if (!this.drive) {
        await this.initializeAuth();
      }

      await this.drive.files.delete({
        fileId,
        supportsAllDrives: true,
      });

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  driveSafeName(text, maxlen = 120) {
    // Remove invalid characters for file names
    let safe = text.replace(/[<>:"/\\|?*]/g, '_');
    if (safe.length > maxlen) {
      safe = safe.substring(0, maxlen);
    }
    return safe.trim();
  }
}

// Lazy initialization - only create instance when needed
let instance = null;

module.exports = {
  // Get service instance (lazy initialization)
  getInstance: () => {
    if (!instance) {
      try {
        instance = new GoogleDriveService();
      } catch (error) {
        console.warn('Google Drive service not available:', error.message);
        // Return a mock object with error methods that throw the original error
        const originalError = error;
        instance = {
          initializeAuth: async () => { throw originalError; },
          getFile: async () => { throw originalError; },
          downloadFile: async () => { throw originalError; },
          uploadFile: async () => { throw originalError; },
          updateFile: async () => { throw originalError; },
        };
      }
    }
    return instance;
  },
  // Direct method exports for backward compatibility
  downloadFile: async (...args) => module.exports.getInstance().downloadFile(...args),
  uploadFile: async (...args) => module.exports.getInstance().uploadFile(...args),
  updateFile: async (...args) => module.exports.getInstance().updateFile(...args),
};

