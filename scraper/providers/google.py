import logging
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_google(company: Dict, page: Page) -> List[Dict]:
    """
    Specialized scraper for Google Careers.
    """
    url = company["careers_url"]
    name = company["name"]
    
    jobs = []
    
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(8000)
        
        # Google uses aria-labels for job links
        await page.wait_for_selector("a[aria-label^='Learn more about']", timeout=30000)
        cards = await page.query_selector_all("a[aria-label^='Learn more about']")
        
        for card in cards:
            try:
                title = await card.get_attribute("aria-label")
                if title:
                    title = title.replace("Learn more about", "").strip()
                
                href = await card.get_attribute("href")
                # Google URLs are often relative
                full_link = f"https://www.google.com/about/careers/applications/{href}" if href and not href.startswith("http") else href
                
                if title and "page not found" not in title.lower():
                    # STRICT FILTER: Only Onsite, No Remote, No Hybrid
                    if any(k in title.lower() for k in ["remote", "hybrid", "wfh"]):
                        continue

                    # NEW: 2-Day Freshness Filter
                    if any(x in title.lower() for x in ["3 days ago", "4 days ago", "weeks ago"]):
                        continue

                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": company.get("location", "USA"),
                        "apply_link": full_link,
                        "description": f"Position at Google",
                        "date_posted": "Recent (48h)",
                        "source": "company_career_page"
                    })
            except Exception:
                continue
                
    except Exception as e:
        logger.error(f"Google Scraper Error: {str(e)[:100]}")
        
    return jobs
