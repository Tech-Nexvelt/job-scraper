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
        await page.goto(url, wait_until="networkidle", timeout=60000)
        await page.wait_for_selector(".posting", timeout=20000)
        
        postings = await page.query_selector_all(".posting")
        for posting in postings[:max_jobs]:
            title_el = await posting.query_selector("h5")
            title = await title_el.text_content() if title_el else ""
            
            link_el = await posting.query_selector("a.posting-title")
            href = await link_el.get_attribute("href") if link_el else ""
            
            # Use static location from config
            location = company.get("location", "USA")
            
            if title and href:
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
