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
        # domcontentloaded is better for Workday; we add a manual wait after
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        
        # Workday takes significant time to render the dynamic list
        await page.wait_for_timeout(8000)
        
        # Increased timeout and added retry for the main selector
        selector = "[data-automation-id='jobTitle']"
        try:
            await page.wait_for_selector(selector, timeout=60000)
        except Exception:
            # Try a broader selector if specifically tagged one fails
            logger.warning(f"Secondary selector check for {name}")
            await page.wait_for_selector("li[data-automation-id='jobPosting']", timeout=20000)
            selector = "li[data-automation-id='jobPosting']"
            
        # Extract titles and links
        elements = await page.query_selector_all(selector)
        
        for el in elements:
            # If we matched jobTitle directly, use it. If we matched posting, find title inside.
            title_el = el if selector == "[data-automation-id='jobTitle']" else await el.query_selector("[data-automation-id='jobTitle']")
            
            if title_el:
                title_text = await title_el.inner_text()
                href = await title_el.get_attribute("href")
                
                # Use static location from config
                location = company.get("location", "USA")
                
                if title_text:
                    # STRICT FILTER: Only Onsite, No Remote, No Hybrid
                    title_lower = title_text.lower()
                    location_lower = location.lower()
                    
                    is_remote = any(k in title_lower or k in location_lower for k in ["remote", "hybrid", "wfh", "telecommute"])
                    if is_remote:
                        logger.info(f"Skipping remote/hybrid job at {name}: {title_text}")
                        continue

                    full_link = href if href and href.startswith("http") else url # Fallback to portal URL
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
