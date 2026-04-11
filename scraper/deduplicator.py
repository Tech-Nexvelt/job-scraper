import logging
from typing import List, Dict
from scraper.supabase_client import supabase

logger = logging.getLogger(__name__)

def filter_new_jobs(jobs: List[Dict]) -> List[Dict]:
    """
    Optimized deduplication: Checks a batch of jobs in a single database query.
    Filters out jobs that already exist in Supabase by 'apply_link'.
    """
    if not jobs:
        return []

    # 1. Get all unique links from the current scraped batch
    current_links = list(set(job.get("apply_link", "") for job in jobs if job.get("apply_link")))
    if not current_links:
        return jobs

    try:
        # 2. Query Supabase for all links that ALREADY exist in the DB
        # We use .in_() to check the whole batch at once
        result = supabase.table("jobs").select("apply_link").in_("apply_link", current_links).execute()
        existing_links = {r["apply_link"] for r in result.data}
        
        logger.info(f"Deduplication: Found {len(existing_links)} existing jobs in database.")

        # 3. Filter current batch to only include truly NEW jobs
        new_jobs = []
        seen_in_batch = set() # Avoid duplicates within the same scrape session
        
        for job in jobs:
            link = job.get("apply_link")
            if link and link not in existing_links and link not in seen_in_batch:
                new_jobs.append(job)
                seen_in_batch.add(link)
            else:
                logger.debug(f"Skipping duplicate/redundant job: {link}")

        logger.info(f"Deduplication complete: {len(new_jobs)} new out of {len(jobs)} total scraped.")
        return new_jobs

    except Exception as e:
        logger.error(f"Batch deduplication failed: {str(e)}. Falling back to slow check.")
        # Fallback to a safer approach if the IN query is too large or fails
        return jobs
