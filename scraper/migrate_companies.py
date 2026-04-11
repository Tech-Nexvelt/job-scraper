import json
import logging
from pathlib import Path
from scraper.supabase_client import supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migration")

COMPANIES_PATH = Path(__file__).parent / "companies.json"

def migrate():
    if not COMPANIES_PATH.exists():
        logger.error("companies.json not found")
        return

    try:
        companies = json.loads(COMPANIES_PATH.read_text())
        logger.info(f"Read {len(companies)} companies from JSON")
        
        data_to_insert = []
        for c in companies:
            data_to_insert.append({
                "name": c["name"],
                "careers_url": c["careers_url"],
                "provider": c.get("provider", "custom"),
                "location": c.get("location", "USA"),
                "max_jobs": c.get("max_jobs", 20),
                "last_scraped_at": c.get("last_scraped_at")
            })

        # Insert into Supabase (upsert based on name)
        # Note: In Supabase, upsert requires a unique constraint on 'name' which we added.
        result = supabase.table("companies").upsert(data_to_insert, on_conflict="name").execute()
        
        logger.info(f"Successfully migrated companies to Supabase.")
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")

if __name__ == "__main__":
    migrate()
