import logging
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_workday(company: Dict, page: Page) -> List[Dict]:
    """
    Scraper for Workday career portals. Optimized for slow loading and Shadow DOM components.
    """
    url = company["careers_url"]
    name = company["name"]
    
    jobs = []
    
    try:
        # Load page with generous timeout
        await page.goto(url, wait_until="domcontentloaded", timeout=90000)
        
        # Workday portals often show a loading spinner for several seconds
        # We wait 15s to ensure the dynamic list has actually rendered
        await page.wait_for_timeout(15000)
        
        # We try multiple common Workday selectors in order of specificity
        selectors = [
            "[data-automation-id='jobTitle']",
            "li[data-automation-id='jobPosting']",
            "a[data-automation-id='jobTitle']",
            "section[data-automation-id='jobResults'] li"
        ]
        
        main_selector = None
        for selector in selectors:
            try:
                # Increased timeout for each check to handle huge latency
                await page.wait_for_selector(selector, timeout=60000)
                main_selector = selector
                break
            except Exception:
                continue
        
        if not main_selector:
            logger.warning(f"Workday: No job selectors found for {name} after waiting. Page may be empty or blocked.")
            return []

        # Extract titles and links
        elements = await page.query_selector_all(main_selector)
        
        for el in elements:
            try:
                # If we matched jobTitle directly, use it. Otherwise, look for it inside the row.
                title_el = el if "jobTitle" in main_selector else await el.query_selector("[data-automation-id='jobTitle']")
                
                if title_el:
                    title_text = await title_el.inner_text()
                    href = await title_el.get_attribute("href")
                    location = company.get("location", "USA")
                    
                    if title_text:
                        # FILTER: Skip Remote/Hybrid as per project requirements
                        title_lower = title_text.lower()
                        if any(k in title_lower for k in ["remote", "hybrid", "wfh", "telecommute"]):
                            continue

                        full_link = href if href and href.startswith("http") else url
                        jobs.append({
                            "job_title": title_text.strip(),
                            "company": name,
                            "location": location,
                            "apply_link": full_link,
                            "description": f"Position at {name} via Workday",
                            "date_posted": "Recent",
                            "source": "company_career_page"
                        })
            except Exception:
                continue
                
    except Exception as e:
        logger.error(f"Workday Error for {name}: {str(e)[:100]}")
        
    return jobs

