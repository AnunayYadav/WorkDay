-- ==============================================================================
-- VirtualHQ: Complete Enterprise Database Schema, Repositories, Problems & Progress
-- Copy & Run this script in Supabase Dashboard > SQL Editor > New Query
-- ==============================================================================

-- 1. UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Repositories Table
CREATE TABLE IF NOT EXISTS public.repositories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  department TEXT DEFAULT 'engineering',
  language TEXT DEFAULT 'TypeScript',
  stars TEXT DEFAULT '128',
  forks TEXT DEFAULT '45',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Role Problems Table
CREATE TABLE IF NOT EXISTS public.role_problems (
  id TEXT PRIMARY KEY,
  s_no INTEGER,
  department TEXT NOT NULL DEFAULT 'engineering',
  role_id TEXT NOT NULL,
  role_title TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'Easy',
  repo TEXT NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE,
  issue_no TEXT NOT NULL,
  issue_url TEXT NOT NULL,
  title TEXT NOT NULL,
  acceptance_criteria JSONB DEFAULT '["Resolve issue in accordance with repository standards", "Pass regression test assertions", "Submit PR for manager code review"]'::jsonb,
  xp_reward INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Employee Progress Table
CREATE TABLE IF NOT EXISTS public.employee_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emp_id TEXT NOT NULL,
  issue_no TEXT NOT NULL,
  repo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'completed')),
  pr_id TEXT,
  xp_awarded INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (emp_id, repo, issue_no)
);

-- 5. Indexes for Instant Query Performance
CREATE INDEX IF NOT EXISTS idx_role_problems_role_title ON public.role_problems(role_title);
CREATE INDEX IF NOT EXISTS idx_role_problems_level ON public.role_problems(level);
CREATE INDEX IF NOT EXISTS idx_role_problems_repo ON public.role_problems(repo);
CREATE INDEX IF NOT EXISTS idx_employee_progress_emp_id ON public.employee_progress(emp_id);
CREATE INDEX IF NOT EXISTS idx_employee_progress_status ON public.employee_progress(status);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_progress ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies: Transparent read/write across VirtualHQ clients
DROP POLICY IF EXISTS "Public repos viewable" ON public.repositories;
DROP POLICY IF EXISTS "Repos insert update" ON public.repositories;
DROP POLICY IF EXISTS "Public problems viewable" ON public.role_problems;
DROP POLICY IF EXISTS "Problems insert update" ON public.role_problems;
DROP POLICY IF EXISTS "Public progress viewable" ON public.employee_progress;
DROP POLICY IF EXISTS "Progress insert" ON public.employee_progress;
DROP POLICY IF EXISTS "Progress update" ON public.employee_progress;

CREATE POLICY "Public repos viewable" ON public.repositories FOR SELECT USING (true);
CREATE POLICY "Repos insert update" ON public.repositories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public problems viewable" ON public.role_problems FOR SELECT USING (true);
CREATE POLICY "Problems insert update" ON public.role_problems FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public progress viewable" ON public.employee_progress FOR SELECT USING (true);
CREATE POLICY "Progress insert" ON public.employee_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Progress update" ON public.employee_progress FOR UPDATE USING (true);

-- 8. Add to Realtime Publication
DO $$
BEGIN
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

