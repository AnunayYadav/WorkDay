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
  emp_id TEXT UNIQUE NOT NULL DEFAULT 'VHQ-8302',
  email TEXT,
  full_name TEXT NOT NULL DEFAULT 'Alex Morgan',
  preferred_name TEXT DEFAULT 'Alex',
  handle TEXT DEFAULT 'alexmorgan',
  department TEXT DEFAULT 'engineering',
  role_title TEXT DEFAULT 'Frontend Developer (Junior)',
  role_level TEXT DEFAULT 'LEVEL 1 · JUNIOR',
  avatar_url TEXT,
  total_xp INTEGER DEFAULT 200,
  is_signed BOOLEAN DEFAULT false,
  signature_url TEXT,
  auth_provider TEXT DEFAULT 'github',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_emp_id ON public.profiles(emp_id);

-- 4. Create Pull Requests Table
CREATE TABLE IF NOT EXISTS public.pull_requests (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  issue_no TEXT,
  repo TEXT,
  title TEXT,
  author TEXT NOT NULL DEFAULT 'Alex Morgan',
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

-- 7. Trigger: Auto-provision profile on GitHub OAuth / Email signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_name TEXT;
  extracted_handle TEXT;
  extracted_avatar TEXT;
  generated_emp_id TEXT;
BEGIN
  extracted_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'Engineering Recruit'
  );
  extracted_handle := COALESCE(
    new.raw_user_meta_data->>'user_name',
    new.raw_user_meta_data->>'preferred_username',
    split_part(new.email, '@', 1),
    'engineer'
  );
  extracted_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar_url',
    ''
  );
  generated_emp_id := 'VHQ-' || floor(1000 + random() * 9000)::text;

  INSERT INTO public.profiles (
    user_id,
    emp_id,
    email,
    full_name,
    preferred_name,
    handle,
    avatar_url,
    auth_provider,
    department,
    role_title,
    role_level,
    total_xp,
    is_signed
  ) VALUES (
    new.id,
    generated_emp_id,
    new.email,
    extracted_name,
    split_part(extracted_name, ' ', 1),
    extracted_handle,
    extracted_avatar,
    COALESCE(new.app_metadata->>'provider', 'github'),
    'engineering',
    'Frontend Developer (Junior)',
    'LEVEL 1 · JUNIOR',
    200,
    true
  )
  ON CONFLICT (emp_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Enable Realtime Publications
-- Broadcast live changes when PRs are submitted or approved
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pull_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pull_requests;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
