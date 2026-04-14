import logging
import asyncio
import urllib.parse
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_dice(keywords: List[str], page: Page) -> List[Dict]:
    """
    Scraper for Dice.com global search.
    Iterates through keywords and handles pagination.
    """
    all_jobs = []
    
    for keyword in keywords:
        logger.info(f"Searching Dice for: {keyword}")
        
        # Base search URL withUSA, On-site, and Full-time filters
        # Note: We use the raw URL parameters identified during research
        encoded_keyword = urllib.parse.quote(keyword)
        base_url = f"https://www.dice.com/jobs?q={encoded_keyword}&location=USA&filters.workSetting=On%20Site&filters.employmentType=Full%20Time"
        
        # Scrape up to 5 pages per keyword to respect CI time limits and avoid bans
        for page_num in range(1, 6):
            url = f"{base_url}&page={page_num}"
            try:
                logger.info(f"Dice: Fetching page {page_num} for {keyword}")
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                await page.wait_for_timeout(5000) # Give it time to render the cards
                
                # Dice job cards use d-card or similar
                # We wait for the results list
                await page.wait_for_selector("d-card", timeout=30000)
                
                cards = await page.query_selector_all("d-card")
                if not cards:
                    logger.info(f"No more Dice cards found on page {page_num}")
                    break
                    
                for card in cards:
                    try:
                        title_el = await card.query_selector("a.card-title-link")
                        title = await title_el.inner_text() if title_el else ""
                        href = await title_el.get_attribute("href") if title_el else ""
                        
                        company_el = await card.query_selector("a[data-cy='company-name']")
                        company_name = await company_el.inner_text() if company_el else "Unknown Company"
                        
                        location_el = await card.query_selector("span[data-cy='card-location']")
                        location = await location_el.inner_text() if location_el else "USA"
                        
                        if title and href:
                            all_jobs.append({
                                "job_title": title.strip(),
                                "company": company_name.strip(),
                                "location": location.strip(),
                                "apply_link": href,
                                "description": f"Position at {company_name} found on Dice. (On-site, Full-time)",
                                "date_posted": "Recent",
                                "source": "dice.com"
                            })
                    except Exception as e:
                        continue
                        
                # Random delay between pages
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Error on Dice page {page_num} for {keyword}: {e}")
                break
                
    return all_jobs
