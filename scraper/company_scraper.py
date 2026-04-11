import asyncio
import logging
import random
from playwright.async_api import async_playwright
from typing import List, Dict

# Configure logging
logger = logging.getLogger(__name__)

async def scrape_company(company: Dict) -> List[Dict]:
    """
    Scrapes a company career page using Playwright.
    Includes retry logic with backoff.
    """
    url = company["careers_url"]
    max_jobs = company.get("max_jobs", 10)
    name = company["name"]
    
    attempts = 0
    max_retries = 3
    
    while attempts <= max_retries:
        try:
            async with async_playwright() as p:
                logger.info(f"Starting scrape for {name} (Attempt {attempts + 1})")
                browser = await p.chromium.launch(headless=True)
                # Create a context that ignores HTTPS errors
                context = await browser.new_context(ignore_https_errors=True)
                page = await context.new_page()
                
                # Navigate and wait for content
                await page.goto(url, wait_until="networkidle", timeout=60000)
                
                # Selectors for demonstration (Microsoft/Google)
                # In a real scenario, these would be specific to each company
                # Wait for content to load
                await page.wait_for_timeout(5000)

                jobs = []
                
                if "microsoft" in url.lower():
                    # Microsoft specific logic
                    await page.wait_for_selector("a[id^='job-card-']", timeout=20000)
                    cards = await page.query_selector_all("a[id^='job-card-']")
                    for card in cards[:max_jobs]:
                        # Get title from nested div
                        title_el = await card.query_selector("div[class*='job-title']")
                        title = await title_el.text_content() if title_el else await card.get_attribute("aria-label")
                        if title and "view job:" in title.lower():
                            title = title.lower().replace("view job:", "").strip().title()
                        
                        href = await card.get_attribute("href")
                        full_link = f"https://apply.careers.microsoft.com{href}" if href and href.startswith("/") else href
                        
                        if title and "page not found" not in title.lower():
                            # Extract location
                            loc_el = await card.query_selector("div[class*='location']")
                            location = await loc_el.text_content() if loc_el else "USA/UK"
                            
                            text_to_check = (title + " " + location).lower()

                            # STRICT FILTER: NO India, NO Remote, NO Hybrid
                            if any(k in text_to_check for k in ["india", "remote", "hybrid", "work from home", "wfh"]):
                                continue

                            jobs.append({
                                "job_title": title.strip(),
                                "company": name,
                                "location": location.strip(),
                                "apply_link": full_link,
                                "description": f"Position at Microsoft"
                            })

                elif "google" in url.lower():
                    # Google specific logic
                    await page.wait_for_selector("a[aria-label^='Learn more about']", timeout=20000)
                    cards = await page.query_selector_all("a[aria-label^='Learn more about']")
                    for card in cards[:max_jobs]:
                        title = await card.get_attribute("aria-label")
                        if title:
                            title = title.replace("Learn more about", "").strip()
                        
                        href = await card.get_attribute("href")
                        full_link = f"https://www.google.com/about/careers/applications/{href}" if href and not href.startswith("http") else href
                        
                        # Get location
                        loc_el = await card.query_selector("span[itemprop='addressLocality']")
                        location = await loc_el.text_content() if loc_el else "USA/UK"
                        
                        text_to_check = (title + " " + location).lower()
                        
                        if any(k in text_to_check for k in ["india", "remote", "hybrid", "work from home", "wfh"]):
                            continue

                        if title and "page not found" not in title.lower():
                             jobs.append({
                                "job_title": title.strip(),
                                "company": name,
                                "location": location.strip(),
                                "apply_link": full_link,
                                "description": f"Position at Google"
                            })

                # Fallback to generic if nothing found
                if not jobs:
                    found_elements = await page.query_selector_all("h1, h2, h3, h4")
                    for el in found_elements[:max_jobs]:
                        title = await el.text_content()
                        if title and len(title.strip()) > 5 and "page not found" not in title.lower():
                            jobs.append({
                                "job_title": title.strip(),
                                "company": name,
                                "location": "Remote / Hybrid",
                                "apply_link": url, 
                                "description": f"Position found at {name} career portal"
                            })

                await browser.close()
                logger.info(f"Successfully scraped {len(jobs)} jobs from {name}")
                return jobs

        except Exception as e:
            attempts += 1
            logger.error(f"Error scraping {name}: {str(e)}")
            if attempts <= max_retries:
                wait_time = 2 * attempts
                logger.info(f"Retrying in {wait_time} seconds...")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Failed to scrape {name} after {max_retries} retries")
                return []
    
    return []
