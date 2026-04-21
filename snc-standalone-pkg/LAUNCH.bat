@echo off
REM ===========================================
REM  SNC Patient Register — Portable Launcher
REM  Siyaram Neurotherapy Center
REM ===========================================
setlocal

echo Starting SNC Patient Register...
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "EXE_PATH=%SCRIPT_DIR%SNC Patient Register.exe"

if not exist "%EXE_PATH%" (
    echo ERROR: Application not found.
    echo Please extract all files first.
    pause
    exit /b 1
)

echo Launching app...
start "" "%EXE_PATH%"

echo Done!
