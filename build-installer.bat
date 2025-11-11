@echo off
echo ========================================
echo LocalCRM Windows Installer Builder
echo ========================================
echo.

echo [1/5] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    pause
    exit /b 1
)

echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo [3/5] Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install client dependencies!
    pause
    exit /b 1
)
cd ..

echo [4/5] Building client...
cd client
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build client!
    pause
    exit /b 1
)
cd ..

echo [5/5] Building Windows installer...
call npm run build:win
if %errorlevel% neq 0 (
    echo ERROR: Failed to build installer!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Installer built successfully!
echo Check the 'dist' folder for the installer
echo ========================================
pause

