@echo off
chcp 65001 >nul
echo ========================================
echo    EXPO CRM Installer Oluşturuluyor...
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

echo [OK] Node.js bulundu
node --version
npm --version
echo.

REM Bağımlılıkları kontrol et
if not exist node_modules (
    echo [INFO] Server bağımlılıkları yükleniyor...
    call npm install
    if %errorlevel% neq 0 (
        echo [HATA] Server bağımlılıkları yüklenirken hata oluştu!
        pause
        exit /b 1
    )
) else (
    echo [INFO] Server bağımlılıkları zaten mevcut
)

if not exist client\node_modules (
    echo [INFO] Client bağımlılıkları yükleniyor...
    cd client
    call npm install
    if %errorlevel% neq 0 (
        echo [HATA] Client bağımlılıkları yüklenirken hata oluştu!
        cd ..
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [INFO] Client bağımlılıkları zaten mevcut
)

echo.
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

echo [INFO] Windows installer oluşturuluyor...
echo Bu işlem birkaç dakika sürebilir...
echo.

call npm run build:win
if %errorlevel% neq 0 (
    echo [HATA] Installer oluşturulurken hata oluştu!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Installer Başarıyla Oluşturuldu!
echo ========================================
echo.
echo Installer dosyası: dist\expocrmsetup-*.exe
echo.
echo Dosyayı bulmak için dist klasörünü kontrol edin.
echo.
pause

