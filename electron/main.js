const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

let mainWindow;
let serverProcess;
let clientProcess;

// Server ve client process'lerini başlat
function startServer() {
  // Production'da app.getAppPath() kullan, development'ta __dirname
  const appPath = app.isPackaged 
    ? path.dirname(process.execPath)
    : path.join(__dirname, '../..');
  
  const serverPath = path.join(appPath, 'server/index.js');
  const tempDir = path.join(appPath, 'temp');
  const envPath = path.join(appPath, '.env');
  
  // Temp klasörünü oluştur
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // .env dosyasını oluştur (yoksa)
  if (!fs.existsSync(envPath)) {
    const defaultEnv = `PORT=3001
NODE_ENV=production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
REACT_APP_API_URL=http://localhost:3001/api
`;
    fs.writeFileSync(envPath, defaultEnv, 'utf8');
  }
  
  serverProcess = spawn('node', [serverPath], {
    cwd: appPath,
    env: { 
      ...process.env, 
      PORT: 3001, 
      NODE_ENV: 'production',
      PATH: process.env.PATH
    },
    stdio: 'pipe'
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

// Ana pencereyi oluştur
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false
  });

  // Server başladıktan sonra client'ı yükle
  const checkServer = setInterval(() => {
    const req = http.get('http://localhost:3001/api/health', (res) => {
      if (res.statusCode === 200) {
        clearInterval(checkServer);
        mainWindow.loadURL('http://localhost:3001');
        mainWindow.show();
      }
    });
    req.on('error', () => {
      // Server henüz hazır değil, beklemeye devam et
    });
    req.setTimeout(1000, () => {
      req.destroy();
    });
  }, 1000);
  
  // 30 saniye sonra timeout
  setTimeout(() => {
    clearInterval(checkServer);
    if (!mainWindow.isVisible()) {
      dialog.showErrorBox('Hata', 'Server başlatılamadı. Lütfen Node.js\'in yüklü olduğundan emin olun.');
      app.quit();
    }
  }, 30000);

  // Dev tools'u aç (production'da kapatılabilir)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Server hata durumunda kullanıcıyı bilgilendir
  mainWindow.webContents.on('did-fail-load', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Bağlantı Hatası',
      message: 'Server başlatılamadı. Lütfen tekrar deneyin.',
      buttons: ['Tamam']
    });
  });
}

// Uygulama hazır olduğunda
app.whenReady().then(() => {
  // Server'ı başlat
  startServer();

  // Pencereyi oluştur
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Tüm pencereler kapatıldığında
app.on('window-all-closed', () => {
  // Server process'ini sonlandır
  if (serverProcess) {
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Uygulama kapanmadan önce
app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// Hata yakalama
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (mainWindow) {
    dialog.showErrorBox('Hata', error.message);
  }
});

