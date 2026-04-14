import logging
from playwright.async_api import Page, BrowserContext
from typing import List, Dict

logger = logging.getLogger(__name__)

async def scrape_custom(company: Dict, page: Page) -> List[Dict]:
    """
    Scraper for custom career pages (Microsoft, Google, etc.)
    """
    url = company["careers_url"]
    name = company["name"]
    max_jobs = company.get("max_jobs", 20)
    
    jobs = []
    
    # Navigate to URL
    await page.goto(url, wait_until="domcontentloaded", timeout=60000)
    await page.wait_for_timeout(5000)
    
    if "microsoft" in name.lower():
        try:
            await page.wait_for_selector("a[id^='job-card-']", timeout=40000)
            cards = await page.query_selector_all("a[id^='job-card-']")
            for card in cards[:max_jobs]:
                title_el = await card.query_selector("div[class*='job-title']")
                title = await title_el.inner_text() if title_el else await card.get_attribute("aria-label")
                if title and "view job:" in title.lower():
                    title = title.lower().replace("view job:", "").strip().title()
                
                href = await card.get_attribute("href")
                full_link = f"https://apply.careers.microsoft.com{href}" if href and href.startswith("/") else href
                
                if title and "page not found" not in title.lower():
                    # Use static location from config
                    location = company.get("location", "USA")
                    
                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": location.strip(),
                        "apply_link": full_link,
                        "description": f"Position at Microsoft",
                        "date_posted": "Recent",
                        "source": "company_career_page"
                    })
        except Exception as e:
            logger.error(f"Error scraping Microsoft: {e}")

    elif "google" in name.lower():
        try:
            await page.wait_for_selector("a[aria-label^='Learn more about']", timeout=40000)
            cards = await page.query_selector_all("a[aria-label^='Learn more about']")
            for card in cards[:max_jobs]:
                title = await card.get_attribute("aria-label")
                if title:
                    title = title.replace("Learn more about", "").strip()
                
                href = await card.get_attribute("href")
                full_link = f"https://www.google.com/about/careers/applications/{href}" if href and not href.startswith("http") else href
                
                # Prioritize static location from config
                location = company.get("location", "USA")
                
                if title and "page not found" not in title.lower():
                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": location.strip(),
                        "apply_link": full_link,
                        "description": f"Position at Google",
                        "date_posted": "Recent",
                        "source": "company_career_page"
                    })
        except Exception as e:
            logger.error(f"Error scraping Google: {e}")

    # Generic fallback
    if not jobs:
        try:
            found_elements = await page.query_selector_all("h1, h2, h3, h4")
            for el in found_elements[:max_jobs]:
                title = await el.inner_text()
                if title and len(title.strip()) > 5 and "page not found" not in title.lower():
                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": company.get("location", "USA"),
                        "apply_link": url, 
                        "description": f"Position found at {name} career portal",
                        "date_posted": "Recent",
                        "source": "company_career_page"
                    })
        except Exception as e:
            logger.error(f"Error in generic fallback for {name}: {e}")

    return jobs
