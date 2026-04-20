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
    ("software_engineering", [
        "dev", "developer", "engineer", "software", "programming", "frontend", "backend", 
        "fullstack", "full stack", "full-stack", "web", "mobile", "api", "microservices", 
        "react", "angular", "node", "django", "spring", "app developer"
    ]),
    ("ai_ml_data", [
        "ai", "ml", "machine learning", "deep learning", "nlp", "computer vision", 
        "data scientist", "genai", "generative ai", "llm", "pytorch", "tensorflow", "ai engineer"
    ]),
    ("data_analytics", [
        "analytics", "bi", "sql", "tableau", "power bi", "data analyst", "reporting", 
        "dashboard", "excel", "visualization"
    ]),
    ("data_engineering", [
        "etl", "spark", "data warehouse", "data pipeline", "hadoop", "airflow", "kafka", "big data"
    ]),
    ("cloud_devops", [
        "cloud", "devops", "sre", "aws", "azure", "gcp", "kubernetes", "docker", 
        "ci/cd", "terrafor", "infrastructure"
    ]),
    ("cyber_security", [
        "security", "cybersecurity", "pentest", "ethical hacking", "soc", "siem", 
        "network security", "information security"
    ]),
    ("finance_compliance", [
        "finance", "fintech", "accounting", "audit", "aml", "kyc", "risk", 
        "compliance", "fraud", "taxation"
    ]),
    ("healthcare_lifescience", [
        "medical", "healthcare", "pharma", "clinical", "biotech", "biomedical", 
        "life sciences", "ehr", "emr"
    ]),
    ("core_engineering", [
        "mechanical", "electrical", "civil", "hardware", "production", "manufacturing", "design engineer"
    ]),
    ("industrial_automation", [
        "plc", "robotics", "control systems", "scada", "automation", "mechatronics"
    ]),
    ("enterprise_tools", [
        "sap", "salesforce", "oracle", "crm", "erp", "dynamics 365", "servicenow"
    ]),
    ("agriculture", [
        "agritech", "farming", "agriculture", "agronomy", "crop", "farm"
    ]),
    ("it_support", [
        "support", "helpdesk", "system admin", "sysadmin", "it support", "desktop support", "technical support"
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

def get_domain(job_title: str, description: str = "") -> str:
    """
    Classifies jobs into domains using keyword mapping with priority order:
    Software -> AI/ML -> Data Eng -> Data Analytics -> etc.
    """
    text = (job_title + " " + description).lower()
    
    for domain, keywords in DOMAIN_MAPPING:
        if any(kw in text for kw in keywords):
            return domain
            
    return "other"
