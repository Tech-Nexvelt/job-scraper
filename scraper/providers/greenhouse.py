import logging
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_greenhouse(company: Dict, page: Page) -> List[Dict]:
    """
    Scraper for Greenhouse career boards
    """
    url = company["careers_url"]
    name = company["name"]
    max_jobs = company.get("max_jobs", 20)
    
    jobs = []
    
    try:
        await page.goto(url, wait_until="networkidle", timeout=60000)
        # Greenhouse boards often load dynamic content or are static
        # Let's wait for common greenhouse elements
        await page.wait_for_selector(".opening", timeout=20000)
        
        cards = await page.query_selector_all(".opening")
        for card in cards[:max_jobs]:
            link_el = await card.query_selector("a")
            title = await link_el.text_content() if link_el else ""
            href = await link_el.get_attribute("href") if link_el else ""
            
            # Use static location from config
            location = company.get("location", "USA")
            
            if title and href:
                full_link = href if href.startswith("http") else f"https://boards.greenhouse.io{href}"
                jobs.append({
                    "job_title": title.strip(),
                    "company": name,
                    "location": location.strip(),
                    "apply_link": full_link,
                    "description": f"Position at {name} via Greenhouse",
                    "date_posted": "Recent",
                    "source": "company_career_page"
                })
    except Exception as e:
        logger.error(f"Error scraping Greenhouse for {name}: {e}")
        
    return jobs
