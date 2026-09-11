-- ==============================================================================
-- VirtualHQ — Complete Supabase Production Database Schema & Authentication
-- Copy and run this ENTIRE script in Supabase Dashboard > SQL Editor > New Query
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if recreating to ensure clean state
-- DROP TABLE IF EXISTS public.pull_requests CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Create Employee Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  emp_id TEXT NOT NULL,
  email TEXT,
  full_name TEXT NOT NULL DEFAULT 'Engineering Recruit',
  preferred_name TEXT DEFAULT 'Engineer',
  handle TEXT DEFAULT 'engineer',
  department TEXT DEFAULT 'engineering',
  role_title TEXT DEFAULT 'Frontend Developer (Junior)',
  role_level TEXT DEFAULT 'LEVEL 1 · JUNIOR',
  avatar_url TEXT,
  total_xp INTEGER DEFAULT 200,
  is_signed BOOLEAN DEFAULT false,
  signature_url TEXT,
  corporate_email TEXT,
  company_name TEXT DEFAULT 'Stripe',
  company_domain TEXT DEFAULT 'stripe.corp',
  user_type TEXT DEFAULT 'employee',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_signed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS corporate_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS github_username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 200;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'Stripe';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_domain TEXT DEFAULT 'stripe.corp';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'employee';

-- Remove duplicate profiles keeping only the most recently updated one
DELETE FROM public.profiles a USING public.profiles b
WHERE a.user_id = b.user_id 
  AND a.id <> b.id 
  AND a.updated_at < b.updated_at;

-- Ensure UNIQUE constraint on user_id so upserts and unique lookups never conflict
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_unique'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_emp_id_unique'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_emp_id_unique UNIQUE (emp_id);
    END IF;
END $$;

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_emp_id ON public.profiles(emp_id);
CREATE INDEX IF NOT EXISTS idx_profiles_corp_email ON public.profiles(corporate_email);

