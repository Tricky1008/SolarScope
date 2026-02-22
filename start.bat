@echo off
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
pip install -r backend\requirements-win.txt -q
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] pip install failed. Make sure Python 3.11+ is installed.
    echo         Download from: https://python.org/downloads
    pause
    exit /b 1
)
echo        Backend ready.
echo.

REM ── Step 3: Frontend deps ──
echo [3/4] Setting up frontend...
if not exist "frontend\node_modules" (
    echo        Installing npm packages...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
) else (
    echo        Packages already installed.
)
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

echo ============================================
echo    Launching SolarScope...
echo ============================================
echo.
echo    Backend  :  http://localhost:8000
echo    Frontend :  http://localhost:5173
echo    API Docs :  http://localhost:8000/docs
echo.
echo    Close the Backend / Frontend windows to stop.
echo ============================================
echo.

REM ── Launch backend ──
start "SolarScope Backend" cmd /k "cd /d "%~dp0backend" && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat) && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

REM ── Small delay so backend boots first ──
timeout /t 3 /nobreak >nul

REM ── Launch frontend ──
start "SolarScope Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

REM ── Open browser ──
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo SolarScope is running!
pause
