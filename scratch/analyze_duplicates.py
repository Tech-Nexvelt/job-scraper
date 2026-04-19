import os
from collections import defaultdict
from scraper.supabase_client import supabase

def analyze_duplicates():
    print("Connecting to Supabase and fetching all jobs...")
    try:
        # Fetch all jobs (handle pagination if necessary, but 2360 should fit in a few batches)
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

        print(f"Total records in database: {len(all_data)}")

        # Group by Title + Company
        groups = defaultdict(list)
        for job in all_data:
            key = (job.get("job_title", "").strip().lower(), job.get("company", "").strip().lower())
            groups[key].append(job)

        # Count groups
        unique_groups = len(groups)
        groups_with_multiple = {k: v for k, v in groups.items() if len(v) > 1}
        
        print(f"\nAnalysis Summary:")
        print(f"-----------------")
        print(f"Total Unique Job combinations (Title + Company): {unique_groups}")
        print(f"Number of groups containing 'duplicates': {len(groups_with_multiple)}")
        
        total_redundant = sum(len(v) - 1 for v in groups_with_multiple.values())
        print(f"Total extra records (potential duplicates): {total_redundant}")

        # Show examples
        print(f"\nExample Duplicates for Review:")
        print(f"----------------------------")
        
        # Pick 3 examples
        examples = list(groups_with_multiple.items())[:5]
        for (title, company), jobs in examples:
            print(f"\nJOB: {title.upper()} at {company.upper()}")
            for i, j in enumerate(jobs):
                print(f"  {i+1}. Source: {j.get('source')} | Link: {j.get('apply_link')[:80]}...")
                print(f"     Location: {j.get('location')} | Added: {j.get('created_at')}")

    except Exception as e:
        print(f"Error during analysis: {e}")

if __name__ == "__main__":
    analyze_duplicates()
