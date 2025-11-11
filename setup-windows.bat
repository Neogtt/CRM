@echo off
chcp 65001 >nul
echo ========================================
echo    LocalCRM Windows Kurulumu
echo ========================================
echo.

REM Node.js kontrolü
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] Node.js bulunamadı!
    echo.
    echo Lütfen Node.js v18.0.0 veya üzeri sürümü yükleyin:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM npm kontrolü
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [HATA] npm bulunamadı!
    echo.
    echo Lütfen Node.js v18.0.0 veya üzeri sürümü yükleyin:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js ve npm bulundu
node --version
npm --version
echo.

REM .env dosyası oluştur
if not exist .env (
    echo [INFO] .env dosyası oluşturuluyor...
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
) else (
    echo [INFO] .env dosyası zaten mevcut
    echo.
)

REM temp klasörü oluştur
if not exist temp (
    echo [INFO] temp klasörü oluşturuluyor...
    mkdir temp
    echo [OK] temp klasörü oluşturuldu
    echo.
) else (
    echo [INFO] temp klasörü zaten mevcut
    echo.
)

REM Server bağımlılıklarını yükle
echo [INFO] Server bağımlılıkları yükleniyor...
if exist node_modules (
    echo [INFO] node_modules zaten mevcut, atlanıyor...
) else (
    call npm install
    if %errorlevel% neq 0 (
        echo [HATA] Server bağımlılıkları yüklenirken hata oluştu!
        pause
        exit /b 1
    )
    echo [OK] Server bağımlılıkları yüklendi
)
echo.

REM Client bağımlılıklarını yükle
echo [INFO] Client bağımlılıkları yükleniyor...
if exist client\node_modules (
    echo [INFO] client/node_modules zaten mevcut, atlanıyor...
) else (
    cd client
    call npm install
    if %errorlevel% neq 0 (
        echo [HATA] Client bağımlılıkları yüklenirken hata oluştu!
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo [OK] Client bağımlılıkları yüklendi
)
echo.

REM Client build
echo [INFO] Client build ediliyor...
cd client
call npm run build
if %errorlevel% neq 0 (
    echo [HATA] Client build edilirken hata oluştu!
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Client build edildi
echo.

echo ========================================
echo    Kurulum Tamamlandı!
echo ========================================
echo.
echo Uygulamayı başlatmak için:
echo   start-crm.bat dosyasına çift tıklayın
echo.
echo Veya manuel olarak:
echo   npm start
echo.
echo Tarayıcıda açın:
echo   http://localhost:3001
echo.
pause

