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
echo    Setup Complete! Choose a platform:
echo ============================================
echo.
echo    1. Web App  (localhost - opens in browser)
echo    2. Android  (builds APK + opens Android Studio)
echo    3. Android  (Build ^& Install via CMD)
echo.
echo ============================================
echo.
choice /c 123 /n /m "Enter your choice [1, 2, or 3]: "

if errorlevel 3 goto :android_cmd
if errorlevel 2 goto :android
if errorlevel 1 goto :web

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

:android
echo.
echo ============================================
echo    Launching Android Build (Android Studio)...
echo ============================================
echo.

REM ── Launch backend (Android emulator needs it too) ──
echo    [1/4] Starting backend for API access...
start "SolarScope Backend" cmd /k "cd /d "%~dp0backend" && if exist venv\Scripts\python.exe (venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) else (python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload)"
timeout /t 3 /nobreak >nul

REM ── Build frontend ──
echo    [2/4] Building frontend (npm run build)...
for /f "delims=[] tokens=2" %%a in ('ping -4 -n 1 %COMPUTERNAME% ^| findstr [') do set LOCAL_IP=%%a
echo VITE_API_BASE_URL=http://!LOCAL_IP!:8000 > "%~dp0frontend\.env.production"
echo VITE_API_BASE_URL=http://!LOCAL_IP!:8000 > "%~dp0frontend\.env.development"
echo        Bound frontend API to http://!LOCAL_IP!:8000
cd /d "%~dp0frontend"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo    [ERROR] Frontend build failed!
    pause
    exit /b 1
)

REM ── Sync Capacitor using node_modules directly (bypasses npx hang) ──
echo    [3/4] Syncing Capacitor to Android...
if exist "node_modules\.bin\cap.cmd" (
    call "node_modules\.bin\cap.cmd" sync android
) else (
    echo    [WARN] cap.cmd not found, trying npx...
    call npx cap sync android
)
echo        Capacitor sync done.

REM ── Find and open Android Studio ──
echo    [4/4] Opening Android Studio...
set "STUDIO_PATH="

REM Check if user already saved a path from a previous run
if exist "%~dp0.android_studio_path" (
    set /p STUDIO_PATH=<"%~dp0.android_studio_path"
    if exist "!STUDIO_PATH!" goto :launch_studio
    set "STUDIO_PATH="
)

REM Check all common install locations
for %%P in (
    "C:\Program Files\Android\Android Studio\bin\studio64.exe"
    "%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe"
    "%ProgramFiles%\Android\Android Studio\bin\studio64.exe"
    "%ProgramFiles(x86)%\Android\Android Studio\bin\studio64.exe"
    "C:\Android\Android Studio\bin\studio64.exe"
    "D:\Android\Android Studio\bin\studio64.exe"
    "D:\Program Files\Android\Android Studio\bin\studio64.exe"
    "%LOCALAPPDATA%\JetBrains\Toolbox\apps\AndroidStudio\ch-0\*\bin\studio64.exe"
    "%USERPROFILE%\AppData\Local\Android\android-studio\bin\studio64.exe"
) do (
    if exist %%P (
        set "STUDIO_PATH=%%~P"
        goto :found_studio
    )
)

REM Not found — ask the user
echo.
echo    Android Studio was NOT found automatically.
echo.
echo    Please paste the FULL path to studio64.exe
echo    Example: C:\MyApps\Android Studio\bin\studio64.exe
echo.
set /p STUDIO_PATH="    Path: "

if not exist "!STUDIO_PATH!" (
    echo.
    echo    [ERROR] File not found: !STUDIO_PATH!
    echo.
    echo    Please open Android Studio manually and import this project:
    echo    %~dp0frontend\android
    echo.
    pause
    exit /b 1
)

:found_studio
REM Save the path for next time
echo !STUDIO_PATH!> "%~dp0.android_studio_path"

:launch_studio
echo        Found: !STUDIO_PATH!
start "" "!STUDIO_PATH!" "%~dp0frontend\android"

cd /d "%~dp0"

echo.
echo ============================================
echo    Android Studio is opening!
echo    Backend running at http://localhost:8000
echo.
echo    In Android Studio:
echo      1. Wait for Gradle sync to finish
echo      2. Click Run (green play button)
echo         or Build ^> Build APK(s)
echo      3. Select emulator or connected device
echo ============================================
pause
exit /b 0

:android_cmd
echo.
echo ============================================
echo    Launching Android Build (CMD)...
echo ============================================
echo.

REM ── Launch backend ──
echo    [1/4] Starting backend for API access...
start "SolarScope Backend" cmd /k "cd /d "%~dp0backend" && if exist venv\Scripts\python.exe (venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload) else (python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload)"
timeout /t 3 /nobreak >nul

REM ── Build frontend ──
echo    [2/4] Building frontend (npm run build)...
for /f "delims=[] tokens=2" %%a in ('ping -4 -n 1 %COMPUTERNAME% ^| findstr [') do set LOCAL_IP=%%a
echo VITE_API_BASE_URL=http://!LOCAL_IP!:8000 > "%~dp0frontend\.env.production"
echo VITE_API_BASE_URL=http://!LOCAL_IP!:8000 > "%~dp0frontend\.env.development"
echo        Bound frontend API to http://!LOCAL_IP!:8000
cd /d "%~dp0frontend"
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo    [ERROR] Frontend build failed!
    pause
    exit /b 1
)

REM ── Sync Capacitor ──
echo    [3/4] Syncing Capacitor to Android...
if exist "node_modules\.bin\cap.cmd" (
    call "node_modules\.bin\cap.cmd" sync android
) else (
    echo    [WARN] cap.cmd not found...
    call npx cap sync android
)

REM ── Patch Capacitor proguard issue ──
echo    Patching Capacitor plugins for Gradle 9 compatibility...
node "%~dp0frontend\scripts\patch-capacitor.cjs"

REM ── Compile & Install to Phone via Gradle (Bypassing native-run bug) ──
echo.
echo    [4/4] Building ^& Installing APK directly via Gradle...
echo    Make sure your phone is connected via USB and "USB Debugging" is ENABLED!
echo.
cd /d "%~dp0frontend\android"
call gradlew.bat installDebug

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo    [ERROR] Build or Installation failed! Ensure you have an emulator running.
    pause
    exit /b 1
)

echo.
echo ============================================
echo    App successfully installed and launched!
echo    Backend running at http://localhost:8000
echo ============================================
echo.
pause
exit /b 0
