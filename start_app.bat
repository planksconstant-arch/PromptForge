@echo off
echo ==========================================
echo Starting YaPrompt AI Studio...
echo ==========================================

echo [1/2] Launching Backend (Port 8000)...
:: Set PYTHONPATH to current directory so yaprompt_python module is found
set PYTHONPATH=%CD%
start "YaPrompt Backend" cmd /k "python -m yaprompt_python.main"

echo [2/2] Launching Frontend (Port 5173)...
cd frontend
:: Use cmd /k to keep window open if it fails
start "YaPrompt Frontend" cmd /k "npm run dev"

echo ==========================================
echo Services started!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo ==========================================
pause