-- 4. Create Pull Requests Table
CREATE TABLE IF NOT EXISTS public.pull_requests (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  issue_no TEXT,
  repo TEXT,
  title TEXT,
  author TEXT NOT NULL DEFAULT 'Corporate Engineer',
  author_role TEXT DEFAULT 'Frontend Developer (Junior)',
  author_dept TEXT DEFAULT 'engineering',
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved_merged', 'changes_requested')),
  code_patch TEXT,
  modified_code TEXT,
  original_code TEXT,
  submission_type TEXT DEFAULT 'monaco',
  zip_meta TEXT,
  review_feedback TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for status queries and review pipelines
CREATE INDEX IF NOT EXISTS idx_pull_requests_status ON public.pull_requests(status);
CREATE INDEX IF NOT EXISTS idx_pull_requests_created ON public.pull_requests(created_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pull_requests ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Full Access for Authenticated Users and Corporate Operations
DROP POLICY IF EXISTS "Public profiles select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update" ON public.profiles;
DROP POLICY IF EXISTS "Public pr select" ON public.pull_requests;
DROP POLICY IF EXISTS "PR insert" ON public.pull_requests;
DROP POLICY IF EXISTS "PR update" ON public.pull_requests;

-- Profiles: Anyone can view profiles, insert, and update
CREATE POLICY "Public profiles select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (true);

-- Pull Requests: Viewable and manageable across all connected clients
CREATE POLICY "Public pr select" ON public.pull_requests FOR SELECT USING (true);
CREATE POLICY "PR insert" ON public.pull_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "PR update" ON public.pull_requests FOR UPDATE USING (true);

-- Ensure all required columns exist in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- 7. Trigger: Auto-provision profile on GitHub OAuth / Email signup (FAIL-SAFE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_name TEXT;
  extracted_handle TEXT;
  extracted_avatar TEXT;
  extracted_corp_email TEXT;
  generated_emp_id TEXT;
BEGIN
  extracted_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Engineering Recruit'
  );
  extracted_handle := LOWER(COALESCE(
    new.raw_user_meta_data->>'github_username',
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'preferred_username',
    split_part(new.email, '@', 1),
    'engineer'
  ));
  extracted_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN new.raw_user_meta_data->>'github_username' IS NOT NULL 
      THEN 'https://github.com/' || (new.raw_user_meta_data->>'github_username') || '.png'
      ELSE 'https://github.com/' || extracted_handle || '.png'
    END
  );
  extracted_corp_email := COALESCE(
    new.raw_user_meta_data->>'corporate_email',
    extracted_handle || '@stripe.corp'
  );
  generated_emp_id := 'WD-' || floor(1000 + random() * 9000)::text;

  INSERT INTO public.profiles (
    user_id,
    emp_id,
    email,
    corporate_email,
    github_username,
    full_name,
    preferred_name,
    handle,
    avatar_url,
    auth_provider,
    department,
    role_title,
    role_level,
    total_xp,
    is_signed,
    company_name,
    company_domain,
    user_type
  ) VALUES (
    new.id,
    generated_emp_id,
    new.email,
    extracted_corp_email,
    extracted_handle,
    extracted_name,
    split_part(extracted_name, ' ', 1),
    extracted_handle,
    extracted_avatar,
    COALESCE(new.app_metadata->>'provider', 'email'),
    'engineering',
    'Frontend Developer (Junior)',
    'LEVEL 1 · JUNIOR',
    200,
    false,
    COALESCE(new.raw_user_meta_data->>'company_name', 'Stripe'),
    COALESCE(new.raw_user_meta_data->>'company_domain', 'stripe.corp'),
    COALESCE(new.raw_user_meta_data->>'user_type', 'employee')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    user_type = COALESCE(EXCLUDED.user_type, public.profiles.user_type),
    company_name = COALESCE(EXCLUDED.company_name, public.profiles.company_name),
    company_domain = COALESCE(EXCLUDED.company_domain, public.profiles.company_domain),
    updated_at = now();

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- CRITICAL: Never fail or rollback auth.signUp if profile provisioning encounters an issue
  RAISE WARNING 'handle_new_user error ignored: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Create Meetings Table
CREATE TABLE IF NOT EXISTS public.meetings (
  id TEXT PRIMARY KEY,
  emp_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'standup',
  platform TEXT DEFAULT 'google_meet',
  link TEXT NOT NULL,
  meeting_id TEXT,
  passcode TEXT,
  host_name TEXT NOT NULL,
  host_title TEXT,
  host_initials TEXT,
  schedule_time TEXT NOT NULL,
  duration TEXT DEFAULT '30 mins',
  status TEXT DEFAULT 'upcoming',
  agenda JSONB DEFAULT '[]'::jsonb,
  attendees JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  emp_id TEXT NOT NULL,
  thread_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_id TEXT,
  text TEXT NOT NULL,
  is_me BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Create Team Posts Table
CREATE TABLE IF NOT EXISTS public.team_posts (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  author_role TEXT,
  content TEXT NOT NULL,
  reactions JSONB DEFAULT '{"likes": 0}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Create Tasks Table (Manager Task Assignments)
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  assigned_to_emp_id TEXT NOT NULL,
  assigned_to_name TEXT NOT NULL,
  assigned_by_emp_id TEXT NOT NULL,
  assigned_by_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed')),
  due_date TEXT,
  repo TEXT,
  issue_no TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to_emp_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Enable RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public meetings access" ON public.meetings;
DROP POLICY IF EXISTS "Public messages access" ON public.messages;
DROP POLICY IF EXISTS "Public team_posts access" ON public.team_posts;
DROP POLICY IF EXISTS "Public tasks access" ON public.tasks;

CREATE POLICY "Public meetings access" ON public.meetings FOR ALL USING (true);
CREATE POLICY "Public messages access" ON public.messages FOR ALL USING (true);
CREATE POLICY "Public team_posts access" ON public.team_posts FOR ALL USING (true);
CREATE POLICY "Public tasks access" ON public.tasks FOR ALL USING (true);

-- 11. Enable Realtime Publications
-- Set replica identity to FULL so that realtime UPDATE and DELETE events broadcast all column values
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.meetings REPLICA IDENTITY FULL;
ALTER TABLE public.pull_requests REPLICA IDENTITY FULL;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- Broadcast live changes when PRs, profiles, meetings, messages, and posts update
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pull_requests') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pull_requests;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'meetings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'team_posts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.team_posts;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'repositories') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.repositories;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'role_problems') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.role_problems;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'employee_progress') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_progress;
  END IF;
END $$;

-- 12. Create Repositories Table
CREATE TABLE IF NOT EXISTS public.repositories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'VirtualHQ',
  url TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  language TEXT DEFAULT 'TypeScript',
  department TEXT DEFAULT 'engineering',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Create Role Problems Table
CREATE TABLE IF NOT EXISTS public.role_problems (
  s_no SERIAL PRIMARY KEY,
  issue_no TEXT NOT NULL,
  role_title TEXT NOT NULL,
  level TEXT DEFAULT 'Easy',
  repo TEXT NOT NULL,
  issue_url TEXT,
  department TEXT DEFAULT 'engineering',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Create Employee Progress Table
CREATE TABLE IF NOT EXISTS public.employee_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emp_id TEXT NOT NULL,
  repo TEXT NOT NULL,
  issue_no TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for newly added tables
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public repositories access" ON public.repositories;
DROP POLICY IF EXISTS "Public role_problems access" ON public.role_problems;
DROP POLICY IF EXISTS "Public employee_progress access" ON public.employee_progress;

CREATE POLICY "Public repositories access" ON public.repositories FOR ALL USING (true);
CREATE POLICY "Public role_problems access" ON public.role_problems FOR ALL USING (true);
CREATE POLICY "Public employee_progress access" ON public.employee_progress FOR ALL USING (true);

-- 15. Create Companies Table & Dynamic Enterprise Data
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL UNIQUE,
  tagline TEXT NOT NULL,
  description TEXT,
  headquarters TEXT,
  founded TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  leadership JSONB DEFAULT '[]'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,
  tech_stack TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public companies access" ON public.companies;
CREATE POLICY "Public companies access" ON public.companies FOR ALL USING (true);

-- Realtime publication for companies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'companies') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.companies;
  END IF;
END $$;

-- 16. Seed Real Enterprise Companies (Zero dummy hardcoded fallback)
INSERT INTO public.companies (id, name, domain, tagline, description, headquarters, founded, metrics, leadership, benefits, tech_stack)
VALUES
(
  'stripe',
  'Stripe',
  'stripe.corp',
  'Global Financial Infrastructure & Developer Payments API',
  'Stripe builds economic infrastructure for the internet. Businesses of every size—from new startups to public companies—use our software to accept payments and manage their businesses online.',
  '354 Oyster Point Blvd, South San Francisco, CA 94080',
  '2010',
  '{"headcount": "8,000+", "valuation": "$65 Billion", "uptime": "99.999%", "compliance": "PCI-DSS Level 1 · SOC 1/2/3"}'::jsonb,
  '[
    {"name": "Patrick Collison", "role": "Co-founder & CEO", "dept": "EXECUTIVE", "initials": "PC"},
    {"name": "Will Gaybrick", "role": "President of Product & Business", "dept": "PRODUCT", "initials": "WG"},
    {"name": "David Singleton", "role": "Chief Technology Officer", "dept": "ENGINEERING", "initials": "DS"},
    {"name": "Claire Hughes Johnson", "role": "Corporate Officer & Advisor", "dept": "OPERATIONS", "initials": "CH"}
  ]'::jsonb,
  '[
    {"title": "Comprehensive Healthcare", "desc": "100% premium coverage for medical, dental, and vision for employees and dependents.", "tier": "TIER 1"},
    {"title": "Learning & Development Stipend", "desc": "$2,500 annual budget for books, technical conferences, and certifications.", "tier": "ANNUAL"},
    {"title": "Remote Setup Budget", "desc": "$1,500 initial home office ergonomic setup grant + monthly internet stipend.", "tier": "EQUIPMENT"},
    {"title": "Equity & 401(k) Matching", "desc": "Competitive RSUs with 401(k) company matching up to 4% of total compensation.", "tier": "RETIREMENT"}
  ]'::jsonb,
  ARRAY['Ruby', 'Go', 'React', 'TypeScript', 'PostgreSQL', 'AWS', 'Envoy', 'Kubernetes']
),
(
  'linear',
  'Linear',
  'linear.app',
  'Issue Tracking & High-Velocity Engineering Platform',
  'Linear streamlines software projects, sprints, tasks, and bug tracking with synchronization at the speed of thought. Built for high-performance software engineering teams.',
  '548 Market St, San Francisco, CA 94104',
  '2019',
  '{"headcount": "80+", "valuation": "$1.2 Billion", "uptime": "99.995%", "compliance": "SOC 2 Type II Certified"}'::jsonb,
  '[
    {"name": "Karri Saarinen", "role": "Co-founder & CEO", "dept": "DESIGN & EXEC", "initials": "KS"},
    {"name": "Tuomas Artman", "role": "Co-founder & CTO", "dept": "ENGINEERING", "initials": "TA"},
    {"name": "Jori Lallo", "role": "Co-founder & Architect", "dept": "SYSTEMS", "initials": "JL"}
  ]'::jsonb,
  '[
    {"title": "Async-First Culture", "desc": "Minimal meetings, deep focus time blocks, and autonomous decision-making.", "tier": "CULTURE"},
    {"title": "Top-Tier Hardware", "desc": "Fully loaded M3 Max MacBook Pro + Pro Display XDR or dual 4K monitors.", "tier": "HARDWARE"},
    {"title": "Unlimited Wellness & PTO", "desc": "Flexible paid time off with mandatory 4-week minimum annual recharge.", "tier": "WELLNESS"},
    {"title": "Company Offsites", "desc": "Bi-annual global retreats in Tokyo, Lisbon, and Banff for strategic alignment.", "tier": "GLOBAL"}
  ]'::jsonb,
  ARRAY['TypeScript', 'React', 'Node.js', 'GraphQL', 'SQLite', 'WebSockets', 'Rust']
),
(
  'meta',
  'Meta',
  'meta.corp',
  'Open Source AI Models & Global Scale Infrastructure',
  'Meta builds technologies that help people connect, find communities, and grow businesses. Powering open-source innovations including PyTorch, React, Llama, and hyperscale data centers.',
  '1 Hacker Way, Menlo Park, CA 94025',
  '2004',
  '{"headcount": "67,000+", "valuation": "$1.3 Trillion", "uptime": "99.999%", "compliance": "Global ISO & SOC Certified"}'::jsonb,
  '[
    {"name": "Mark Zuckerberg", "role": "Founder, Chairman & CEO", "dept": "EXECUTIVE", "initials": "MZ"},
    {"name": "Andrew Bosworth", "role": "Chief Technology Officer", "dept": "REALITY LABS", "initials": "AB"},
    {"name": "Chris Cox", "role": "Chief Product Officer", "dept": "PRODUCT", "initials": "CC"}
  ]'::jsonb,
  '[
    {"title": "Pioneering Research Grants", "desc": "Access to 100,000+ H100 GPU clusters for cutting-edge AI model training.", "tier": "RESEARCH"},
    {"title": "Full Family Healthcare", "desc": "Comprehensive global medical coverage, fertility benefits, and wellness centers.", "tier": "HEALTHCARE"},
    {"title": "Generous RSU Packages", "desc": "Top-of-market equity grants with quarterly vesting schedules.", "tier": "COMPENSATION"}
  ]'::jsonb,
  ARRAY['PyTorch', 'React', 'C++', 'Hack', 'Python', 'GraphQL', 'Cassandra', 'RocksDB']
),
(
  'google',
  'Google Cloud',
  'google.corp',
  'Distributed Systems & Hyperscale Cloud Infrastructure',
  'Google Cloud accelerates every organization’s ability to digitally transform its business with leading infrastructure, platform capabilities, industry solutions, and AI breakthroughs.',
  '1600 Amphitheatre Pkwy, Mountain View, CA 94043',
  '1998',
  '{"headcount": "180,000+", "valuation": "$2.1 Trillion", "uptime": "99.999%", "compliance": "FedRAMP High · HIPAA · SOC 1/2/3"}'::jsonb,
  '[
    {"name": "Sundar Pichai", "role": "Chief Executive Officer", "dept": "EXECUTIVE", "initials": "SP"},
    {"name": "Thomas Kurian", "role": "CEO, Google Cloud", "dept": "CLOUD", "initials": "TK"},
    {"name": "Jeff Dean", "role": "Chief Scientist, Google DeepMind", "dept": "AI & RESEARCH", "initials": "JD"}
  ]'::jsonb,
  '[
    {"title": "Peerless Technical Scale", "desc": "Work on planet-scale infrastructure serving billions of daily active queries.", "tier": "SCALE"},
    {"title": "20% Innovation Time", "desc": "Dedicate one workday weekly to speculative open-source engineering or passion projects.", "tier": "INNOVATION"},
    {"title": "Global Mobility", "desc": "Internal transfer opportunities across 50+ international Google engineering campuses.", "tier": "MOBILITY"}
  ]'::jsonb,
  ARRAY['Go', 'C++', 'Java', 'Kubernetes', 'Borg', 'Bigtable', 'Spanner', 'TensorFlow']
),
(
  'vercel',
  'Vercel',
  'vercel.corp',
  'Frontend Cloud & Serverless Edge Frameworks',
  'Vercel is the platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration. Creators of Next.js and pioneers in edge computing.',
  '440 N Barranca Ave #4133, Covina, CA 91723',
  '2015',
  '{"headcount": "600+", "valuation": "$3.25 Billion", "uptime": "99.998%", "compliance": "SOC 2 Type II · ISO-27001"}'::jsonb,
  '[
    {"name": "Guillermo Rauch", "role": "Founder & CEO", "dept": "EXECUTIVE", "initials": "GR"},
    {"name": "Malte Ubl", "role": "Chief Technology Officer", "dept": "ENGINEERING", "initials": "MU"},
    {"name": "Lee Robinson", "role": "VP of Product", "dept": "PRODUCT", "initials": "LR"}
  ]'::jsonb,
  '[
    {"title": "Global Edge Deployment", "desc": "Instant deployment previews and automated zero-config CI/CD pipelines.", "tier": "INFRA"},
    {"title": "Generous Tech Stipend", "desc": "$3,000 annual equipment and continuing software education allowance.", "tier": "GROWTH"},
    {"title": "Async Remote Work", "desc": "100% remote-first engineering organization spanning 30+ countries.", "tier": "REMOTE"}
  ]'::jsonb,
  ARRAY['Next.js', 'React', 'TypeScript', 'Rust', 'Turbopack', 'Node.js', 'AWS Lambda']
),
(
  'supabase',
  'Supabase',
  'supabase.corp',
  'Open Source Postgres & Realtime Backend Infrastructure',
  'Supabase is an open source Firebase alternative providing all the backend features you need: a dedicated Postgres database, Authentication, instant APIs, Edge Functions, Realtime subscriptions, and Storage.',
  '970 Toa Payoh North #07-04, Singapore 318992',
  '2020',
  '{"headcount": "120+", "valuation": "$1 Billion", "uptime": "99.995%", "compliance": "SOC 2 Type II · HIPAA Ready"}'::jsonb,
  '[
    {"name": "Paul Copplestone", "role": "Co-founder & CEO", "dept": "EXECUTIVE", "initials": "PC"},
    {"name": "Ant Wilson", "role": "Co-founder & CTO", "dept": "ENGINEERING", "initials": "AW"},
    {"name": "Thor Webb", "role": "Head of Developer Experience", "dept": "DEVREL", "initials": "TW"}
  ]'::jsonb,
  '[
    {"title": "Open Source by Default", "desc": "All core libraries, drivers, and UI kits are developed openly on GitHub.", "tier": "OPEN SOURCE"},
    {"title": "Fully Remote Freedom", "desc": "Work from anywhere in the world with flexible hours and asynchronous communication.", "tier": "AUTONOMY"},
    {"title": "Conference & Travel", "desc": "Full travel and lodging covered for presenting at Postgres and tech conferences worldwide.", "tier": "TRAVEL"}
  ]'::jsonb,
  ARRAY['PostgreSQL', 'Elixir', 'Go', 'TypeScript', 'Docker', 'PostgREST', 'pgvector']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  headquarters = EXCLUDED.headquarters,
  founded = EXCLUDED.founded,
  metrics = EXCLUDED.metrics,
  leadership = EXCLUDED.leadership,
  benefits = EXCLUDED.benefits,
  tech_stack = EXCLUDED.tech_stack,
  updated_at = now();



