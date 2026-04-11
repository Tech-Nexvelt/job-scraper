import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from scraper.run_scraper import run

# Configure logging for the scheduler
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

async def main():
    """
    Initializes and starts the APScheduler to run the scraper daily at 10 PM.
    """
    scheduler = AsyncIOScheduler()
    
    # Add the scraper job to run every day at 10:00 PM (22:00)
    scheduler.add_job(
        run,
        CronTrigger(hour=22, minute=0),
        id="job_scraper_daily",
        replace_existing=True
    )
    
    # Also trigger one immediate run on startup for demonstration
    # logger.info("Triggering initial scraper run on startup...")
    # await run()

    scheduler.start()
    logger.info("Scheduler started successfully. Scraper will run daily at 10:00 PM IST.")

    try:
        # Keep the event loop running
        while True:
            await asyncio.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()
        logger.info("Scheduler shut down successfully.")

if __name__ == "__main__":
    asyncio.run(main())
