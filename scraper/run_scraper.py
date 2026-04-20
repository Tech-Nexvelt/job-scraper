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
from scraper.providers.amazon import scrape_amazon # [NEW]
from scraper.providers.apple import scrape_apple # [NEW]
from scraper.providers.google import scrape_google # [NEW]
from scraper.providers.microsoft import scrape_microsoft # [NEW]
from scraper.providers.meta import scrape_meta # [NEW]

from scraper.role_classifier import classify_role, get_domain
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

# Comprehensive Search Keywords across all required domains
DOMAIN_KEYWORDS = {
    "Data": ["Data Analyst", "Data Engineer", "Data Scientist", "Business Intelligence", "Analytics"],
    "Software": ["Software Engineer", "Fullstack Developer", "Frontend Developer", "Backend Developer", "DevOps Engineer"],
    "Business": ["Business Analyst", "Financial Analyst", "CRM Manager", "Credit Risk"],
    "Healthcare": ["Biomedical Engineer", "Clinical Research", "Clinical Data Analyst", "Healthcare"],
    "Engineering": ["Electrical Engineer", "Mechanical Engineer", "Civil Engineer", "Chemical Engineer"],
    "Security": ["Cybersecurity Analyst", "Information Security", "AML Investigator", "Security Engineer"]
}

# Flat list of all keywords for global scrapers
KEYWORDS = [kw for sublist in DOMAIN_KEYWORDS.values() for kw in sublist]

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
                
                async def inner_scrape():
                    if provider == "dice":
                        return await scrape_dice(KEYWORDS, page)
                    elif provider == "linkedin":
                        return await scrape_linkedin(KEYWORDS, page)
                    elif provider == "greenhouse":
                        return await scrape_greenhouse(company, page)
                    elif provider == "lever":
                        return await scrape_lever(company, page)
                    elif provider == "workday":
                        return await scrape_workday(company, page)
                    elif provider == "amazon":
                        return await scrape_amazon(company, page)
                    elif provider == "apple":
                        return await scrape_apple(company, page)
                    elif provider == "google":
                        return await scrape_google(company, page)
                    elif provider == "microsoft":
                        return await scrape_microsoft(company, page)
                    elif provider == "meta":
                        return await scrape_meta(company, page)
                    else:
                        return await scrape_custom(company, page)

                # Implement a per-company timeout of 15 minutes to prevent stalling the entire 6h run
                jobs = await asyncio.wait_for(inner_scrape(), timeout=900)
                
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
        # Prioritize local companies.json as the master source of truth
        if COMPANIES_PATH.exists():
            companies_data = json.loads(COMPANIES_PATH.read_text())
            logger.info(f"Loaded {len(companies_data)} companies from local companies.json (Master List).")
        else:
            # Fallback to Supabase if JSON is missing
            result = supabase.table("companies").select("*").eq("is_active", True).execute()
            companies_data = result.data
            if not companies_data:
                raise ValueError("No companies found in JSON or Supabase")
            logger.info(f"Fetched {len(companies_data)} companies from Supabase (Fallback).")
    except Exception as e:
        logger.error(f"Failed to load companies: {str(e)}")
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
        job["domain"] = get_domain(job["job_title"])
        job["last_scraped_at"] = datetime.now(timezone.utc).isoformat()
        enriched_jobs.append(job)

    # Deduplicate and filter by 48h freshness
    new_jobs = filter_new_jobs(enriched_jobs)
    
    # EARLY EXIT LOGIC: If a run results in 0 new jobs for a company that used to have many, 
    # we can log that it's "Up to Date".
    if not new_jobs and enriched_jobs:
        logger.info("All jobs from this batch were either duplicates or already in DB. System is up to date.")
    
    # Insert into Supabase
    if new_jobs:
        try:
            data_to_upsert = []
            for j in new_jobs:
                data_to_upsert.append({
                    "job_title": j["job_title"],
                    "company": j["company"],
                    "location": j["location"],
                    "role": j["role"],
                    "domain": j["domain"],
                    "apply_link": j["apply_link"],
                    "source": j.get("source", "company_career_page"),
                    "last_scraped_at": j["last_scraped_at"]
                })

            # Chunk insertion for reliability
            CHUNK_SIZE = 50
            success_count = 0
            for i in range(0, len(data_to_upsert), CHUNK_SIZE):
                chunk = data_to_upsert[i:i + CHUNK_SIZE]
                try:
                    # Use upsert with on_conflict to handle existing links gracefully
                    supabase.table("jobs").upsert(
                        chunk, 
                        on_conflict="apply_link"
                    ).execute()
                    success_count += len(chunk)
                except Exception as chunk_e:
                    logger.error(f"Failed to upsert chunk {i}: {str(chunk_e)}")
            
            total_inserted = success_count
            logger.info(f"Upserted {total_inserted} jobs into Supabase.")
        except Exception as e:
            logger.error(f"Failed to process jobs for Supabase: {str(e)}")

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

    # Calculate domain summary
    domain_counts = {domain: 0 for domain in DOMAIN_KEYWORDS.keys()}
    domain_counts["Other"] = 0
    for job in enriched_jobs:
        domain_counts[job["domain"]] = domain_counts.get(job["domain"], 0) + 1
    
    logger.info("--- Domain Coverage Summary ---")
    for domain, count in domain_counts.items():
        status = "✅ PASS" if count >= 20 else "⚠️ FAIL (Under 20)"
        logger.info(f"{domain}: {count} jobs found - {status}")
    logger.info("-------------------------------")

    # Send email alert (always send to confirm status)
    send_scraping_alert(total_inserted)

    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    summary_msg = f"Scraping session finished in {duration:.2f}s. Total New Jobs: {total_inserted}. "
    summary_msg += " | ".join([f"{d}: {c}" for d, c in domain_counts.items() if c > 0])
    logger.info(summary_msg)
    
    return total_inserted

if __name__ == "__main__":
    asyncio.run(run())
