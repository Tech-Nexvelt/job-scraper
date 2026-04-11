# Set of keywords to classify job roles based on title and description
ROLE_KEYWORDS = {
    "Frontend":      ["react", "vue", "angular", "css", "html", "typescript", "next.js", "frontend", "front end"],
    "Backend":       ["node.js", "django", "fastapi", "java", "spring", "golang", "rust", "backend", "back end", "python"],
    "AI/ML":         ["machine learning", "tensorflow", "pytorch", "llm", "nlp", "ai", "ml", "data scientist", "deep learning"],
    "Data Analyst":  ["sql", "tableau", "power bi", "excel", "analytics", "data analyst", "bi analyst"],
    "Full Stack":    ["fullstack", "full stack", "full-stack", "mern", "mean"],
}

def classify_role(title: str, description: str = "") -> str:
    """
    Classifies a job role based on keywords found in the title and description.
    :param title: The job title
    :param description: The job description (optional)
    :return: The classified role name or 'General'
    """
    text = (title + " " + description).lower()
    for role, keywords in ROLE_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return role
    return "General"
