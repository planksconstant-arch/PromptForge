@echo off
SETLOCAL EnableExtensions

echo ===========================================
echo Yaprompt Studio Launcher
echo ===========================================

REM Get the absolute path of the current directory
SET "PROJECT_ROOT=%~dp0"
REM Remove trailing backslash
SET "PROJECT_ROOT=%PROJECT_ROOT:~0,-1%"

echo Project Root: "%PROJECT_ROOT%"

REM Check python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH!
    echo Please make sure you are running this from a terminal where Python is accessible.
    pause
    exit /b 1
)

REM Check npm
where npm.cmd >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm not found in PATH!
    echo Please install Node.js.
    pause
    exit /b 1
)

REM Start Backend
echo Starting Backend Server...
start "Yaprompt Backend" cmd /k "cd /d "%PROJECT_ROOT%" && python -m yaprompt_python.main"

REM Start Frontend
echo Starting Frontend Server...
start "Yaprompt Frontend" cmd /k "cd /d "%PROJECT_ROOT%\website" && npm.cmd run dev"

echo.
echo Servers are starting...
echo Backend will be at: http://localhost:8000
echo Frontend will be at: http://localhost:3000/studio
echo.
echo Checks:
echo 1. Keep the two new black windows OPEN.
echo 2. Wait for "Ready on http://localhost:3000" in the Frontend window.
echo 3. Then refresh your browser.
echo.
pause
