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
        # domcontentloaded is faster and more reliable than networkidle for career pages
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        
        # Give a moment for initial scripts to run
        await page.wait_for_timeout(3000)
        
        # Scroll to bottom to trigger lazy loading
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(2000)
        
        # Increased timeout for CI environments
        await page.wait_for_selector(".opening", timeout=45000)
        
        cards = await page.query_selector_all(".opening")
        for card in cards:
            link_el = await card.query_selector("a")
            # Get text content while filtering out extra whitespace
            title = await link_el.inner_text() if link_el else ""
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

                # Handle relative links
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
