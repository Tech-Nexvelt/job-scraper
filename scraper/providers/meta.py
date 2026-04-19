import logging
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_meta(company: Dict, page: Page) -> List[Dict]:
    """
    Specialized scraper for Meta Careers (metacareers.com).
    """
    url = company["careers_url"]
    name = company["name"]
    
    jobs = []
    
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=360000)
        await page.wait_for_timeout(8000)
        
        # Meta uses a specific card structure
        await page.wait_for_selector("div[role='listitem']", timeout=30000)
        cards = await page.query_selector_all("div[role='listitem']")
        
        for card in cards:
            try:
                # Meta titles are often in nested divs with specific roles or labels
                title_el = await card.query_selector("a div, h4")
                title = await title_el.inner_text() if title_el else ""
                
                link_el = await card.query_selector("a")
                href = await link_el.get_attribute("href") if link_el else ""
                full_link = f"https://www.metacareers.com{href}" if href and href.startswith("/") else href
                
                if title:
                    # STRICT FILTER: Only Onsite
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
                        "description": f"Position at Meta",
                        "date_posted": "Recent (48h)",
                        "source": "company_career_page"
                    })
            except Exception:
                continue
                
    except Exception as e:
        logger.error(f"Meta Scraper Error: {str(e)[:100]}")
        
    return jobs
