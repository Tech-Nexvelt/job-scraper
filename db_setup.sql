CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  role TEXT,
  apply_link TEXT UNIQUE,
  source TEXT DEFAULT 'company_career_page',
  status TEXT DEFAULT 'Not Applied',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_scraped_at TIMESTAMPTZ DEFAULT now()
);
