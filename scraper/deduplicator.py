import logging
from typing import List, Dict
from scraper.supabase_client import supabase

logger = logging.getLogger(__name__)

def is_duplicate(apply_link: str) -> bool:
    """
    Checks if a job with the given apply link already exists in the database.
    """
    if not apply_link:
        return False
    try:
        result = supabase.table("jobs").select("id").eq("apply_link", apply_link).execute()
        return len(result.data) > 0
    except Exception as e:
        logger.error(f"Deduplication check failed for {apply_link}: {str(e)}")
        return False

def filter_new_jobs(jobs: List[Dict]) -> List[Dict]:
    """
    Filters out jobs that are already present in the database based on apply_link.
    """
    new_jobs = []
    for job in jobs:
        link = job.get("apply_link", "")
        if not is_duplicate(link):
            new_jobs.append(job)
        else:
            logger.debug(f"Skipping duplicate job: {link}")
            
    logger.info(f"Deduplication complete: {len(new_jobs)} new out of {len(jobs)} total jobs")
    return new_jobs
