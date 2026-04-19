import logging
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_microsoft(company: Dict, page: Page) -> List[Dict]:
    """
    Specialized scraper for Microsoft Careers.
    Handles the unique job card structure and dynamic loading.
    """
    url = company["careers_url"]
    name = company["name"]
    
    jobs = []
    
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=360000)
        await page.wait_for_timeout(8000)
        
        # Microsoft uses specific job card anchors
        await page.wait_for_selector("a[id^='job-card-']", timeout=30000)
        cards = await page.query_selector_all("a[id^='job-card-']")
        
        for card in cards:
            try:
                title_el = await card.query_selector("div[class*='job-title']")
                title = await title_el.inner_text() if title_el else await card.get_attribute("aria-label")
                
                # Clean up "View Job: ..." prefix if present
                if title and "view job:" in title.lower():
                    title = title.lower().replace("view job:", "").strip().title()
                
                href = await card.get_attribute("href")
                full_link = f"https://apply.careers.microsoft.com{href}" if href and href.startswith("/") else href
                
                if title and "page not found" not in title.lower():
                    # STRICT FILTER: Only Onsite, No Remote, No Hybrid
                    title_lower = title.lower()
                    is_remote = any(k in title_lower for k in ["remote", "hybrid", "wfh", "telecommute"])
                    if is_remote:
                        continue

                    # NEW: 2-Day Freshness Filter
                    if any(x in title_lower for x in ["3 days ago", "4 days ago", "weeks ago"]):
                        continue

                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": company.get("location", "USA"),
                        "apply_link": full_link,
                        "description": f"Position at Microsoft",
                        "date_posted": "Recent (48h)",
                        "source": "company_career_page"
                    })
            except Exception:
                continue
                
    except Exception as e:
        logger.error(f"Microsoft Scraper Error: {str(e)[:100]}")
        
    return jobs
