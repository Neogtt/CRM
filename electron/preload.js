const { contextBridge } = require('electron');

// Preload script - güvenlik için
contextBridge.exposeInMainWorld('electron', {
  // Gerekirse buraya API'ler eklenebilir
});

