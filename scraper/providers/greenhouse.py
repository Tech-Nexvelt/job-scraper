import logging
import json
import httpx
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_greenhouse(company: Dict, page: Page) -> List[Dict]:
    """
    Scraper for Greenhouse career boards using their public JSON API.
    Faster, more reliable, and bypasses custom UIs/redirections.
    """
    url = company["careers_url"]
    name = company["name"]
    
    # Extract board token from URL (e.g., dropbox from boards.greenhouse.io/dropbox)
    token = url.rstrip("/").split("/")[-1]
    api_url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs"
    
    jobs = []
    
    try:
        # Use httpx for a faster, lighter request than opening a browser tab
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(api_url)
            if response.status_code != 200:
                logger.error(f"Greenhouse API error for {name}: {response.status_code}")
                return []
            
            data = response.json()
            raw_jobs = data.get("jobs", [])
            
            for job in raw_jobs:
                title = job.get("title", "")
                location_data = job.get("location", {})
                location_name = location_data.get("name", "USA")
                apply_link = job.get("absolute_url", "")
                
                if title and apply_link:
                    # STRICT FILTER: Only Onsite, No Remote, No Hybrid
                    title_lower = title.lower()
                    location_lower = location_name.lower()
                    
                    is_remote = any(k in title_lower or k in location_lower for k in ["remote", "hybrid", "wfh", "telecommute"])
                    if is_remote:
                        continue

                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": location_name.strip(),
                        "apply_link": apply_link,
                        "description": f"Position at {name} via Greenhouse API",
                        "date_posted": "Recent",
                        "source": "company_career_page"
                    })
        
        logger.info(f"Greenhouse API found {len(jobs)} onsite jobs for {name}")
                
    except Exception as e:
        logger.error(f"Error scraping Greenhouse API for {name}: {e}")
        
    return jobs
