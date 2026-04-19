import os
import logging
from collections import defaultdict
from scraper.supabase_client import supabase

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def cleanup_duplicates(dry_run=True):
    """
    Finds and removes 'true' duplicates (same title, company, location).
    Keeps the most recent entry.
    """
    logger.info(f"Starting cleanup (Dry Run: {dry_run})...")
    
    try:
        # 1. Fetch all jobs
        all_data = []
        batch_size = 1000
        offset = 0
        
        while True:
            result = supabase.table("jobs").select("*").range(offset, offset + batch_size - 1).execute()
            if not result.data:
                break
            all_data.extend(result.data)
            if len(result.data) < batch_size:
                break
            offset += batch_size

        logger.info(f"Fetched {len(all_data)} records for analysis.")

        # 2. Group by Title + Company + Location
        groups = defaultdict(list)
        for job in all_data:
            # Create a unique key for the triplet
            key = (
                str(job.get("job_title", "")).strip().lower(),
                str(job.get("company", "")).strip().lower(),
                str(job.get("location", "")).strip().lower()
            )
            groups[key].append(job)

        # 3. Identify records to delete
        to_delete_ids = []
        for key, jobs in groups.items():
            if len(jobs) > 1:
                # Sort by created_at descending (newest first)
                # Handle cases where created_at might be None
                sorted_jobs = sorted(
                    jobs, 
                    key=lambda x: x.get("created_at") or "0000", 
                    reverse=True
                )
                
                # Keep the 1st one (newest), delete the others
                to_keep = sorted_jobs[0]
                redundant = sorted_jobs[1:]
                
                for r in redundant:
                    to_delete_ids.append(r["id"])
                
                logger.info(f"Group {key}: Found {len(redundant)} duplicates. Keeping ID: {to_keep['id']}")

        logger.info(f"Total redundant records identified: {len(to_delete_ids)}")

        if not to_delete_ids:
            logger.info("No duplicates found. Nothing to do.")
            return

        # 4. Execute Deletion
        if dry_run:
            logger.info(f"[DRY RUN] Would have deleted {len(to_delete_ids)} records.")
        else:
            logger.info(f"Deleting {len(to_delete_ids)} records...")
            # Batch delete
            for i in range(0, len(to_delete_ids), 100):
                chunk = to_delete_ids[i:i + 100]
                supabase.table("jobs").delete().in_("id", chunk).execute()
            logger.info("Deletion complete.")

    except Exception as e:
        logger.error(f"Cleanup failed: {e}")

if __name__ == "__main__":
    # Execution mode
    cleanup_duplicates(dry_run=False)
