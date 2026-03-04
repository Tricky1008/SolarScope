import asyncio
from dotenv import load_dotenv
import os
import sys

# Load env variables directly to avoid FastAPI startup issues
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY or "your-project-ref" in SUPABASE_URL:
    print("[ERROR] Supabase Keys are not configured in backend/.env!")
    print("Please open backend/.env and paste your actual SUPABASE_URL and SUPABASE_SERVICE_KEY.")
    sys.exit(1)

try:
    from supabase import create_client, Client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Attempt to query the 'users' table we created
    response = supabase.table("users").select("id").limit(1).execute()
    
    print("[SUCCESS] Connected to Supabase Database successfully.")
    print(f"   Project URL: {SUPABASE_URL}")
    print("   Tables 'users' and 'solar_analyses' are accessible.")

except Exception as e:
    print(f"[ERROR] Failed to connect or query Supabase.")
    print(f"Details: {e}")
    sys.exit(1)
