@echo off
echo ========================================================
echo   STARTING AGENT PASSPORT EXCHANGE (FULL STACK)
echo ========================================================
start "Agent Passport Backend (Port 8000)" cmd /c "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
start "Agent Passport Frontend (Port 5173)" cmd /c "%~dp0start_frontend.bat"
echo Full stack launched!
echo - Backend API:  http://127.0.0.1:8000/docs
echo - Frontend App: http://127.0.0.1:5173
pause