-- ==============================================================================
-- 9. Seed All 16 Enterprise Repositories
-- ==============================================================================
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('Dezenix/frontend-reactjs', 'Frontend React.js Enterprise Platform', 'Dezenix', 'https://github.com/Dezenix/frontend-reactjs', 'React UI component library, dashboard layout grids, and enterprise web user experiences.', '["React","JavaScript","CSS3","HTML5","UI/UX"]'::jsonb, 'engineering', 'JavaScript', '420', '115')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('Algo-Phantoms/Algo-Phantoms-Frontend', 'Algo-Phantoms Interactive Frontend', 'Algo-Phantoms', 'https://github.com/Algo-Phantoms/Algo-Phantoms-Frontend', 'Algorithmic learning platform with interactive code playgrounds and visual data structures.', '["React","TypeScript","TailwindCSS","Algorithms"]'::jsonb, 'engineering', 'TypeScript', '1.2k', '380')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('Girl-Code-It/Opportunity-Calendar-Frontend', 'Opportunity Calendar Frontend', 'Girl-Code-It', 'https://github.com/Girl-Code-It/Opportunity-Calendar-Frontend', 'Community-driven opportunities platform tracking hackathons, internships, scholarships, and hiring challenges.', '["React","Material-UI","JavaScript","Calendar"]'::jsonb, 'engineering', 'JavaScript', '850', '290')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('medusajs/medusa', 'Medusa Composable Commerce Engine', 'medusajs', 'https://github.com/medusajs/medusa', 'The world''s leading open-source headless commerce platform and multi-tenant backend architecture.', '["Node.js","TypeScript","Commerce","REST API","Redis"]'::jsonb, 'engineering', 'TypeScript', '26.8k', '2.4k')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('dishamodi0910/APIVerse', 'APIVerse Open API Directory', 'dishamodi0910', 'https://github.com/dishamodi0910/APIVerse', 'Centralized repository of public and enterprise APIs with authentication documentation and playground testing.', '["Node.js","Express","APIs","MongoDB"]'::jsonb, 'engineering', 'JavaScript', '610', '195')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('saleor/saleor', 'Saleor GraphQL High-Performance Commerce', 'saleor', 'https://github.com/saleor/saleor', 'Modular, ultra-fast GraphQL-powered commerce platform built for high-volume enterprise architectures.', '["Python","Django","GraphQL","PostgreSQL","Docker"]'::jsonb, 'engineering', 'Python', '20.1k', '5.2k')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('Indie-Kart/ecommerce-store', 'Indie-Kart Full-Stack E-Commerce', 'Indie-Kart', 'https://github.com/Indie-Kart/ecommerce-store', 'Modern storefront featuring dynamic cart state, Stripe checkout flows, and MongoDB order tracking.', '["Next.js","React","TailwindCSS","Stripe","Node.js"]'::jsonb, 'engineering', 'TypeScript', '340', '85')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('Sayak-Bhunia/mystory', 'MyStory Publishing Engine', 'Sayak-Bhunia', 'https://github.com/Sayak-Bhunia/mystory', 'Clean, minimalist publishing engine and content management platform for authors, technical writers, and bloggers.', '["React","Node.js","MongoDB","Markdown"]'::jsonb, 'engineering', 'JavaScript', '950', '180')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('Kajol-Kumari/InfluMart', 'InfluMart Creator Marketplace', 'Kajol-Kumari', 'https://github.com/Kajol-Kumari/InfluMart', 'Collaboration marketplace connecting creators, brands, and digital merchandise storefronts.', '["React","Express","Node.js","MongoDB"]'::jsonb, 'engineering', 'JavaScript', '510', '140')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('open-xyz/xmail', 'xMail Distributed Mail Client & API', 'open-xyz', 'https://github.com/open-xyz/xmail', 'Decentralized, privacy-focused email protocol client with client-side PGP encryption and SMTP routing.', '["Go","TypeScript","SMTP","Security","Docker"]'::jsonb, 'engineering', 'TypeScript', '1.8k', '320')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('Niketkumardheeryan/ML-CaPsule', 'ML-CaPsule Machine Learning Hub', 'Niketkumardheeryan', 'https://github.com/Niketkumardheeryan/ML-CaPsule', 'End-to-end machine learning algorithms, dataset analysis notebooks, and predictive modeling pipelines.', '["Python","Scikit-learn","Pandas","NumPy","Jupyter"]'::jsonb, 'data', 'Python', '2.6k', '510')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('Yeasir0032/Discord-Clone', 'Discord Realtime Communication Suite', 'Yeasir0032', 'https://github.com/Yeasir0032/Discord-Clone', 'Full-stack Discord clone featuring WebRTC voice channels, socket.io chat, and server roles.', '["Next.js","Socket.io","WebRTC","TailwindCSS","Prisma"]'::jsonb, 'engineering', 'TypeScript', '3.4k', '920')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('Olatisunkanmi/altschool-backend-musicfy-open-source', 'Musicfy Streaming API Microservices', 'Olatisunkanmi', 'https://github.com/Olatisunkanmi/altschool-backend-musicfy-open-source', 'Scalable audio streaming microservice architecture with token authentication and cloud storage sync.', '["Node.js","Express","JWT","MongoDB","AWS S3"]'::jsonb, 'infrastructure', 'JavaScript', '280', '65')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('sahil-sagwekar2652/GitHub-Automation-scripts', 'GitHub Enterprise Automation Scripts', 'sahil-sagwekar2652', 'https://github.com/sahil-sagwekar2652/GitHub-Automation-scripts', 'Production DevOps scripts, CI/CD GitHub Action workflows, and repository hygiene tools.', '["Shell","Python","GitHub Actions","DevOps","CI/CD"]'::jsonb, 'infrastructure', 'Shell', '490', '130')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('flutter/flutter', 'Flutter Engine & Multi-Platform SDK', 'flutter', 'https://github.com/flutter/flutter', 'Google''s multi-platform UI toolkit for building natively compiled applications for mobile, web, and desktop.', '["Flutter","Dart","Mobile","Android","iOS"]'::jsonb, 'engineering', 'Dart', '164k', '27k')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;
INSERT INTO public.repositories (id, name, owner, url, description, tags, department, language, stars, forks)
VALUES ('supabase/supabase', 'Supabase Open Source Cloud Platform', 'supabase', 'https://github.com/supabase/supabase', 'The open source Firebase alternative. Build production backends with PostgreSQL, Auth, and Realtime.', '["PostgreSQL","Go","TypeScript","Elixir","Docker"]'::jsonb, 'infrastructure', 'TypeScript', '75.2k', '6.8k')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tags = EXCLUDED.tags,
  stars = EXCLUDED.stars,
  forks = EXCLUDED.forks;

