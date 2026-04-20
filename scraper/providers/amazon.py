import logging
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_amazon(company: Dict, page: Page) -> List[Dict]:
    """
    Specialized scraper for Amazon Jobs (amazon.jobs).
    Handles dynamic loading and specific job card selectors.
    """
    url = company["careers_url"]
    name = company["name"]
    
    jobs = []
    
    try:
        # Navigate to Amazon Jobs
        # Amazon often redirects to a search page if you go to the root careers URL
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        
        # Wait for the main job results to appear
        # Amazon uses specific classes like 'job-tile' or 'job'
        try:
            await page.wait_for_selector("div.job-tile, div.job", timeout=15000)
        except:
            logger.warning(f"Amazon: Job tiles not found on {url}. Possibly a landing page. Searching for 'View Jobs' button.")
            # If on landing page, try to find a link to the search page
            search_link = await page.query_selector("a[href*='/search']")
            if search_link:
                await search_link.click()
                await page.wait_for_selector("div.job-tile, div.job", timeout=30000)

        # Extract job cards
        cards = await page.query_selector_all("div.job-tile, div.job")
        
        for card in cards:
            try:
                title_el = await card.query_selector("h3.job-title, .title")
                title = await title_el.inner_text() if title_el else ""
                
                link_el = await card.query_selector("a.job-link, a")
                href = await link_el.get_attribute("href") if link_el else ""
                full_link = f"https://www.amazon.jobs{href}" if href and href.startswith("/") else href
                
                # Extract location if available on the card
                location_el = await card.query_selector(".location, .location-and-id")
                card_location = await location_el.inner_text() if location_el else company.get("location", "USA")
                
                if title:
                    # STRICT FILTER: Only Onsite, No Remote, No Hybrid
                    title_lower = title.lower()
                    loc_lower = card_location.lower()
                    is_remote = any(k in title_lower or k in loc_lower for k in ["remote", "hybrid", "wfh", "telecommute"])
                    
                    if is_remote:
                        continue

                    # NEW: 2-Day Freshness Filter
                    if any(x in loc_lower or x in title_lower for x in ["3 days ago", "4 days ago", "weeks ago"]):
                        continue

                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": card_location.strip(),
                        "apply_link": full_link,
                        "description": f"Position at Amazon",
                        "date_posted": "Recent (48h)",
                        "source": "company_career_page"
                    })
            except Exception as e:
                continue

    except Exception as e:
        logger.error(f"Amazon Scraper Error: {str(e)[:100]}")
        
    return jobs
