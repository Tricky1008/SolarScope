@echo off
setlocal enabledelayedexpansion
title SolarScope Launcher
color 0A

echo ============================================
echo    SolarScope - Rooftop Solar Calculator
echo ============================================
echo.

cd /d "%~dp0"

REM ── Step 1: Backend .env ──
echo [1/4] Checking backend config...
if not exist "backend\.env" (
    echo        Creating .env from template...
    copy "backend\.env.example" "backend\.env" >nul 2>&1
)
echo        Done.
echo.

REM ── Step 2: Install Python deps ──
echo [2/4] Installing Python dependencies...
cd /d "%~dp0backend"

python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

if not exist "venv" (
    echo        Creating virtual environment...
    python -m venv venv
) else (
    echo        Virtual environment already exists.
)

echo        Updating pip...
"venv\Scripts\python.exe" -m pip install --upgrade pip -q
echo        Installing requirements...
"venv\Scripts\python.exe" -m pip install -r requirements-win.txt -q
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] pip install failed. 
    pause
    exit /b 1
)
cd /d "%~dp0"
echo        Backend ready.

echo.

REM ── Step 3: Frontend deps ──
echo [3/4] Setting up frontend...
echo        Installing latest npm packages...
cd /d "%~dp0frontend"
call npm install
cd /d "%~dp0"
echo.

REM ── Step 4: Verify ML Models ──
echo [4/4] Verifying ML models...
cd /d "%~dp0backend"
if exist "venv\Scripts\python.exe" (
    "venv\Scripts\python.exe" startup_check.py
) else (
    python startup_check.py
)
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] ML Model verification failed. 
    echo         Please ensure all .pkl files are in backend/data/models/
    pause
    exit /b 1
)
cd /d "%~dp0"
echo.

REM ── Choose Platform ──
echo.
echo ============================================
echo    Setup Complete! Launching SolarScope...
echo ============================================
echo.

:web
echo.
echo ============================================
echo    Launching Web Platform...
echo ============================================
echo.

REM ── Find Local IP for Phone Access ──
for /f "delims=[] tokens=2" %%a in ('ping -4 -n 1 %COMPUTERNAME% ^| findstr [') do set LOCAL_IP=%%a
echo VITE_API_BASE_URL=http://!LOCAL_IP!:8000 > "%~dp0frontend\.env.development"

echo    Backend  :  http://localhost:8000
echo    Frontend :  http://localhost:5173
echo    API Docs :  http://localhost:8000/docs
echo.
echo    [+] MOBILE TESTING URL:  http://!LOCAL_IP!:5173
echo        (Type this into your phone's browser while on the same Wi-Fi)
echo.

REM ── Launch backend ──
start "SolarScope Backend" cmd /k "cd /d ""%~dp0backend"" && if exist venv\Scripts\python.exe (venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) else (python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload)"

REM ── Small delay so backend boots first ──
timeout /t 3 /nobreak >nul

REM ── Launch frontend ──
start "SolarScope Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

REM ── Open browser ──
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo    SolarScope Web Platform is running!
echo    Close the Backend / Frontend windows to stop.
pause
exit /b 0
