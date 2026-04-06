@echo off
REM MYCHAT Frontend Build & Deploy Setup Script
REM This script sets up Node.js, installs dependencies, and builds the project

echo.
echo ========================================
echo MYCHAT Frontend Setup & Build
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from https://nodejs.org/
    echo 1. Download Node.js LTS (18+ recommended)
    echo 2. Run the installer
    echo 3. Restart your terminal
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is installed: 
node --version
npm --version
echo.

REM Navigate to frontend directory
cd /d "%~dp0..\..\mychat-saas\frontend"
if %errorlevel% neq 0 (
    echo [ERROR] Could not find frontend directory
    exit /b 1
)

echo [STEP 1] Installing dependencies...
echo This may take a few minutes...
echo.
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)

echo.
echo [STEP 2] Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo [SUCCESS] Frontend built successfully!
echo ========================================
echo.
echo Your app is ready to deploy!
echo.
echo Next steps:
echo 1. Commit changes: git add . && git commit -m "Fix microphone and build"
echo 2. Push to GitHub: git push
echo 3. Deploy to Netlify:
echo    - Go to https://app.netlify.com
echo    - Connect your GitHub repo
echo    - Base directory: mychat-saas/frontend
echo    - Build command: npm run build
echo    - Publish directory: dist
echo.
echo Or run locally:
echo   npm run dev
echo.
pause