-- ==============================================================================
-- 10. Seed All 76 Role-Wise Sprint Issues (Categorized by Role & Level)
-- ==============================================================================
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-1', 1, 'infrastructure', 'tech-support', 'Technical Support Engineer', 'Easy', 'open-xyz/xmail', '10', 'https://github.com/open-xyz/xmail/issues/10', 'Sprint #10: Fix & enhance module in xmail', '["Reproduce and identify root cause of issue #10 in open-xyz/xmail","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-2', 2, 'infrastructure', 'tech-support', 'Technical Support Engineer', 'Easy', 'open-xyz/xmail', '8', 'https://github.com/open-xyz/xmail/issues/8', 'Sprint #8: Fix & enhance module in xmail', '["Reproduce and identify root cause of issue #8 in open-xyz/xmail","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-3', 3, 'infrastructure', 'tech-support', 'Technical Support Engineer', 'Easy', 'Olatisunkanmi/altschool-backend-musicfy-open-source', '3', 'https://github.com/Olatisunkanmi/altschool-backend-musicfy-open-source/issues/3', 'Sprint #3: Fix & enhance module in altschool-backend-musicfy-open-source', '["Reproduce and identify root cause of issue #3 in Olatisunkanmi/altschool-backend-musicfy-open-source","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-4', 4, 'infrastructure', 'tech-support', 'Technical Support Engineer', 'Medium', 'Indie-Kart/ecommerce-store', '231', 'https://github.com/Indie-Kart/ecommerce-store/issues/231', 'Sprint #231: Fix & enhance module in ecommerce-store', '["Reproduce and identify root cause of issue #231 in Indie-Kart/ecommerce-store","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-5', 5, 'infrastructure', 'tech-support', 'Technical Support Engineer', 'Medium', 'open-xyz/xmail', '10', 'https://github.com/open-xyz/xmail/issues/10', 'Sprint #10: Fix & enhance module in xmail', '["Reproduce and identify root cause of issue #10 in open-xyz/xmail","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-6', 6, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Medium', 'medusajs/medusa', '16701', 'https://github.com/medusajs/medusa/issues/16701', 'Sprint #16701: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16701 in medusajs/medusa","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-7', 7, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Hard', 'medusajs/medusa', '16668', 'https://github.com/medusajs/medusa/issues/16668', 'Sprint #16668: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16668 in medusajs/medusa","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-8', 8, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Easy', 'Dezenix/frontend-reactjs', '41', 'https://github.com/Dezenix/frontend-reactjs/issues/41', 'Sprint #41: Fix & enhance module in frontend-reactjs', '["Reproduce and identify root cause of issue #41 in Dezenix/frontend-reactjs","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-9', 9, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Easy', 'Dezenix/frontend-reactjs', '37', 'https://github.com/Dezenix/frontend-reactjs/issues/37', 'Sprint #37: Fix & enhance module in frontend-reactjs', '["Reproduce and identify root cause of issue #37 in Dezenix/frontend-reactjs","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-10', 10, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Easy', 'Algo-Phantoms/Algo-Phantoms-Frontend', '487', 'https://github.com/Algo-Phantoms/Algo-Phantoms-Frontend/issues/487', 'Sprint #487: Fix & enhance module in Algo-Phantoms-Frontend', '["Reproduce and identify root cause of issue #487 in Algo-Phantoms/Algo-Phantoms-Frontend","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-11', 11, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Easy', 'Algo-Phantoms/Algo-Phantoms-Frontend', '347', 'https://github.com/Algo-Phantoms/Algo-Phantoms-Frontend/issues/347', 'Sprint #347: Fix & enhance module in Algo-Phantoms-Frontend', '["Reproduce and identify root cause of issue #347 in Algo-Phantoms/Algo-Phantoms-Frontend","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-12', 12, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Easy', 'Girl-Code-It/Opportunity-Calendar-Frontend', '257', 'https://github.com/Girl-Code-It/Opportunity-Calendar-Frontend/issues/257', 'Sprint #257: Fix & enhance module in Opportunity-Calendar-Frontend', '["Reproduce and identify root cause of issue #257 in Girl-Code-It/Opportunity-Calendar-Frontend","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-13', 13, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Easy', 'Girl-Code-It/Opportunity-Calendar-Frontend', '256', 'https://github.com/Girl-Code-It/Opportunity-Calendar-Frontend/issues/256', 'Sprint #256: Fix & enhance module in Opportunity-Calendar-Frontend', '["Reproduce and identify root cause of issue #256 in Girl-Code-It/Opportunity-Calendar-Frontend","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-14', 14, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Easy', 'Girl-Code-It/Opportunity-Calendar-Frontend', '179', 'https://github.com/Girl-Code-It/Opportunity-Calendar-Frontend/issues/179', 'Sprint #179: Fix & enhance module in Opportunity-Calendar-Frontend', '["Reproduce and identify root cause of issue #179 in Girl-Code-It/Opportunity-Calendar-Frontend","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-15', 15, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Medium', 'Dezenix/frontend-reactjs', '40', 'https://github.com/Dezenix/frontend-reactjs/issues/40', 'Sprint #40: Fix & enhance module in frontend-reactjs', '["Reproduce and identify root cause of issue #40 in Dezenix/frontend-reactjs","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-16', 16, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Medium', 'Dezenix/frontend-reactjs', '39', 'https://github.com/Dezenix/frontend-reactjs/issues/39', 'Sprint #39: Fix & enhance module in frontend-reactjs', '["Reproduce and identify root cause of issue #39 in Dezenix/frontend-reactjs","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-17', 17, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Medium', 'Algo-Phantoms/Algo-Phantoms-Frontend', '402', 'https://github.com/Algo-Phantoms/Algo-Phantoms-Frontend/issues/402', 'Sprint #402: Fix & enhance module in Algo-Phantoms-Frontend', '["Reproduce and identify root cause of issue #402 in Algo-Phantoms/Algo-Phantoms-Frontend","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-18', 18, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Hard', 'Dezenix/frontend-reactjs', '38', 'https://github.com/Dezenix/frontend-reactjs/issues/38', 'Sprint #38: Fix & enhance module in frontend-reactjs', '["Reproduce and identify root cause of issue #38 in Dezenix/frontend-reactjs","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-19', 19, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Hard', 'Algo-Phantoms/Algo-Phantoms-Frontend', '518', 'https://github.com/Algo-Phantoms/Algo-Phantoms-Frontend/issues/518', 'Sprint #518: Fix & enhance module in Algo-Phantoms-Frontend', '["Reproduce and identify root cause of issue #518 in Algo-Phantoms/Algo-Phantoms-Frontend","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-20', 20, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Hard', 'Algo-Phantoms/Algo-Phantoms-Frontend', '371', 'https://github.com/Algo-Phantoms/Algo-Phantoms-Frontend/issues/371', 'Sprint #371: Fix & enhance module in Algo-Phantoms-Frontend', '["Reproduce and identify root cause of issue #371 in Algo-Phantoms/Algo-Phantoms-Frontend","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-21', 21, 'engineering', 'fe-dev', 'Frontend Developer (Junior)', 'Hard', 'Girl-Code-It/Opportunity-Calendar-Frontend', '235', 'https://github.com/Girl-Code-It/Opportunity-Calendar-Frontend/issues/235', 'Sprint #235: Fix & enhance module in Opportunity-Calendar-Frontend', '["Reproduce and identify root cause of issue #235 in Girl-Code-It/Opportunity-Calendar-Frontend","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-22', 22, 'engineering', 'fullstack-dev', 'Full Stack Developer (Junior)', 'Hard', 'medusajs/medusa', '16770', 'https://github.com/medusajs/medusa/issues/16770', 'Sprint #16770: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16770 in medusajs/medusa","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-23', 23, 'engineering', 'fullstack-dev', 'Full Stack Developer (Junior)', 'Easy', 'Indie-Kart/ecommerce-store', '222', 'https://github.com/Indie-Kart/ecommerce-store/issues/222', 'Sprint #222: Fix & enhance module in ecommerce-store', '["Reproduce and identify root cause of issue #222 in Indie-Kart/ecommerce-store","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-24', 24, 'engineering', 'fullstack-dev', 'Full Stack Developer (Junior)', 'Easy', 'Sayak-Bhunia/mystory', '19', 'https://github.com/Sayak-Bhunia/mystory/issues/19', 'Sprint #19: Fix & enhance module in mystory', '["Reproduce and identify root cause of issue #19 in Sayak-Bhunia/mystory","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-25', 25, 'engineering', 'fullstack-dev', 'Full Stack Developer (Junior)', 'Medium', 'Kajol-Kumari/InfluMart', '100', 'https://github.com/Kajol-Kumari/InfluMart/issues/100', 'Sprint #100: Fix & enhance module in InfluMart', '["Reproduce and identify root cause of issue #100 in Kajol-Kumari/InfluMart","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-26', 26, 'engineering', 'fullstack-dev', 'Full Stack Developer (Junior)', 'Medium', 'Kajol-Kumari/InfluMart', '290', 'https://github.com/Kajol-Kumari/InfluMart/issues/290', 'Sprint #290: Fix & enhance module in InfluMart', '["Reproduce and identify root cause of issue #290 in Kajol-Kumari/InfluMart","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-27', 27, 'engineering', 'fullstack-dev', 'Full Stack Developer (Junior)', 'Medium', 'Indie-Kart/ecommerce-store', '230', 'https://github.com/Indie-Kart/ecommerce-store/issues/230', 'Sprint #230: Fix & enhance module in ecommerce-store', '["Reproduce and identify root cause of issue #230 in Indie-Kart/ecommerce-store","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-28', 28, 'engineering', 'fullstack-dev', 'Full Stack Developer (Junior)', 'Medium', 'Indie-Kart/ecommerce-store', '216', 'https://github.com/Indie-Kart/ecommerce-store/issues/216', 'Sprint #216: Fix & enhance module in ecommerce-store', '["Reproduce and identify root cause of issue #216 in Indie-Kart/ecommerce-store","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-29', 29, 'engineering', 'fullstack-dev', 'Full Stack Developer (Junior)', 'Hard', 'Kajol-Kumari/InfluMart', '197', 'https://github.com/Kajol-Kumari/InfluMart/issues/197', 'Sprint #197: Fix & enhance module in InfluMart', '["Reproduce and identify root cause of issue #197 in Kajol-Kumari/InfluMart","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-30', 30, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Hard', 'medusajs/medusa', '16751', 'https://github.com/medusajs/medusa/issues/16751', 'Sprint #16751: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16751 in medusajs/medusa","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-31', 31, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Hard', 'medusajs/medusa', '16744', 'https://github.com/medusajs/medusa/issues/16744', 'Sprint #16744: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16744 in medusajs/medusa","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-32', 32, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Hard', 'medusajs/medusa', '16727', 'https://github.com/medusajs/medusa/issues/16727', 'Sprint #16727: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16727 in medusajs/medusa","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-33', 33, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Medium', 'medusajs/medusa', '16652', 'https://github.com/medusajs/medusa/issues/16652', 'Sprint #16652: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16652 in medusajs/medusa","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-34', 34, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Medium', 'medusajs/medusa', '16636', 'https://github.com/medusajs/medusa/issues/16636', 'Sprint #16636: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16636 in medusajs/medusa","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-35', 35, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Medium', 'medusajs/medusa', '16625', 'https://github.com/medusajs/medusa/issues/16625', 'Sprint #16625: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16625 in medusajs/medusa","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-36', 36, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Medium', 'medusajs/medusa', '16621', 'https://github.com/medusajs/medusa/issues/16621', 'Sprint #16621: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16621 in medusajs/medusa","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-37', 37, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Medium', 'medusajs/medusa', '16619', 'https://github.com/medusajs/medusa/issues/16619', 'Sprint #16619: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16619 in medusajs/medusa","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-38', 38, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Hard', 'medusajs/medusa', '16583', 'https://github.com/medusajs/medusa/issues/16583', 'Sprint #16583: Fix & enhance module in medusa', '["Reproduce and identify root cause of issue #16583 in medusajs/medusa","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-39', 39, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Hard', 'saleor/saleor', '19498', 'https://github.com/saleor/saleor/issues/19498', 'Sprint #19498: Fix & enhance module in saleor', '["Reproduce and identify root cause of issue #19498 in saleor/saleor","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-40', 40, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Medium', 'saleor/saleor', '19412', 'https://github.com/saleor/saleor/issues/19412', 'Sprint #19412: Fix & enhance module in saleor', '["Reproduce and identify root cause of issue #19412 in saleor/saleor","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-41', 41, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Medium', 'saleor/saleor', '19246', 'https://github.com/saleor/saleor/issues/19246', 'Sprint #19246: Fix & enhance module in saleor', '["Reproduce and identify root cause of issue #19246 in saleor/saleor","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-42', 42, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Medium', 'dishamodi0910/APIVerse', '154', 'https://github.com/dishamodi0910/APIVerse/issues/154', 'Sprint #154: Fix & enhance module in APIVerse', '["Reproduce and identify root cause of issue #154 in dishamodi0910/APIVerse","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-43', 43, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Hard', 'dishamodi0910/APIVerse', '153', 'https://github.com/dishamodi0910/APIVerse/issues/153', 'Sprint #153: Fix & enhance module in APIVerse', '["Reproduce and identify root cause of issue #153 in dishamodi0910/APIVerse","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-44', 44, 'engineering', 'be-dev', 'Backend Developer (Junior)', 'Hard', 'dishamodi0910/APIVerse', '121', 'https://github.com/dishamodi0910/APIVerse/issues/121', 'Sprint #121: Fix & enhance module in APIVerse', '["Reproduce and identify root cause of issue #121 in dishamodi0910/APIVerse","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-45', 45, 'infrastructure', 'db-auth', 'Database / Auth Infrastructure Engineer', 'Hard', 'supabase/supabase', '50009', 'https://github.com/supabase/supabase/issues/50009', 'Sprint #50009: Fix & enhance module in supabase', '["Reproduce and identify root cause of issue #50009 in supabase/supabase","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-46', 46, 'infrastructure', 'db-auth', 'Database / Auth Infrastructure Engineer', 'Hard', 'supabase/supabase', '49991', 'https://github.com/supabase/supabase/issues/49991', 'Sprint #49991: Fix & enhance module in supabase', '["Reproduce and identify root cause of issue #49991 in supabase/supabase","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-47', 47, 'infrastructure', 'db-auth', 'Database / Auth Infrastructure Engineer', 'Hard', 'supabase/supabase', '48862', 'https://github.com/supabase/supabase/issues/48862', 'Sprint #48862: Fix & enhance module in supabase', '["Reproduce and identify root cause of issue #48862 in supabase/supabase","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-48', 48, 'infrastructure', 'db-auth', 'Database / Auth Infrastructure Engineer', 'Medium', 'supabase/supabase', '48977', 'https://github.com/supabase/supabase/issues/48977', 'Sprint #48977: Fix & enhance module in supabase', '["Reproduce and identify root cause of issue #48977 in supabase/supabase","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-49', 49, 'infrastructure', 'db-auth', 'Database / Auth Infrastructure Engineer', 'Medium', 'supabase/supabase', '48918', 'https://github.com/supabase/supabase/issues/48918', 'Sprint #48918: Fix & enhance module in supabase', '["Reproduce and identify root cause of issue #48918 in supabase/supabase","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-50', 50, 'infrastructure', 'db-auth', 'Database / Auth Infrastructure Engineer', 'Medium', 'supabase/supabase', '48814', 'https://github.com/supabase/supabase/issues/48814', 'Sprint #48814: Fix & enhance module in supabase', '["Reproduce and identify root cause of issue #48814 in supabase/supabase","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-51', 51, 'infrastructure', 'db-auth', 'Database / Auth Infrastructure Engineer', 'Hard', 'supabase/supabase', '48164', 'https://github.com/supabase/supabase/issues/48164', 'Sprint #48164: Fix & enhance module in supabase', '["Reproduce and identify root cause of issue #48164 in supabase/supabase","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-52', 52, 'infrastructure', 'db-auth', 'Database / Auth Infrastructure Engineer', 'Medium', 'supabase/supabase', '45671', 'https://github.com/supabase/supabase/issues/45671', 'Sprint #45671: Fix & enhance module in supabase', '["Reproduce and identify root cause of issue #45671 in supabase/supabase","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-53', 53, 'engineering', 'mobile-dev', 'Mobile App Developer (Android/iOS) (Junior)', 'Hard', 'flutter/flutter', '75662', 'https://github.com/flutter/flutter/issues/75662', 'Sprint #75662: Fix & enhance module in flutter', '["Reproduce and identify root cause of issue #75662 in flutter/flutter","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-54', 54, 'infrastructure', 'devops-eng', 'DevOps Engineer (Junior)', 'Medium', 'Indie-Kart/ecommerce-store', '211', 'https://github.com/Indie-Kart/ecommerce-store/issues/211', 'Sprint #211: Fix & enhance module in ecommerce-store', '["Reproduce and identify root cause of issue #211 in Indie-Kart/ecommerce-store","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-55', 55, 'infrastructure', 'devops-eng', 'DevOps Engineer (Junior)', 'Medium', 'Yeasir0032/Discord-Clone', '35', 'https://github.com/Yeasir0032/Discord-Clone/issues/35', 'Sprint #35: Fix & enhance module in Discord-Clone', '["Reproduce and identify root cause of issue #35 in Yeasir0032/Discord-Clone","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-56', 56, 'data', 'data-analyst', 'Data Analyst (Junior)', 'Easy', 'Kajol-Kumari/InfluMart', '178', 'https://github.com/Kajol-Kumari/InfluMart/issues/178', 'Sprint #178: Fix & enhance module in InfluMart', '["Reproduce and identify root cause of issue #178 in Kajol-Kumari/InfluMart","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-57', 57, 'data', 'data-analyst', 'Data Analyst (Junior)', 'Medium', 'Niketkumardheeryan/ML-CaPsule', '622', 'https://github.com/Niketkumardheeryan/ML-CaPsule/issues/622', 'Sprint #622: Fix & enhance module in ML-CaPsule', '["Reproduce and identify root cause of issue #622 in Niketkumardheeryan/ML-CaPsule","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-58', 58, 'data', 'data-scientist', 'Data Scientist (Associate/Junior)', 'Medium', 'Niketkumardheeryan/ML-CaPsule', '628', 'https://github.com/Niketkumardheeryan/ML-CaPsule/issues/628', 'Sprint #628: Fix & enhance module in ML-CaPsule', '["Reproduce and identify root cause of issue #628 in Niketkumardheeryan/ML-CaPsule","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-59', 59, 'product', 'prod-eng', 'Associate Product Engineer', 'Hard', 'Kajol-Kumari/InfluMart', '196', 'https://github.com/Kajol-Kumari/InfluMart/issues/196', 'Sprint #196: Fix & enhance module in InfluMart', '["Reproduce and identify root cause of issue #196 in Kajol-Kumari/InfluMart","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-60', 60, 'infrastructure', 'sysadmin', 'Junior Systems Engineer / Systems Administrator', 'Easy', 'Olatisunkanmi/altschool-backend-musicfy-open-source', '6', 'https://github.com/Olatisunkanmi/altschool-backend-musicfy-open-source/issues/6', 'Sprint #6: Fix & enhance module in altschool-backend-musicfy-open-source', '["Reproduce and identify root cause of issue #6 in Olatisunkanmi/altschool-backend-musicfy-open-source","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-61', 61, 'infrastructure', 'sysadmin', 'Junior Systems Engineer / Systems Administrator', 'Easy', 'Olatisunkanmi/altschool-backend-musicfy-open-source', '1', 'https://github.com/Olatisunkanmi/altschool-backend-musicfy-open-source/issues/1', 'Sprint #1: Fix & enhance module in altschool-backend-musicfy-open-source', '["Reproduce and identify root cause of issue #1 in Olatisunkanmi/altschool-backend-musicfy-open-source","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-62', 62, 'infrastructure', 'sysadmin', 'Junior Systems Engineer / Systems Administrator', 'Easy', 'sahil-sagwekar2652/GitHub-Automation-scripts', '20', 'https://github.com/sahil-sagwekar2652/GitHub-Automation-scripts/issues/20', 'Sprint #20: Fix & enhance module in GitHub-Automation-scripts', '["Reproduce and identify root cause of issue #20 in sahil-sagwekar2652/GitHub-Automation-scripts","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-63', 63, 'infrastructure', 'sysadmin', 'Junior Systems Engineer / Systems Administrator', 'Easy', 'sahil-sagwekar2652/GitHub-Automation-scripts', '9', 'https://github.com/sahil-sagwekar2652/GitHub-Automation-scripts/issues/9', 'Sprint #9: Fix & enhance module in GitHub-Automation-scripts', '["Reproduce and identify root cause of issue #9 in sahil-sagwekar2652/GitHub-Automation-scripts","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-64', 64, 'infrastructure', 'sysadmin', 'Junior Systems Engineer / Systems Administrator', 'Medium', 'open-xyz/xmail', '32', 'https://github.com/open-xyz/xmail/issues/32', 'Sprint #32: Fix & enhance module in xmail', '["Reproduce and identify root cause of issue #32 in open-xyz/xmail","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-65', 65, 'infrastructure', 'sysadmin', 'Junior Systems Engineer / Systems Administrator', 'Medium', 'open-xyz/xmail', '21', 'https://github.com/open-xyz/xmail/issues/21', 'Sprint #21: Fix & enhance module in xmail', '["Reproduce and identify root cause of issue #21 in open-xyz/xmail","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-66', 66, 'infrastructure', 'sysadmin', 'Junior Systems Engineer / Systems Administrator', 'Medium', 'Yeasir0032/Discord-Clone', '41', 'https://github.com/Yeasir0032/Discord-Clone/issues/41', 'Sprint #41: Fix & enhance module in Discord-Clone', '["Reproduce and identify root cause of issue #41 in Yeasir0032/Discord-Clone","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-67', 67, 'infrastructure', 'sysadmin', 'Junior Systems Engineer / Systems Administrator', 'Medium', 'sahil-sagwekar2652/GitHub-Automation-scripts', '22', 'https://github.com/sahil-sagwekar2652/GitHub-Automation-scripts/issues/22', 'Sprint #22: Fix & enhance module in GitHub-Automation-scripts', '["Reproduce and identify root cause of issue #22 in sahil-sagwekar2652/GitHub-Automation-scripts","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-68', 68, 'infrastructure', 'sysadmin', 'Junior Systems Engineer / Systems Administrator', 'Hard', 'sahil-sagwekar2652/GitHub-Automation-scripts', '37', 'https://github.com/sahil-sagwekar2652/GitHub-Automation-scripts/issues/37', 'Sprint #37: Fix & enhance module in GitHub-Automation-scripts', '["Reproduce and identify root cause of issue #37 in sahil-sagwekar2652/GitHub-Automation-scripts","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-69', 69, 'infrastructure', 'sysadmin', 'Junior Systems Engineer / Systems Administrator', 'Hard', 'sahil-sagwekar2652/GitHub-Automation-scripts', '15', 'https://github.com/sahil-sagwekar2652/GitHub-Automation-scripts/issues/15', 'Sprint #15: Fix & enhance module in GitHub-Automation-scripts', '["Reproduce and identify root cause of issue #15 in sahil-sagwekar2652/GitHub-Automation-scripts","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-70', 70, 'engineering', 'sde-1', 'Software Development Engineer (SDE-1)', 'Easy', 'open-xyz/xmail', '24', 'https://github.com/open-xyz/xmail/issues/24', 'Sprint #24: Fix & enhance module in xmail', '["Reproduce and identify root cause of issue #24 in open-xyz/xmail","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-71', 71, 'engineering', 'sde-1', 'Software Development Engineer (SDE-1)', 'Easy', 'open-xyz/xmail', '15', 'https://github.com/open-xyz/xmail/issues/15', 'Sprint #15: Fix & enhance module in xmail', '["Reproduce and identify root cause of issue #15 in open-xyz/xmail","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-72', 72, 'engineering', 'sde-1', 'Software Development Engineer (SDE-1)', 'Easy', 'Niketkumardheeryan/ML-CaPsule', '625', 'https://github.com/Niketkumardheeryan/ML-CaPsule/issues/625', 'Sprint #625: Fix & enhance module in ML-CaPsule', '["Reproduce and identify root cause of issue #625 in Niketkumardheeryan/ML-CaPsule","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-73', 73, 'engineering', 'sde-1', 'Software Development Engineer (SDE-1)', 'Easy', 'Yeasir0032/Discord-Clone', '59', 'https://github.com/Yeasir0032/Discord-Clone/issues/59', 'Sprint #59: Fix & enhance module in Discord-Clone', '["Reproduce and identify root cause of issue #59 in Yeasir0032/Discord-Clone","Implement modular fix adhering to Easy code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 50)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-74', 74, 'engineering', 'sde-1', 'Software Development Engineer (SDE-1)', 'Medium', 'Olatisunkanmi/altschool-backend-musicfy-open-source', '10', 'https://github.com/Olatisunkanmi/altschool-backend-musicfy-open-source/issues/10', 'Sprint #10: Fix & enhance module in altschool-backend-musicfy-open-source', '["Reproduce and identify root cause of issue #10 in Olatisunkanmi/altschool-backend-musicfy-open-source","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-75', 75, 'engineering', 'sde-1', 'Software Development Engineer (SDE-1)', 'Medium', 'sahil-sagwekar2652/GitHub-Automation-scripts', '10', 'https://github.com/sahil-sagwekar2652/GitHub-Automation-scripts/issues/10', 'Sprint #10: Fix & enhance module in GitHub-Automation-scripts', '["Reproduce and identify root cause of issue #10 in sahil-sagwekar2652/GitHub-Automation-scripts","Implement modular fix adhering to Medium code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 75)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
INSERT INTO public.role_problems (id, s_no, department, role_id, role_title, level, repo, issue_no, issue_url, title, acceptance_criteria, xp_reward)
VALUES ('PROB-76', 76, 'engineering', 'sde-1', 'Software Development Engineer (SDE-1)', 'Hard', 'sahil-sagwekar2652/GitHub-Automation-scripts', '43', 'https://github.com/sahil-sagwekar2652/GitHub-Automation-scripts/issues/43', 'Sprint #43: Fix & enhance module in GitHub-Automation-scripts', '["Reproduce and identify root cause of issue #43 in sahil-sagwekar2652/GitHub-Automation-scripts","Implement modular fix adhering to Hard code standards and lint rules","Verify regression assertions and submit Pull Request for engineering review"]'::jsonb, 100)
ON CONFLICT (id) DO UPDATE SET
  level = EXCLUDED.level,
  title = EXCLUDED.title,
  role_title = EXCLUDED.role_title,
  role_id = EXCLUDED.role_id,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  xp_reward = EXCLUDED.xp_reward;
