@echo off
setlocal EnableDelayedExpansion

:: ═══════════════════════════════════════════════════════════════
::  SNC Patient Register — Windows Launcher
::  Siyaram Neurotherapy Center
:: ═══════════════════════════════════════════════════════════════

set "APP_NAME=SNC Patient Register"
set "MAIN_SCRIPT=%~dp0app.js"
set "LOG_FILE=%~dp0logs\app.log"
set "DATA_DIR=%~dp0data"

:: Create data and logs directories
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"
if not exist "%~dp0logs" mkdir "%~dp0logs"

:: Kill any existing instance on the port
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a on port 3000
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: Find node
set "NODE="
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

:: Start the server
echo Starting %APP_NAME%...
echo Logging to: %LOG_FILE%

start "" /min cmd /c "node \"%MAIN_SCRIPT%\" 2>>\"%LOG_FILE%\""

:: Wait for server to start
set "READY=0"
for /L %%i in (1,1,30) do (
    timeout /t 1 /nobreak >nul
    curl -s http://localhost:3000 >nul 2>&1
    if !ERRORLEVEL! equ 0 (
        set "READY=1"
        goto :server_ready
    )
)

:server_ready
if %READY% equ 1 (
    echo Server ready. Opening app...
    start http://localhost:3000
) else (
    echo WARNING: Server did not start in time. Check %LOG_FILE%
)

echo.
echo %APP_NAME% is running.
echo Backend: http://localhost:3000
echo.
echo Close this window to stop the server.
pause
