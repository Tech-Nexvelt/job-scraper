# Set of keywords to classify job roles based on title and description
ROLE_KEYWORDS = {
    "Frontend":      ["react", "vue", "angular", "css", "html", "typescript", "next.js", "frontend", "front end"],
    "Backend":       ["node.js", "django", "fastapi", "java", "spring", "golang", "rust", "backend", "back end", "python"],
    "AI/ML":         ["machine learning", "tensorflow", "pytorch", "llm", "nlp", "ai", "ml", "data scientist", "deep learning"],
    "Data Analyst":  ["sql", "tableau", "power bi", "excel", "analytics", "data analyst", "bi analyst"],
    "Full Stack":    ["fullstack", "full stack", "full-stack", "mern", "mean"],
}

# Domain classification structure with priority order
DOMAIN_MAPPING = [
    ("Data", [
        "data analyst", "data engineer", "data scientist", "business intelligence", 
        "big data", "data center", "database", "analytics"
    ]),
    ("Software", [
        "software engineer", "software developer", "full stack", "frontend", "front-end", 
        "backend", "back-end", "devops", "cloud engineer", "embedded software", 
        "atlassian", "jira", "dynamics 365", "web developer"
    ]),
    ("Business", [
        "business analyst", "crm", "financial analyst", "credit risk", "credit controller"
    ]),
    ("Healthcare", [
        "bioinformatics", "biotechnology", "clinical research", "clinical data", 
        "ehr", "electronic health records", "healthcare"
    ]),
    ("Engineering", [
        "electrical engineer", "chemical engineer", "construction", "controls engineer",
        "mechanical engineer", "civil engineer"
    ]),
    ("Security", [
        "cybersecurity", "cyber security", "anti money laundering", "aml", "information security"
    ])
]

def classify_role(title: str, description: str = "") -> str:
    """
    Classifies a job role based on keywords found in the title and description.
    """
    text = (title + " " + description).lower()
    for role, keywords in ROLE_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return role
    return "General"

def get_domain(job_title: str) -> str:
    """
    Classifies jobs into domains using keyword mapping with priority order:
    Data -> Software -> Business -> Healthcare -> Engineering -> Security -> Other
    """
    title_lower = job_title.lower()
    
    for domain, keywords in DOMAIN_MAPPING:
        if any(kw in title_lower for kw in keywords):
            return domain
            
    return "Other"
