import logging
import asyncio
import urllib.parse
from datetime import datetime
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
        
        encoded_keyword = urllib.parse.quote(keyword)
        # Added filters.postedDate=ONE for past 24 hours
        base_url = f"https://www.dice.com/jobs?q={encoded_keyword}&location=USA&filters.workSetting=On%20Site&filters.employmentType=Full%20Time&filters.postedDate=ONE"
        
        # Scrape up to 5 pages (reduced from 10 to avoid bot detection while being resilient)
        for page_num in range(1, 6):
            url = f"{base_url}&page={page_num}"
            try:
                logger.info(f"Dice: Fetching page {page_num} for {keyword}")
                # Use longer timeout for navigation
                await page.goto(url, wait_until="load", timeout=90000)
                
                # Check for "Zero Results" messages so we don't wait for selectors in vain
                no_results_text = ["we couldn't find any jobs", "0 jobs matching", "no results found"]
                content = await page.content()
                if any(msg in content.lower() for msg in no_results_text):
                    logger.info(f"Dice: No results found for '{keyword}', skipping page.")
                    break

                # Wait for results or empty state - increased to 120s
                # We try multiple common selectors for Dice cards
                try:
                    await page.wait_for_selector("d-card, [data-cy='card-title-link'], .card-title-link", timeout=120000)
                except Exception:
                    logger.warning(f"Dice: Timeout waiting for cards on page {page_num}. Page might be blocked or empty.")
                    break
                
                cards = await page.query_selector_all("d-card, .search-card")
                if not cards:
                    logger.info(f"No more Dice cards found on page {page_num}")
                    break
                    
                for card in cards:
                    try:
                        title_el = await card.query_selector("a.card-title-link, [data-cy='card-title-link']")
                        title = await title_el.inner_text() if title_el else ""
                        href = await title_el.get_attribute("href") if title_el else ""
                        
                        company_el = await card.query_selector("a[data-cy='company-name'], .card-company")
                        company_name = await company_el.inner_text() if company_el else "Unknown Company"
                        
                        location_el = await card.query_selector("span[data-cy='card-location'], .card-location")
                        location = await location_el.inner_text() if location_el else "USA"

                        posted_el = await card.query_selector("span[data-cy='card-posted-date'], .card-posted-date")
                        posted_date = await posted_el.inner_text() if posted_el else "Today"
                        
                        if title and href:
                            all_jobs.append({
                                "job_title": title.strip(),
                                "company": company_name.strip(),
                                "location": location.strip(),
                                "apply_link": href,
                                "description": f"Position at {company_name} found on Dice. (On-site, Full-time)",
                                "date_posted": posted_date.strip(),
                                "source": "dice.com",
                                "last_scraped_at": datetime.now().isoformat()
                            })
                    except Exception:
                        continue
                        
                # Anti-bot delay
                await asyncio.sleep(3)
                
            except Exception as e:
                logger.error(f"Dice Error for {keyword} on page {page_num}: {str(e)[:100]}")
                break
                
    return all_jobs

