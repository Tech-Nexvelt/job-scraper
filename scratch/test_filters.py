import asyncio
import logging
from scraper.providers.linkedin import scrape_linkedin
from scraper.providers.dice import scrape_dice
from playwright.async_api import async_playwright

# Configure logging to see what's happening
logging.basicConfig(level=logging.INFO)

async def test_scrapers():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        test_keywords = ["Data Analyst"]
        
        print(f"\n--- Testing LinkedIn (24h filter) ---")
        li_jobs = await scrape_linkedin(test_keywords, page)
        print(f"LinkedIn found {len(li_jobs)} jobs.")
        
        print(f"\n--- Testing Dice (24h filter) ---")
        dice_jobs = await scrape_dice(test_keywords, page)
        print(f"Dice found {len(dice_jobs)} jobs.")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_scrapers())
