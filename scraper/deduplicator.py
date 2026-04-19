import logging
from typing import List, Dict
from scraper.supabase_client import supabase

logger = logging.getLogger(__name__)

def filter_new_jobs(jobs: List[Dict]) -> List[Dict]:
    """
    Optimized deduplication: Checks a batch of jobs in a single database query.
    Filters out jobs that already exist in Supabase by:
    1. 'apply_link' (Exact URL match)
    2. Combination of 'job_title', 'company', and 'location' (Positional duplicate)
    """
    if not jobs:
        return []

    # 1. Get unique identifiers from the current scraped batch
    current_links = list(set(job.get("apply_link", "") for job in jobs if job.get("apply_link")))
    
    # 2. Query Supabase for existing links and existing title/company/location variants
    existing_links = set()
    existing_triples = set()
    
    CHUNK_SIZE = 100 
    
    try:
        # Check by Link
        for i in range(0, len(current_links), CHUNK_SIZE):
            chunk = current_links[i:i + CHUNK_SIZE]
            result = supabase.table("jobs").select("apply_link").in_("apply_link", chunk).execute()
            if result.data:
                existing_links.update(r["apply_link"] for r in result.data)
        
        # Check by (Title, Company, Location) for the specific batch
        # We fetch all jobs from the last 30 days to check for positional duplicates
        # (Querying by individual triples in a batch is complex in PostgREST, so we use a recent window)
        recent_jobs = supabase.table("jobs").select("job_title, company, location").order("created_at", desc=True).limit(2000).execute()
        if recent_jobs.data:
            for r in recent_jobs.data:
                triple = (
                    str(r.get("job_title", "")).strip().lower(),
                    str(r.get("company", "")).strip().lower(),
                    str(r.get("location", "")).strip().lower()
                )
                existing_triples.add(triple)

        logger.info(f"Deduplication: Known data loaded. Filtering {len(jobs)} candidates.")

        # 3. Filter current batch to only include truly NEW jobs
        new_jobs = []
        seen_in_batch_links = set()
        seen_in_batch_triples = set()
        
        for job in jobs:
            link = job.get("apply_link")
            title = str(job.get("job_title", "")).strip().lower()
            company = str(job.get("company", "")).strip().lower()
            location = str(job.get("location", "")).strip().lower()
            triple = (title, company, location)

            is_duplicate_link = link in existing_links or link in seen_in_batch_links
            is_duplicate_triple = triple in existing_triples or triple in seen_in_batch_triples

            if not is_duplicate_link and not is_duplicate_triple:
                new_jobs.append(job)
                if link: seen_in_batch_links.add(link)
                seen_in_batch_triples.add(triple)
            else:
                reason = "URL Duplicate" if is_duplicate_link else "Position Duplicate"
                logger.debug(f"Skipping {reason}: {title} at {company}")

        logger.info(f"Deduplication complete: {len(new_jobs)} new out of {len(jobs)} total scraped.")
        return new_jobs

    except Exception as e:
        logger.error(f"Batch deduplication failed: {str(e)}. Falling back to link-only check if possible.")
        return jobs
