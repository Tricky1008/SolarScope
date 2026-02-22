# ☀ SolarScope — Rooftop Solar Potential Calculator

> A full-stack AI + GIS web platform that estimates rooftop solar energy potential using OpenStreetMap building data, NASA POWER irradiance, and a PVLib simulation engine.

![SolarScope](https://img.shields.io/badge/SOLARSCOPE-V1.0-FF6B1A?style=for-the-badge&logo=sun&logoColor=white)
![React](https://img.shields.io/badge/REACT-18-0A84FF?style=for-the-badge&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FASTAPI-0.104-14b8a6?style=for-the-badge&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/SUPABASE-PG15-22c55e?style=for-the-badge&logo=supabase&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBOOST-AI-a855f7?style=for-the-badge&logo=scikit-learn&logoColor=white)

---

## 📸 What It Does

1. **Click any rooftop** on an interactive dark-theme map
2. The app fetches the building polygon from OpenStreetMap
3. Pulls live solar irradiance data from NASA POWER API
4. Runs the solar calculation pipeline (panels → kWh → ₹ savings → CO₂)
5. Displays results in a slide-in dashboard panel
6. Lets you download a professional PDF report

---

## 🛠 Prerequisites — Install These First

| Tool | Version | Download |
|------|---------|----------|
| Python | 3.11 or 3.12 | https://python.org/downloads |
| Node.js | 18+ | https://nodejs.org |
| Docker Desktop | Latest | https://docker.com/get-started |
| Git | Any | https://git-scm.com |

> **Windows users**: Use WSL2 (Windows Subsystem for Linux) for best results.  
> All commands below assume a bash/zsh terminal.

---

## 🚀 Quickstart (Automated — Recommended)

```bash
# 1. Unzip the project
unzip solarscrope.zip
cd solarscrope

# 2. Make scripts executable
chmod +x setup.sh stop.sh

# 3. Run the automated setup (takes ~5 minutes first time)
./setup.sh

# 4. Open in browser
open http://localhost:5173
```

That's it. The setup script handles everything automatically.

---

## 🔧 Manual Step-by-Step Setup

If the automated script doesn't work, follow these steps:

### Step 1 — Start the Database

```bash
cd solarscrope

# Start PostgreSQL + PostGIS + Redis in Docker
docker compose up -d postgres redis

# Verify they started
docker compose ps
# Both should show "healthy"
```

### Step 2 — Backend Setup

```bash
cd backend

# Create Python virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate          # Linux/Mac
# venv\Scripts\activate           # Windows

# Install all Python packages
pip install -r requirements.txt

# Create environment config
cp .env.example .env

# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

✅ Backend is running when you see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Open a new terminal tab before continuing.

### Step 3 — Frontend Setup

```bash
cd solarscrope/frontend

# Install Node.js packages
npm install

# Start the development server
npm run dev
```

✅ Frontend is running when you see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### Step 4 — Open the App

Open **http://localhost:5173** in your browser.

---

## 📁 Project Structure

```
solarscrope/
├── backend/
│   ├── app/
│   │   ├── api/routes.py          ← All REST endpoints
│   │   ├── core/config.py         ← Settings & DB config
│   │   ├── models/models.py       ← SQLAlchemy models
│   │   ├── schemas/schemas.py     ← Pydantic request/response types
│   │   ├── services/
│   │   │   ├── solar_service.py   ← ⭐ Main calculation engine
│   │   │   ├── irradiance_service.py ← NASA POWER API client
│   │   │   ├── building_service.py   ← OSM/Overpass API client
│   │   │   └── report_service.py     ← PDF generation (ReportLab)
│   │   └── main.py               ← FastAPI app entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.tsx        ← ⭐ Interactive Leaflet map
│   │   │   ├── AnalysisPanel.tsx  ← Slide-in results dashboard
│   │   │   ├── Navbar.tsx         ← Top nav + search
│   │   │   ├── SearchBar.tsx      ← Address geocoding
│   │   │   ├── ScoreGauge.tsx     ← SVG arc score gauge
│   │   │   ├── MonthlyChart.tsx   ← Recharts bar chart
│   │   │   └── SettingsModal.tsx  ← Tariff & cost settings
│   │   ├── api/client.ts          ← Axios API wrapper
│   │   ├── store/appStore.ts      ← Zustand global state
│   │   ├── types/index.ts         ← TypeScript interfaces
│   │   └── main.tsx
│   └── package.json
├── docker-compose.yml
├── setup.sh                       ← Automated setup script
├── stop.sh                        ← Stop all services
└── README.md
```

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/geocode?address=...` | Address → lat/lon |
| GET | `/api/v1/buildings/nearby?lat=&lon=` | OSM buildings near point |
| GET | `/api/v1/irradiance?lat=&lon=` | Solar irradiance data |
| POST | `/api/v1/solar/calculate?lat=&lon=` | ⭐ Full solar analysis |
| POST | `/api/v1/solar/report` | Generate PDF report |
| GET | `/api/v1/cities` | Demo cities list |

**Interactive API docs**: http://localhost:8000/docs

---

## ⚙️ Configuration

Edit `backend/.env` to customize:

```env
DATABASE_URL=postgresql+asyncpg://solarscrope:solarscrope@localhost:5432/solarscrope
REDIS_URL=redis://localhost:6379/0
CORS_ORIGINS=http://localhost:5173
```

### Changing Electricity Tariff / Currency

Click the **Settings gear ⚙️** icon in the top navbar:
- Set your local electricity tariff (₹/kWh, $/kWh etc.)
- Set installation cost per kWp for your region
- Select currency (INR, USD, GBP, EUR, AED, SGD)

---

## 🧮 How the Calculation Works

```
User clicks rooftop
       ↓
Fetch building polygon from OpenStreetMap
       ↓
Calculate roof area in m² (UTM projection for accuracy)
       ↓
Apply 75% usability factor → usable_area_m²
       ↓
Fetch GHI, PVOUT from NASA POWER API
       ↓
num_panels = floor(usable_area / 1.7)   ← 1.7m² per panel
system_kWp = num_panels × 0.4           ← 400W panels
annual_kWh = system_kWp × PVOUT × 0.80 ← Performance ratio
       ↓
annual_savings = annual_kWh × tariff
installation_cost = system_kWp × cost_per_kWp
payback_years = installation_cost / annual_savings
npv_25yr = Σ(discounted cash flows over 25 years)
       ↓
co2_kg = annual_kWh × 0.82  ← India grid factor
solar_score = composite of irradiance + size + temp + payback
```

---

## 🐛 Troubleshooting

**Map is blank / no buildings showing**
- Zoom in to street level (zoom 17+) before clicking
- OSM has building data in cities but not all rural areas
- The app still calculates using a default 80m² roof if OSM has nothing

**"Calculation failed" error in the panel**
- Check that the backend is running: `curl http://localhost:8000/api/v1/health`
- Check backend logs: `tail -f backend.log`
- Make sure Docker is running (for PostgreSQL/Redis)

**NASA POWER API returns nothing**
- The API is free but rate-limited. The app has a built-in fallback estimator.
- Source will show `ESTIMATED` instead of `NASA_POWER`

**Port already in use**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Python package install fails (GDAL error)**
```bash
# Ubuntu/Debian
sudo apt-get install libgdal-dev gdal-bin python3-gdal

# macOS
brew install gdal

# Then retry
pip install -r requirements.txt
```

---

## 🔒 Stopping the App

```bash
./stop.sh

# Or manually:
docker compose down       # Stop DB
Ctrl+C                    # Stop backend & frontend terminals
```

---

## 🚀 Deploying to Production

| Service | Platform | Command |
|---------|----------|---------|
| Backend | Render.com | Connect GitHub → set env vars → deploy |
| Frontend | Vercel | `vercel --prod` from /frontend |
| Database | Supabase | Create project → get PostGIS connection string |

---

## 📊 Datasets Used

| Dataset | Source | Purpose |
|---------|--------|---------|
| Building Footprints | OpenStreetMap via Overpass API | Roof polygon + area |
| Solar Irradiance | NASA POWER API | GHI, DNI, PVOUT, temperature |
| Geocoding | Nominatim (OSM) | Address → coordinates |
| Grid Emission Factor | CEA India 2023 | CO₂ calculation |
| Electricity Tariff | Configurable by user | Financial model |

---

## 🧪 Running Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

---

## 📄 License

MIT License — free to use, modify, and deploy.

---

*Built with Python · FastAPI · React · TypeScript · Leaflet.js · Recharts · PostgreSQL/PostGIS · PVLib · NASA POWER*
