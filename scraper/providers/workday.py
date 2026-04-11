import logging
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_workday(company: Dict, page: Page) -> List[Dict]:
    """
    Scraper for Workday career portals
    """
    url = company["careers_url"]
    name = company["name"]
    max_jobs = company.get("max_jobs", 20)
    
    jobs = []
    
    try:
        await page.goto(url, wait_until="networkidle", timeout=60000)
        # Workday often takes time to render
        await page.wait_for_timeout(5000)
        
        # Common workday selectors
        await page.wait_for_selector("[data-automation-id='jobTitle']", timeout=20000)
        
        # In Workday, jobs are often in a list. 
        # Title element usually has the link or is inside a link
        titles = await page.query_selector_all("[data-automation-id='jobTitle']")
        
        for title_el in titles[:max_jobs]:
            title_text = await title_el.text_content()
            
            # Find the link (usually parent or sibling)
            # Often it's an 'a' tag with data-automation-id='jobTitle'
            href = await title_el.get_attribute("href")
            
            # Use static location from config
            location = company.get("location", "USA")
            
            if title_text:
                full_link = href if href and href.startswith("http") else url # Fallback to portal URL if not found
                jobs.append({
                    "job_title": title_text.strip(),
                    "company": name,
                    "location": location,
                    "apply_link": full_link,
                    "description": f"Position at {name} via Workday",
                    "date_posted": "Recent",
                    "source": "company_career_page"
                })
    except Exception as e:
        logger.error(f"Error scraping Workday for {name}: {e}")
        
    return jobs
