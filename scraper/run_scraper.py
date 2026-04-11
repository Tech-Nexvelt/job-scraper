import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict

from scraper.company_scraper import scrape_company
from scraper.role_classifier import classify_role
from scraper.deduplicator import filter_new_jobs
from scraper.supabase_client import supabase
from scraper.notifier import send_scraping_alert

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

COMPANIES_PATH = Path(__file__).parent / "companies.json"

async def run() -> int:
    """
    Main execution flow for the scraper.
    Reads companies, scrapes, classifies, deduplicates, and saves to Supabase.
    """
    if not COMPANIES_PATH.exists():
        logger.error(f"Companies file not found at {COMPANIES_PATH}")
        return 0

    try:
        companies = json.loads(COMPANIES_PATH.read_text())
    except Exception as e:
        logger.error(f"Failed to read companies.json: {str(e)}")
        return 0

    total_inserted = 0

    for company in companies:
        logger.info(f"--- Processing {company['name']} ---")
        try:
            # Step 1: Scrape
            raw_jobs = await scrape_company(company)
            if not raw_jobs:
                continue

            # Step 2: Classify and Enrich
            for job in raw_jobs:
                job["role"] = classify_role(
                    job.get("job_title", ""),
                    job.get("description", "")
                )
                job["source"] = "company_career_page"
                job["last_scraped_at"] = datetime.now(timezone.utc).isoformat()
                # Remove description before database insertion to keep table lean if desired
                # job.pop("description", None)

            # Step 3: Deduplicate
            new_jobs = filter_new_jobs(raw_jobs)
            
            # Step 4: Insert
            if new_jobs:
                try:
                    # Clean up jobs for insertion (remove extra keys like 'description' if not in schema)
                    data_to_insert = []
                    for j in new_jobs:
                        data_to_insert.append({
                            "job_title": j["job_title"],
                            "company": j["company"],
                            "location": j["location"],
                            "role": j["role"],
                            "apply_link": j["apply_link"],
                            "source": j["source"],
                            "last_scraped_at": j["last_scraped_at"]
                        })

                    supabase.table("jobs").insert(data_to_insert).execute()
                    total_inserted += len(data_to_insert)
                    logger.info(f"Inserted {len(data_to_insert)} jobs from {company['name']}")
                except Exception as e:
                    logger.error(f"Insert failed for {company['name']}: {str(e)}")

        except Exception as e:
            logger.error(f"An unexpected error occurred while processing {company['name']}: {str(e)}")

    logger.info(f"Total scraping session complete. {total_inserted} new jobs added.")
    
    # Send email alert
    if total_inserted > 0:
        send_scraping_alert(total_inserted)
        
    return total_inserted

if __name__ == "__main__":
    asyncio.run(run())
