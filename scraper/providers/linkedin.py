import logging
import asyncio
import urllib.parse
from playwright.async_api import Page
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_linkedin(keywords: List[str], page: Page) -> List[Dict]:
    """
    Scraper for LinkedIn Public (Guest) Search.
    Uses filters for On-site (f_WT=1) and Full-time (f_JT=F).
    """
    all_jobs = []
    
    for keyword in keywords:
        logger.info(f"Searching LinkedIn for: {keyword}")
        
        encoded_keyword = urllib.parse.quote(keyword)
        # f_WT=1 (On-site), f_JT=F (Full-time), f_TPR=r172800 (Past 48 Hours)
        base_url = f"https://www.linkedin.com/jobs/search?keywords={encoded_keyword}&location=United%20States&f_WT=1&f_JT=F&f_TPR=r172800"
        
        # Scrape up to 5 pages (125 jobs) per keyword (Reduced from 10 to save time)
        for page_num in range(0, 5):
            start = page_num * 25
            url = f"{base_url}&start={start}"
            
            try:
                logger.info(f"LinkedIn: Fetching results {start}-{start+25} for {keyword}")
                
                # Adding a more realistic header for LinkedIn
                await page.set_extra_http_headers({
                    "Accept-Language": "en-US,en;q=0.9",
                    "Referer": "https://www.google.com/"
                })
                
                # Set a reasonable timeout for LinkedIn navigation
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)
                await page.wait_for_timeout(4000) # Wait for cards
                
                # Scroll a bit to trigger more loading if it's dynamic
                await page.evaluate("window.scrollTo(0, 1000)")
                await page.wait_for_timeout(2000)
                
                # Guest search cards use .base-card or similar
                try:
                    await page.wait_for_selector(".base-card", timeout=20000)
                except:
                    logger.warning(f"No LinkedIn cards found for {keyword} at start={start}")
                    break
                    
                cards = await page.query_selector_all(".base-card")
                if not cards:
                    break
                    
                for card in cards:
                    try:
                        title_el = await card.query_selector(".base-search-card__title")
                        title = await title_el.inner_text() if title_el else ""
                        
                        link_el = await card.query_selector(".base-card__full-link")
                        href = await link_el.get_attribute("href") if link_el else ""
                        
                        company_el = await card.query_selector(".base-search-card__subtitle")
                        company_name = await company_el.inner_text() if company_el else "Unknown Company"
                        
                        location_el = await card.query_selector(".job-search-card__location")
                        location = await location_el.inner_text() if location_el else "USA"

                        posted_el = await card.query_selector("time.job-search-card__listdate, time.job-search-card__listdate--new")
                        posted_date = await posted_el.inner_text() if posted_el else "Today"
                        
                        if title and href:
                            # Clean up URL (LinkedIn URLs often have tracking params)
                            clean_href = href.split("?")[0]
                            
                            all_jobs.append({
                                "job_title": title.strip(),
                                "company": company_name.strip(),
                                "location": location.strip(),
                                "apply_link": clean_href,
                                "description": f"Position at {company_name} found on LinkedIn. (On-site, Full-time)",
                                "date_posted": posted_date.strip(),
                                "source": "linkedin.com"
                            })
                    except Exception as e:
                        continue
                
                # Aggressive bot detection prevention
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error on LinkedIn start={start} for {keyword}: {e}")
                break
                
    return all_jobs
