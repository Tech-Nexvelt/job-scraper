import logging
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_apple(company: Dict, page: Page) -> List[Dict]:
    """
    Specialized scraper for Apple Jobs (jobs.apple.com).
    """
    url = company["careers_url"]
    name = company["name"]
    
    jobs = []
    
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=360000)
        await page.wait_for_timeout(8000)
        
        # Apple uses table rows for job listings
        await page.wait_for_selector("tr.table-row", timeout=30000)
        cards = await page.query_selector_all("tr.table-row")
        
        for card in cards:
            try:
                title_el = await card.query_selector("a.table--column__link")
                title = await title_el.inner_text() if title_el else ""
                href = await title_el.get_attribute("href") if title_el else ""
                full_link = f"https://jobs.apple.com{href}" if href and href.startswith("/") else href
                
                # Location is often in a specific table cell
                loc_el = await card.query_selector("td.table--column__location")
                location = await loc_el.inner_text() if loc_el else company.get("location", "USA")
                
                if title:
                    # STRICT FILTER: Only Onsite
                    title_lower = title.lower()
                    if any(k in title_lower for k in ["remote", "hybrid", "wfh"]):
                        continue

                    # NEW: 2-Day Freshness Filter
                    if any(x in title_lower for x in ["3 days ago", "4 days ago", "weeks ago"]):
                        continue

                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": location.strip(),
                        "apply_link": full_link,
                        "description": f"Position at Apple",
                        "date_posted": "Recent (48h)",
                        "source": "company_career_page"
                    })
            except Exception:
                continue
                
    except Exception as e:
        logger.error(f"Apple Scraper Error: {str(e)[:100]}")
        
    return jobs
