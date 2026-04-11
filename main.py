import asyncio
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from scraper.run_scraper import run as run_scraper
from scraper.supabase_client import supabase

app = FastAPI(title="Job Tracker API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    resume: str
    job_description: str

@app.post("/analyze")
async def analyze_resume(request: AnalysisRequest):
    """
    Analyzes a resume against a job description.
    Simulates AI ATS scoring with keyword and relevance checks.
    """
    resume_text = request.resume.lower()
    jd_text = request.job_description.lower()
    
    # Simple keyword match scoring logic
    keywords = ["experience", "education", "skills", "projects", "responsible", "developed", "managed"]
    found_keywords = [kw for kw in keywords if kw in resume_text]
    
    # Calculate base score
    base_score = 40 + (len(found_keywords) * 5)
    
    # Check for job title relevance
    match_score = 0
    jd_words = jd_text.split()
    for word in jd_words:
        if len(word) > 4 and word in resume_text:
            match_score += 5
            
    total_score = min(95, base_score + match_score)
    
    # Generate mock AI feedback
    feedback = [
        f"Your resume has a strong match for the core requirements of this role.",
        "Consider quantifying your achievements with more metrics like % or $ values.",
        "Your skills section is well-organized and easy for ATS to parse.",
        "Recommended: Add more specific technical tools relevant to this company's stack."
    ]
    
    await asyncio.sleep(1.5) # Simulate processing time
    
    return {
        "score": total_score,
        "feedback": feedback
    }

@app.get("/")
async def root():
    return {"message": "Job Tracker API is running"}

@app.post("/scrape/run")
async def trigger_scrape(background_tasks: BackgroundTasks):
    """
    Triggers the scraper to run in the background.
    """
    background_tasks.add_task(asyncio.run, run_scraper())
    return {"status": "Scraping started in background"}

@app.get("/jobs")
async def get_jobs():
    """
    Fetches all jobs from Supabase, ordered by newest first.
    """
    try:
        result = supabase.table("jobs").select("*").order("created_at", desc=True).execute()
        return result.data
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
