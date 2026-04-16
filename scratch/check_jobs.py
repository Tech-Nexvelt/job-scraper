import os
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing Supabase credentials in .env")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    today = datetime.now().strftime("%Y-%m-%d")
    response = supabase.table("jobs").select("id", count="exact").eq("created_at", today).execute()
    print(f"Jobs created today in DB: {response.count}")
    
    # Also check total count
    total = supabase.table("jobs").select("id", count="exact").execute()
    print(f"Total jobs in system: {total.count}")
except Exception as e:
    print(f"Error querying DB: {e}")
