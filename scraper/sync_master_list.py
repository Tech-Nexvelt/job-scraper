import json
import logging
from pathlib import Path
from scraper.supabase_client import supabase

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

COMPANIES_PATH = Path("scraper/companies.json")

def sync_master_list():
    try:
        logger.info("Fetching all active companies from Supabase...")
        result = supabase.table("companies").select("*").eq("is_active", True).execute()
        
        if not result.data:
            logger.warning("No companies found in Supabase. Sync aborted.")
            return

        # Prepare the list for JSON (remove internal DB fields like id, created_at)
        master_list = []
        for row in result.data:
            master_list.append({
                "name": row["name"],
                "careers_url": row["careers_url"],
                "provider": row["provider"],
                "location": row.get("location", "USA")
            })

        # Save to companies.json
        with open(COMPANIES_PATH, "w") as f:
            json.dump(master_list, f, indent=2)
            
        logger.info(f"Successfully synced {len(master_list)} companies to {COMPANIES_PATH}")

    except Exception as e:
        logger.error(f"Sync failed: {e}")

if __name__ == "__main__":
    sync_master_list()
