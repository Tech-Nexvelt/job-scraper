import os
import logging
from scraper.supabase_client import supabase

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# FINAL LIST BASED ON USER INPUT
FORTUNE_COMPANIES = [
    {"name": "Walmart", "careers_url": "https://careers.walmart.com", "provider": "workday", "location": "USA"},
    {"name": "Amazon", "careers_url": "https://www.amazon.jobs", "provider": "amazon", "location": "USA"},
    {"name": "UnitedHealth", "careers_url": "https://careers.unitedhealthgroup.com", "provider": "custom", "location": "USA"},
    {"name": "Apple", "careers_url": "https://jobs.apple.com", "provider": "apple", "location": "USA"},
    {"name": "Alphabet", "careers_url": "https://careers.google.com", "provider": "google", "location": "USA"},
    {"name": "CVS Health", "careers_url": "https://jobs.cvshealth.com", "provider": "workday", "location": "USA"},
    {"name": "McKesson", "careers_url": "https://careers.mckesson.com", "provider": "workday", "location": "USA"},
    {"name": "Berkshire Hathaway", "careers_url": "https://www.berkshirehathaway.com", "provider": "custom", "location": "USA"},
    {"name": "Exxon Mobil", "careers_url": "https://careers.exxonmobil.com", "provider": "custom", "location": "USA"},
    {"name": "Cencora", "careers_url": "https://careers.cencora.com", "provider": "workday", "location": "USA"},
    {"name": "Microsoft", "careers_url": "https://careers.microsoft.com", "provider": "microsoft", "location": "USA"},
    {"name": "Costco", "careers_url": "https://www.costco.com/jobs.html", "provider": "custom", "location": "USA"},
    {"name": "Cigna", "careers_url": "https://jobs.cigna.com", "provider": "workday", "location": "USA"},
    {"name": "Cardinal Health", "careers_url": "https://jobs.cardinalhealth.com", "provider": "workday", "location": "USA"},
    {"name": "Elevance Health", "careers_url": "https://careers.elevancehealth.com", "provider": "workday", "location": "USA"},
    {"name": "Ford Motor", "careers_url": "https://corporate.ford.com/careers.html", "provider": "workday", "location": "USA"},
    {"name": "Meta", "careers_url": "https://www.metacareers.com", "provider": "meta", "location": "USA"},
    {"name": "Chevron", "careers_url": "https://careers.chevron.com", "provider": "workday", "location": "USA"},
    {"name": "General Motors", "careers_url": "https://search-careers.gm.com", "provider": "workday", "location": "USA"},
    {"name": "Nvidia", "careers_url": "https://www.nvidia.com/en-us/about-nvidia/careers", "provider": "workday", "location": "USA"},
    {"name": "JPMorgan Chase", "careers_url": "https://careers.jpmorgan.com", "provider": "workday", "location": "USA"},
    {"name": "Home Depot", "careers_url": "https://careers.homedepot.com", "provider": "workday", "location": "USA"},
    {"name": "Walgreens", "careers_url": "https://jobs.walgreens.com", "provider": "workday", "location": "USA"},
    {"name": "Fannie Mae", "careers_url": "https://www.fanniemae.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Kroger", "careers_url": "https://jobs.kroger.com", "provider": "workday", "location": "USA"},
    {"name": "Verizon", "careers_url": "https://www.verizon.com/about/careers", "provider": "workday", "location": "USA"},
    {"name": "Marathon Petroleum", "careers_url": "https://www.marathonpetroleum.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Phillips 66", "careers_url": "https://careers.phillips66.com", "provider": "workday", "location": "USA"},
    {"name": "StoneX", "careers_url": "https://careers.stonex.com", "provider": "workday", "location": "USA"},
    {"name": "Humana", "careers_url": "https://careers.humana.com", "provider": "workday", "location": "USA"},
    {"name": "AT&T", "careers_url": "https://www.att.jobs", "provider": "workday", "location": "USA"},
    {"name": "Comcast", "careers_url": "https://jobs.comcast.com", "provider": "workday", "location": "USA"},
    {"name": "State Farm", "careers_url": "https://jobs.statefarm.com", "provider": "workday", "location": "USA"},
    {"name": "Freddie Mac", "careers_url": "https://careers.freddiemac.com", "provider": "workday", "location": "USA"},
    {"name": "Valero Energy", "careers_url": "https://www.valero.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Target", "careers_url": "https://careers.target.com", "provider": "workday", "location": "USA"},
    {"name": "Dell Technologies", "careers_url": "https://jobs.dell.com", "provider": "workday", "location": "USA"},
    {"name": "Bank of America", "careers_url": "https://careers.bankofamerica.com", "provider": "custom", "location": "USA"},
    {"name": "Tesla", "careers_url": "https://www.tesla.com/careers", "provider": "custom", "location": "USA"},
    {"name": "Walt Disney", "careers_url": "https://jobs.disneycareers.com", "provider": "workday", "location": "USA"},
    {"name": "PepsiCo", "careers_url": "https://www.pepsicojobs.com", "provider": "workday", "location": "USA"},
    {"name": "Johnson & Johnson", "careers_url": "https://careers.jnj.com", "provider": "workday", "location": "USA"},
    {"name": "UPS", "careers_url": "https://www.jobs-ups.com", "provider": "workday", "location": "USA"},
    {"name": "FedEx", "careers_url": "https://careers.fedex.com", "provider": "workday", "location": "USA"},
    {"name": "RTX", "careers_url": "https://careers.rtx.com", "provider": "workday", "location": "USA"},
    {"name": "Progressive", "careers_url": "https://careers.progressive.com", "provider": "workday", "location": "USA"},
    {"name": "Procter & Gamble", "careers_url": "https://www.pgcareers.com", "provider": "workday", "location": "USA"},
    {"name": "Lowe’s", "careers_url": "https://corporate.lowes.com/careers", "provider": "workday", "location": "USA"},
    {"name": "ADM", "careers_url": "https://www.adm.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Sysco", "careers_url": "https://careers.sysco.com", "provider": "workday", "location": "USA"},
    {"name": "Albertsons", "careers_url": "https://www.albertsonscompanies.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Boeing", "careers_url": "https://jobs.boeing.com", "provider": "workday", "location": "USA"},
    {"name": "Energy Transfer", "careers_url": "https://energytransfer.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Wells Fargo", "careers_url": "https://www.wellsfargo.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Citi", "careers_url": "https://careers.citigroup.com", "provider": "workday", "location": "USA"},
    {"name": "HCA Healthcare", "careers_url": "https://careers.hcahealthcare.com", "provider": "workday", "location": "USA"},
    {"name": "Lockheed Martin", "careers_url": "https://www.lockheedmartinjobs.com", "provider": "workday", "location": "USA"},
    {"name": "MetLife", "careers_url": "https://jobs.metlife.com", "provider": "workday", "location": "USA"},
    {"name": "Morgan Stanley", "careers_url": "https://www.morganstanley.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Allstate", "careers_url": "https://careers.allstate.com", "provider": "workday", "location": "USA"},
    {"name": "IBM", "careers_url": "https://www.ibm.com/careers", "provider": "workday", "location": "USA"},
    {"name": "American Express", "careers_url": "https://careers.americanexpress.com", "provider": "workday", "location": "USA"},
    {"name": "Caterpillar", "careers_url": "https://careers.caterpillar.com", "provider": "workday", "location": "USA"},
    {"name": "Merck", "careers_url": "https://jobs.merck.com", "provider": "workday", "location": "USA"},
    {"name": "Delta Airlines", "careers_url": "https://careers.delta.com", "provider": "workday", "location": "USA"},
    {"name": "Pfizer", "careers_url": "https://www.pfizer.com/careers", "provider": "workday", "location": "USA"},
    {"name": "New York Life", "careers_url": "https://www.newyorklife.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Performance Food", "careers_url": "https://www.pfgc.com/careers", "provider": "workday", "location": "USA"},
    {"name": "ConocoPhillips", "careers_url": "https://careers.conocophillips.com", "provider": "workday", "location": "USA"},
    {"name": "Oracle", "careers_url": "https://careers.oracle.com", "provider": "workday", "location": "USA"},
    {"name": "TD Synnex", "careers_url": "https://careers.tdsynnex.com", "provider": "workday", "location": "USA"},
    {"name": "Publix", "careers_url": "https://jobs.publix.com", "provider": "workday", "location": "USA"},
    {"name": "Broadcom", "careers_url": "https://jobs.broadcom.com", "provider": "workday", "location": "USA"},
    {"name": "AbbVie", "careers_url": "https://careers.abbvie.com", "provider": "workday", "location": "USA"},
    {"name": "Eli Lilly", "careers_url": "https://careers.lilly.com", "provider": "workday", "location": "USA"},
    {"name": "TJX", "careers_url": "https://jobs.tjx.com", "provider": "workday", "location": "USA"},
    {"name": "Nationwide", "careers_url": "https://careers.nationwide.com", "provider": "workday", "location": "USA"},
    {"name": "United Airlines", "careers_url": "https://careers.united.com", "provider": "workday", "location": "USA"},
    {"name": "Cisco", "careers_url": "https://jobs.cisco.com", "provider": "workday", "location": "USA"},
    {"name": "Prudential", "careers_url": "https://jobs.prudential.com", "provider": "workday", "location": "USA"},
    {"name": "Goldman Sachs", "careers_url": "https://www.goldmansachs.com/careers", "provider": "workday", "location": "USA"},
    {"name": "HP", "careers_url": "https://jobs.hp.com", "provider": "workday", "location": "USA"},
    {"name": "Charter Communications", "careers_url": "https://jobs.spectrum.com", "provider": "workday", "location": "USA"},
    {"name": "Tyson Foods", "careers_url": "https://www.tysonfoods.com/careers", "provider": "workday", "location": "USA"},
    {"name": "American Airlines", "careers_url": "https://jobs.aa.com", "provider": "workday", "location": "USA"},
    {"name": "Intel", "careers_url": "https://jobs.intel.com", "provider": "workday", "location": "USA"},
    {"name": "Enterprise Products", "careers_url": "https://www.enterpriseproducts.com/careers", "provider": "workday", "location": "USA"},
    {"name": "General Dynamics", "careers_url": "https://www.gd.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Ingram Micro", "careers_url": "https://careers.ingrammicro.com", "provider": "workday", "location": "USA"},
    {"name": "Liberty Mutual", "careers_url": "https://jobs.libertymutualgroup.com", "provider": "workday", "location": "USA"},
    {"name": "Uber", "careers_url": "https://www.uber.com/us/en/careers", "provider": "greenhouse", "location": "USA"},
    {"name": "USAA", "careers_url": "https://www.usaa.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Travelers", "careers_url": "https://careers.travelers.com", "provider": "workday", "location": "USA"},
    {"name": "Bristol-Myers Squibb", "careers_url": "https://careers.bms.com", "provider": "workday", "location": "USA"},
    {"name": "Coca-Cola", "careers_url": "https://careers.coca-colacompany.com", "provider": "workday", "location": "USA"},
    {"name": "TIAA", "careers_url": "https://careers.tiaa.org", "provider": "workday", "location": "USA"},
    {"name": "Plains GP", "careers_url": "https://www.plains.com/careers", "provider": "workday", "location": "USA"},
    {"name": "Nike", "careers_url": "https://jobs.nike.com", "provider": "workday", "location": "USA"},
    {"name": "Deere", "careers_url": "https://www.deere.com/en/our-company/careers", "provider": "workday", "location": "USA"},
]

def seed_companies():
    logger.info(f"Starting seeding of {len(FORTUNE_COMPANIES)} companies from user list...")
    success_count = 0
    
    for company in FORTUNE_COMPANIES:
        try:
            # We use upsert on 'name' as we don't want duplicates in 'companies' table
            supabase.table("companies").upsert({
                "name": company["name"],
                "careers_url": company["careers_url"],
                "provider": company["provider"],
                "location": company.get("location", "USA"),
                "is_active": True
            }, on_conflict="name").execute()
            success_count += 1
        except Exception as e:
            logger.error(f"Failed to seed {company['name']}: {e}")
            
    logger.info(f"Final Seeding complete. {success_count} companies integrated.")

if __name__ == "__main__":
    seed_companies()
