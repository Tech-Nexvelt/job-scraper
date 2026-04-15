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
            for card in cards:
                title_el = await card.query_selector("div[class*='job-title']")
                title = await title_el.inner_text() if title_el else await card.get_attribute("aria-label")
                if title and "view job:" in title.lower():
                    title = title.lower().replace("view job:", "").strip().title()
                
                href = await card.get_attribute("href")
                full_link = f"https://apply.careers.microsoft.com{href}" if href and href.startswith("/") else href
                
                if title and "page not found" not in title.lower():
                    # Use static location from config
                    location = company.get("location", "USA")
                    
                    # STRICT FILTER: Only Onsite, No Remote, No Hybrid
                    title_lower = title.lower()
                    location_lower = location.lower()
                    is_remote = any(k in title_lower or k in location_lower for k in ["remote", "hybrid", "wfh", "telecommute"])
                    if is_remote:
                        logger.info(f"Skipping remote/hybrid job at Microsoft: {title}")
                        continue

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
            for card in cards:
                title = await card.get_attribute("aria-label")
                if title:
                    title = title.replace("Learn more about", "").strip()
                
                href = await card.get_attribute("href")
                full_link = f"https://www.google.com/about/careers/applications/{href}" if href and not href.startswith("http") else href
                
                # Prioritize static location from config
                location = company.get("location", "USA")
                
                if title and "page not found" not in title.lower():
                    # STRICT FILTER: Only Onsite, No Remote, No Hybrid
                    title_lower = title.lower()
                    location_lower = location.lower()
                    is_remote = any(k in title_lower or k in location_lower for k in ["remote", "hybrid", "wfh", "telecommute"])
                    if is_remote:
                        logger.info(f"Skipping remote/hybrid job at Google: {title}")
                        continue

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

    elif "amazon" in name.lower():
        try:
            await page.wait_for_selector("h3.job-title", timeout=90000)
            cards = await page.query_selector_all("div.job")
            for card in cards:
                title_el = await card.query_selector("h3.job-title")
                title = await title_el.inner_text() if title_el else ""
                
                link_el = await card.query_selector("a.job-link")
                href = await link_el.get_attribute("href") if link_el else ""
                full_link = f"https://www.amazon.jobs{href}" if href and href.startswith("/") else href
                
                if title and "remote" not in title.lower():
                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": company.get("location", "USA"),
                        "apply_link": full_link,
                        "description": f"Position at Amazon",
                        "date_posted": "Recent",
                        "source": "company_career_page"
                    })
        except Exception as e:
            logger.error(f"Error scraping Amazon: {e}")

    elif "apple" in name.lower():
        try:
            await page.wait_for_selector("a.table--column__link", timeout=90000)
            cards = await page.query_selector_all("tr.table-row")
            for card in cards:
                title_el = await card.query_selector("a.table--column__link")
                title = await title_el.inner_text() if title_el else ""
                href = await title_el.get_attribute("href") if title_el else ""
                full_link = f"https://jobs.apple.com{href}" if href and href.startswith("/") else href
                
                if title and "remote" not in title.lower():
                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": company.get("location", "USA"),
                        "apply_link": full_link,
                        "description": f"Position at Apple",
                        "date_posted": "Recent",
                        "source": "company_career_page"
                    })
        except Exception as e:
            logger.error(f"Error scraping Apple: {e}")

    elif "exxonmobil" in name.lower() or "jobs.exxonmobil.com" in url:
        try:
            await page.wait_for_selector("a.jobTitle-link", timeout=90000)
            cards = await page.query_selector_all("tr.job-tile")
            for card in cards:
                title_el = await card.query_selector("a.jobTitle-link")
                title = await title_el.inner_text() if title_el else ""
                href = await title_el.get_attribute("href") if title_el else ""
                full_link = f"https://jobs.exxonmobil.com{href}" if href and href.startswith("/") else href
                
                if title:
                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": company.get("location", "USA"),
                        "apply_link": full_link,
                        "description": f"Position at ExxonMobil",
                        "date_posted": "Recent",
                        "source": "company_career_page"
                    })
        except Exception as e:
            logger.error(f"Error scraping ExxonMobil: {e}")

    # Generic fallback
    if not jobs:
        try:
            found_elements = await page.query_selector_all("h1, h2, h3, h4")
            for el in found_elements:
                title = await el.inner_text()
                if title and len(title.strip()) > 5 and "page not found" not in title.lower():
                    # Use static location from config
                    location = company.get("location", "USA")
                    
                    # STRICT FILTER: Only Onsite, No Remote, No Hybrid
                    title_lower = title.lower()
                    location_lower = location.lower()
                    is_remote = any(k in title_lower or k in location_lower for k in ["remote", "hybrid", "wfh", "telecommute"])
                    if is_remote:
                        continue

                    jobs.append({
                        "job_title": title.strip(),
                        "company": name,
                        "location": location.strip(),
                        "apply_link": url, 
                        "description": f"Position found at {name} career portal",
                        "date_posted": "Recent",
                        "source": "company_career_page"
                    })
        except Exception as e:
            logger.error(f"Error in generic fallback for {name}: {e}")

    return jobs
