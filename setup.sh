#!/usr/bin/env bash
# =============================================================================
# SolarScope - Automated Setup Script
# Run: chmod +x setup.sh && ./setup.sh
# =============================================================================
set -e

BOLD='\033[1m'
ORANGE='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
RESET='\033[0m'

print_header() {
  echo ""
  echo -e "${ORANGE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${ORANGE}${BOLD}  ☀  SolarScope Setup — $1${RESET}"
  echo -e "${ORANGE}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
}

print_step() { echo -e "${BLUE}▶ $1${RESET}"; }
print_ok()   { echo -e "${GREEN}✅ $1${RESET}"; }
print_err()  { echo -e "${RED}❌ $1${RESET}"; exit 1; }

# =============================================================================
print_header "Environment Check"
# =============================================================================

# Check Python
print_step "Checking Python 3.11+..."
python3 --version | grep -E "3\.(11|12)" > /dev/null 2>&1 || {
  echo -e "${RED}Python 3.11+ is required. Install from https://python.org${RESET}"
  exit 1
}
print_ok "Python $(python3 --version)"

# Check Node.js
print_step "Checking Node.js 18+..."
node --version | grep -E "v(18|19|20|21|22)" > /dev/null 2>&1 || {
  echo -e "${RED}Node.js 18+ is required. Install from https://nodejs.org${RESET}"
  exit 1
}
print_ok "Node.js $(node --version)"

# Check Docker
print_step "Checking Docker..."
docker --version > /dev/null 2>&1 || print_err "Docker is required. Install from https://docker.com"
print_ok "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

# Check Docker Compose
docker compose version > /dev/null 2>&1 || print_err "Docker Compose is required"
print_ok "Docker Compose ready"

# =============================================================================
print_header "Backend Setup"
# =============================================================================

cd backend

# Copy env
if [ ! -f .env ]; then
  print_step "Creating .env from example..."
  cp .env.example .env
  print_ok ".env created (edit if needed)"
else
  print_ok ".env already exists"
fi

# Python virtual environment
print_step "Creating Python virtual environment..."
python3 -m venv venv
print_ok "venv created"

# Activate and install
print_step "Installing Python dependencies (this takes ~2-3 minutes)..."
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
print_ok "Backend dependencies installed"

deactivate
cd ..

# =============================================================================
print_header "Frontend Setup"
# =============================================================================

cd frontend

print_step "Installing Node.js dependencies..."
npm install --silent
print_ok "Frontend dependencies installed"

cd ..

# =============================================================================
print_header "Database & Services"
# =============================================================================

print_step "Starting PostgreSQL + PostGIS + Redis via Docker..."
docker compose up -d postgres redis

print_step "Waiting for database to be ready..."
sleep 8

# Wait for PostgreSQL to be healthy
for i in {1..30}; do
  docker compose exec postgres pg_isready -U solarscrope > /dev/null 2>&1 && break
  echo "  Waiting for DB ($i/30)..."
  sleep 2
done
print_ok "Database is ready"

# =============================================================================
print_header "Starting the App"
# =============================================================================

print_step "Starting FastAPI backend on http://localhost:8000 ..."
cd backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../.backend.pid
deactivate
cd ..
sleep 3
print_ok "Backend running (PID $BACKEND_PID)"

print_step "Starting React frontend on http://localhost:5173 ..."
cd frontend
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../.frontend.pid
cd ..
sleep 4
print_ok "Frontend running (PID $FRONTEND_PID)"

# =============================================================================
print_header "Android APK (Optional)"
# =============================================================================

echo -e "Do you want to build the Android APK now? (Requires Android Studio) [y/N]"
read -r build_apk
if [[ "$build_apk" =~ ^[Yy]$ ]]; then
  cd frontend
  print_step "Running Capacitor build and sync..."
  npm run android:build
  print_step "Opening Android Studio..."
  npm run android:open
  cd ..
fi

# =============================================================================
print_header "Setup Complete!"
# =============================================================================

echo -e "${GREEN}${BOLD}"
echo "  ☀  SolarScope is running!"
echo ""
echo -e "${RESET}  🌐 Frontend (Map Dashboard):  ${BOLD}http://localhost:5173${RESET}"
echo -e "  ⚡ Backend API:                ${BOLD}http://localhost:8000${RESET}"
echo -e "  📖 API Documentation:          ${BOLD}http://localhost:8000/docs${RESET}"
echo ""
echo -e "${ORANGE}  Quick Start:${RESET}"
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Search an address or click a city from the dropdown"
echo "  3. Zoom in and click any building/rooftop"
echo "  4. View the solar analysis panel on the right"
echo "  5. Download the PDF report"
echo ""
echo -e "${BLUE}  Logs:${RESET}  tail -f backend.log | tail -f frontend.log"
echo -e "${BLUE}  Stop:${RESET}  ./stop.sh"
echo ""
