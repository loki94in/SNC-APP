@echo off
echo =============================================
echo  SNC Desktop — Full Build Script
echo  Siyaram Neurotherapy Center
echo =============================================
echo.

REM --- Step 1: Build Frontend ---
echo [1/3] Building frontend...
cd snc
call npm install
call npm run build
if errorlevel 1 (
    echo FAILED: Frontend build failed.
    pause
    exit /b 1
)
echo [1/3] OK
echo.

REM --- Step 2: Copy frontend dist into Electron ---
echo [2/3] Copying frontend into Electron src...
if not exist "src\frontend" mkdir "src\frontend"
xcopy /E /I /Y "snc\dist" "src\frontend\"
echo [2/3] OK
echo.

REM --- Step 3: Build Electron portable exe ---
echo [3/3] Building Windows portable exe...
call npm install
call npm run build
if errorlevel 1 (
    echo FAILED: Electron build failed.
    pause
    exit /b 1
)
echo [3/3] OK
echo.
echo =============================================
echo  Build complete!
echo  Output: snc-desktop\dist\
echo.
echo  To create installer, run on Windows:
echo  iscc setup.iss
echo =============================================
pause
