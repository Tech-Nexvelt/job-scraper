import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict
from playwright.async_api import async_playwright

# Import providers
from scraper.providers.greenhouse import scrape_greenhouse
from scraper.providers.lever import scrape_lever
from scraper.providers.workday import scrape_workday
from scraper.providers.custom import scrape_custom
from scraper.providers.dice import scrape_dice
from scraper.providers.linkedin import scrape_linkedin

from scraper.role_classifier import classify_role
from scraper.deduplicator import filter_new_jobs
from scraper.supabase_client import supabase
from scraper.notifier import send_scraping_alert

# Configure logging
LOG_FILE = Path(__file__).parent / "scraper.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("job_scraper")

COMPANIES_PATH = Path(__file__).parent / "companies.json"

# Search Keywords for Global Boards
KEYWORDS = [
    "Software Engineer",
    "Fullstack Developer",
    "Frontend Developer", 
    "Backend Developer",
    "DevOps Engineer"
]

# Concurrency limit
SEMAPHORE = asyncio.Semaphore(5)

async def scrape_wrapper(company: Dict, browser_context) -> List[Dict]:
    """
    Wrapper to handle individual company or global board scraping.
    """
    name = company["name"]
    provider = company.get("provider", "custom")
    url = company.get("careers_url", "")
    
    async with SEMAPHORE:
        for attempt in range(2): # 2 attempts total
            try:
                page = await browser_context.new_page()
                
                jobs = []
                if provider == "dice":
                    jobs = await scrape_dice(KEYWORDS, page)
                elif provider == "linkedin":
                    jobs = await scrape_linkedin(KEYWORDS, page)
                elif provider == "greenhouse":
                    jobs = await scrape_greenhouse(company, page)
                elif provider == "lever":
                    jobs = await scrape_lever(company, page)
                elif provider == "workday":
                    jobs = await scrape_workday(company, page)
                else:
                    jobs = await scrape_custom(company, page)
                
                await page.close()
                
                if jobs:
                    logger.info(f"Successfully scraped {len(jobs)} jobs from {name}")
                else:
                    logger.warning(f"No jobs found for {name}")
                    
                return jobs
            except Exception as e:
                logger.error(f"Error scraping {name} (Attempt {attempt + 1}): {str(e)}")
                if attempt < 1:
                    await asyncio.sleep(5)
                else:
                    return []
    return []

async def run() -> int:
    """
    Main entry point for the parallel scraper.
    """
    try:
        # Fetch active companies from Supabase
        result = supabase.table("companies").select("*").eq("is_active", True).execute()
        companies_data = result.data
        if not companies_data:
            raise ValueError("No companies found in database")
        logger.info(f"Fetched {len(companies_data)} companies from Supabase.")
    except Exception as e:
        logger.warning(f"Supabase fetch failed or empty: {str(e)}. Falling back to local companies.json")
        if COMPANIES_PATH.exists():
            companies_data = json.loads(COMPANIES_PATH.read_text())
        else:
            logger.error("No companies found in database or local JSON.")
            return 0

    total_inserted = 0
    start_time = datetime.now()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Use a single context to manage pages
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        
        # Create tasks for all companies
        tasks = [scrape_wrapper(company, context) for company in companies_data]
        
        # Run in parallel
        results = await asyncio.gather(*tasks)
        
        await browser.close()

    # Process results
    all_raw_jobs = []
    for company_jobs in results:
        all_raw_jobs.extend(company_jobs)

    if not all_raw_jobs:
        logger.info("No jobs found in this session.")
        return 0

    # Step enrichment and classification
    enriched_jobs = []
    for job in all_raw_jobs:
        job["role"] = classify_role(job["job_title"], job.get("description", ""))
        job["last_scraped_at"] = datetime.now(timezone.utc).isoformat()
        enriched_jobs.append(job)

    # Deduplicate
    new_jobs = filter_new_jobs(enriched_jobs)
    
    # Insert into Supabase
    if new_jobs:
        try:
            data_to_insert = []
            for j in new_jobs:
                data_to_insert.append({
                    "job_title": j["job_title"],
                    "company": j["company"],
                    "location": j["location"],
                    "role": j["role"],
                    "apply_link": j["apply_link"],
                    "source": j.get("source", "company_career_page"),
                    "last_scraped_at": j["last_scraped_at"]
                })

            # Chunk insertion for reliability
            CHUNK_SIZE = 50
            for i in range(0, len(data_to_insert), CHUNK_SIZE):
                chunk = data_to_insert[i:i + CHUNK_SIZE]
                supabase.table("jobs").insert(chunk).execute()
            
            total_inserted = len(data_to_insert)
            logger.info(f"Inserted {total_inserted} new jobs into Supabase.")
        except Exception as e:
            logger.error(f"Failed to insert jobs into Supabase: {str(e)}")

    # Update last_scraped_at
    try:
        current_time = datetime.now(timezone.utc).isoformat()
        # Only update Supabase if we have IDs (meaning we didn't fall back fully to JSON)
        # Or if we want to update the JSON file back
        can_update_db = any("id" in c for c in companies_data)
        
        if can_update_db:
            for company in companies_data:
                if "id" in company:
                    supabase.table("companies").update({"last_scraped_at": current_time}).eq("id", company["id"]).execute()
            logger.info("Updated last_scraped_at for all companies in Supabase.")
        else:
            # Update the JSON file instead
            for company in companies_data:
                company["last_scraped_at"] = current_time
            COMPANIES_PATH.write_text(json.dumps(companies_data, indent=2))
            logger.info("Updated last_scraped_at in local companies.json.")

    except Exception as e:
        logger.error(f"Failed to update companies: {str(e)}")

    # Send email alert (always send to confirm status)
    send_scraping_alert(total_inserted)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    logger.info(f"Scraping session finished in {duration:.2f}s. Total New Jobs: {total_inserted}")
    
    return total_inserted

if __name__ == "__main__":
    asyncio.run(run())
