const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
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
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive',
        ],
      });

      const authClient = await this.auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      
      console.log('Google Sheets service initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Sheets service:', error);
      throw error;
    }
  }

  async readSheet(spreadsheetId, range) {
    try {
      if (!this.sheets) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      return response.data.values || [];
    } catch (error) {
      console.error('Error reading sheet:', error);
      throw error;
    }
  }

  async writeSheet(spreadsheetId, range, values) {
    try {
      if (!this.sheets) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        resource: { values },
      });

      return response.data;
    } catch (error) {
      console.error('Error writing to sheet:', error);
      throw error;
    }
  }

  async appendSheet(spreadsheetId, range, values) {
    try {
      if (!this.sheets) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values },
      });

      return response.data;
    } catch (error) {
      console.error('Error appending to sheet:', error);
      throw error;
    }
  }

  async getSheetInfo(spreadsheetId) {
    try {
      if (!this.sheets) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      return response.data;
    } catch (error) {
      console.error('Error getting sheet info:', error);
      throw error;
    }
  }

  async clearSheet(spreadsheetId, range) {
    try {
      if (!this.sheets) {
        await this.initializeAuth();
      }

      const response = await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
      });

      return response.data;
    } catch (error) {
      console.error('Error clearing sheet:', error);
      throw error;
    }
  }

  // Helper function to convert array of arrays to objects
  arraysToObjects(arrays, headers) {
    if (!arrays || arrays.length === 0) return [];
    
    const headerRow = headers || arrays[0];
    const dataRows = headers ? arrays : arrays.slice(1);
    
    return dataRows.map(row => {
      const obj = {};
      headerRow.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  }

  // Helper function to convert objects to array of arrays
  objectsToArrays(objects, headers) {
    if (!objects || objects.length === 0) return [headers];
    
    return [
      headers,
      ...objects.map(obj => headers.map(header => obj[header] || ''))
    ];
  }
}

// Lazy initialization - only create instance when needed
let instance = null;

module.exports = {
  // Get service instance (lazy initialization)
  getInstance: () => {
    if (!instance) {
      try {
        instance = new GoogleSheetsService();
      } catch (error) {
        console.warn('Google Sheets service not available:', error.message);
        // Return a mock object with error methods
        instance = {
          initializeAuth: async () => { throw error; },
          readSheet: async () => { throw error; },
          writeSheet: async () => { throw error; },
          clearSheet: async () => { throw error; },
          objectsToArrays: () => [],
        };
      }
    }
    return instance;
  },
  // Direct method exports for backward compatibility
  readSheet: async (...args) => module.exports.getInstance().readSheet(...args),
  writeSheet: async (...args) => module.exports.getInstance().writeSheet(...args),
  clearSheet: async (...args) => module.exports.getInstance().clearSheet(...args),
  objectsToArrays: (...args) => module.exports.getInstance().objectsToArrays(...args),
};

