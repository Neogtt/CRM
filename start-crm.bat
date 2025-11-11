@echo off
chcp 65001 >nul
echo ========================================
echo    LocalCRM Başlatılıyor...
echo ========================================
echo.

REM Node.js kontrolü
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Node.js bulunamadı!
    echo Lütfen Node.js'i yükleyin: https://nodejs.org/
    pause
    exit /b 1
)

REM npm kontrolü
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] npm bulunamadı!
    echo Lütfen Node.js'i yükleyin: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js ve npm bulundu
echo.

REM .env dosyası kontrolü
if not exist .env (
    echo [UYARI] .env dosyası bulunamadı!
    echo Varsayılan .env dosyası oluşturuluyor...
    (
        echo PORT=3001
        echo NODE_ENV=development
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_USER=your-email@gmail.com
        echo SMTP_PASS=your-app-password
        echo REACT_APP_API_URL=http://localhost:3001/api
    ) > .env
    echo [OK] .env dosyası oluşturuldu
    echo.
)

REM temp klasörü kontrolü
if not exist temp (
    echo [UYARI] temp klasörü bulunamadı! Oluşturuluyor...
    mkdir temp
    echo [OK] temp klasörü oluşturuldu
    echo.
)

REM node_modules kontrolü
if not exist node_modules (
    echo [UYARI] node_modules bulunamadı!
    echo Bağımlılıklar yükleniyor...
    call npm install
    if %errorlevel% neq 0 (
        echo [HATA] Bağımlılıklar yüklenirken hata oluştu!
        pause
        exit /b 1
    )
    echo [OK] Bağımlılıklar yüklendi
    echo.
)

REM client/node_modules kontrolü
if not exist client\node_modules (
    echo [UYARI] client/node_modules bulunamadı!
    echo Client bağımlılıkları yükleniyor...
    cd client
    call npm install
    if %errorlevel% neq 0 (
        echo [HATA] Client bağımlılıkları yüklenirken hata oluştu!
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Client bağımlılıkları yüklendi
    echo.
)

REM Client build kontrolü
if not exist client\build (
    echo [UYARI] Client build bulunamadı!
    echo Client build ediliyor...
    cd client
    call npm run build
    if %errorlevel% neq 0 (
        echo [HATA] Client build edilirken hata oluştu!
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Client build edildi
    echo.
)

echo ========================================
echo    Server Başlatılıyor...
echo ========================================
echo.
echo Server: http://localhost:3001
echo Uygulama: http://localhost:3001
echo.
echo Durdurmak için Ctrl+C tuşlarına basın
echo.

REM Server'ı başlat
node server/index.js

pause

