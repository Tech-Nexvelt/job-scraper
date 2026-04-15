CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  role TEXT,
  domain TEXT,
  apply_link TEXT UNIQUE,
  source TEXT DEFAULT 'company_career_page',
  status TEXT DEFAULT 'Not Applied',
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_scraped_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  careers_url TEXT NOT NULL,
  provider TEXT DEFAULT 'custom',
  location TEXT DEFAULT 'USA',
  max_jobs INTEGER DEFAULT 20,
  last_scraped_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
