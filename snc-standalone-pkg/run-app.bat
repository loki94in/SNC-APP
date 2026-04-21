@echo off
REM ===========================================
REM  SNC Patient Register — Run on Windows
REM  Siyaram Neurotherapy Center
REM ===========================================
setlocal

echo Starting SNC Patient Register...
echo.

REM Check Windows version
ver | findstr /C:"Version 10" >nul
if %errorlevel% neq 0 (
    echo ERROR: Windows 10 or later required.
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install from https://nodejs.org
    echo Required: Node.js 18 or higher
    pause
    exit /b 1
)

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "FRONTEND_DIR=%SCRIPT_DIR%snc-dist"

REM Check if frontend dist exists
if not exist "%FRONTEND_DIR%\index.html" (
    echo ERROR: Frontend not found at %FRONTEND_DIR%
    echo Please download the complete package.
    pause
    exit /b 1
)

REM Start backend server
echo [1/2] Starting backend server...
start "SNC Backend" cmd /c "cd /d "%SCRIPT_DIR%backend" ^&^& node src\index.js"
timeout /t 2 /nobreak >nul

REM Serve frontend
echo [2/2] Starting frontend server...
cd /d "%FRONTEND_DIR%"
start "SNC Frontend" cmd /c "npx serve . -p 5173 -s"
timeout /t 2 /nobreak >nul

REM Open browser
echo.
echo Opening app in browser...
start http://localhost:5173

echo Done! Close this window to exit.
pause
