import logging
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_lever(company: Dict, page: Page) -> List[Dict]:
    """
    Scraper for Lever career boards
    """
    url = company["careers_url"]
    name = company["name"]
    max_jobs = company.get("max_jobs", 20)
    
    jobs = []
    
    try:
        # domcontentloaded is faster and more reliable than networkidle (Timeout reduced to 60s)
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        
        # Lever is usually fast, but let's give it a 3s buffer
        await page.wait_for_timeout(3000)
        
        # Reduced timeout to 60s to avoid stalling
        await page.wait_for_selector(".posting", timeout=60000)
        
        postings = await page.query_selector_all(".posting")
        for posting in postings:
            title_el = await posting.query_selector("h5")
            title = await title_el.inner_text() if title_el else ""
            
            link_el = await posting.query_selector("a.posting-title")
            href = await link_el.get_attribute("href") if link_el else ""
            
            # Use static location from config
            location = company.get("location", "USA")
            
            if title and href:
                # STRICT FILTER: Only Onsite, No Remote, No Hybrid
                title_lower = title.lower()
                location_lower = location.lower()
                
                is_remote = any(k in title_lower or k in location_lower for k in ["remote", "hybrid", "wfh", "telecommute"])
                if is_remote:
                    logger.info(f"Skipping remote/hybrid job at {name}: {title}")
                    continue

                jobs.append({
                    "job_title": title.strip(),
                    "company": name,
                    "location": location.strip(),
                    "apply_link": href,
                    "description": f"Position at {name} via Lever",
                    "date_posted": "Recent",
                    "source": "company_career_page"
                })
    except Exception as e:
        logger.error(f"Error scraping Lever for {name}: {e}")
        
    return jobs
