@echo off
echo ========================================================
echo   AGENT PASSPORT EXCHANGE - FASTAPI BACKEND SERVER
echo   Trust Every Agent. Verify Every Action. Control Every Exchange.
echo ========================================================
cd /d "%~dp0backend"
set PYTHON_EXE=C:\Users\ASUS\AppData\Local\Programs\Python\Python313\python.exe
if not exist "%PYTHON_EXE%" (
    python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
) else (
    "%PYTHON_EXE%" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
)
pause

