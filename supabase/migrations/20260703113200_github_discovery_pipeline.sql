-- Migration: GitHub Discovery & Prompt Import Pipeline
-- Phase 2 schema: discovery queries, jobs, repositories, classifications, review queue, analytics.

-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categorization jobs table (referenced by existing code but missing)
CREATE TABLE IF NOT EXISTS public.categorization_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority int NOT NULL DEFAULT 5,
  attempt_count int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  error_message text,
  input_hash text,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_categorization_jobs_listing_id ON public.categorization_jobs(listing_id);
CREATE INDEX IF NOT EXISTS idx_categorization_jobs_status ON public.categorization_jobs(status);

-- Admin-managed GitHub discovery queries
CREATE TABLE IF NOT EXISTS public.discovery_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  query text NOT NULL,
  sort text NOT NULL DEFAULT 'stars',
  "order" text NOT NULL DEFAULT 'desc',
  language text,
  topics text[] DEFAULT '{}',
  min_stars int NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  schedule_cron text,
  last_run_at timestamptz,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_discovery_queries_name ON public.discovery_queries(name);

-- Discovery job runs
CREATE TABLE IF NOT EXISTS public.discovery_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid NOT NULL REFERENCES public.discovery_queries(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  repos_found int NOT NULL DEFAULT 0,
  repos_new int NOT NULL DEFAULT 0,
  repos_duplicated int NOT NULL DEFAULT 0,
  repos_failed int NOT NULL DEFAULT 0,
  error_message text,
  raw_response jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discovery_jobs_query_id ON public.discovery_jobs(query_id);
CREATE INDEX IF NOT EXISTS idx_discovery_jobs_status ON public.discovery_jobs(status);
CREATE INDEX IF NOT EXISTS idx_discovery_jobs_created_at ON public.discovery_jobs(created_at);

-- Unique discovered repositories
CREATE TABLE IF NOT EXISTS public.discovered_repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id bigint NOT NULL UNIQUE,
  owner text NOT NULL,
  name text NOT NULL,
  full_name text NOT NULL UNIQUE,
  description text,
  html_url text NOT NULL,
  default_branch text,
  primary_language text,
  topics text[] DEFAULT '{}',
  license text,
  stargazers_count int NOT NULL DEFAULT 0,
  forks_count int NOT NULL DEFAULT 0,
  watchers_count int NOT NULL DEFAULT 0,
  open_issues_count int NOT NULL DEFAULT 0,
  pushed_at timestamptz,
  created_at timestamptz,
  repo_size_kb int,
  has_readme boolean NOT NULL DEFAULT false,
  homepage text,
  owner_avatar_url text,
  owner_html_url text,
  metadata jsonb NOT NULL DEFAULT '{}',
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'queued', 'imported', 'rejected', 'archived')),
  quality_score int,
  search_vector tsvector
);

CREATE INDEX IF NOT EXISTS idx_discovered_repositories_full_name ON public.discovered_repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_discovered_repositories_status ON public.discovered_repositories(status);
CREATE INDEX IF NOT EXISTS idx_discovered_repositories_stars ON public.discovered_repositories(stargazers_count DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_repositories_last_seen ON public.discovered_repositories(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_repositories_search_vector ON public.discovered_repositories USING GIN (search_vector);

-- Historical repository snapshots per discovery run
CREATE TABLE IF NOT EXISTS public.repository_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES public.discovered_repositories(id) ON DELETE CASCADE,
  discovery_job_id uuid NOT NULL REFERENCES public.discovery_jobs(id) ON DELETE CASCADE,
  stargazers_count int NOT NULL DEFAULT 0,
  forks_count int NOT NULL DEFAULT 0,
  watchers_count int NOT NULL DEFAULT 0,
  open_issues_count int NOT NULL DEFAULT 0,
  repo_size_kb int,
  has_readme boolean NOT NULL DEFAULT false,
  topics text[] DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repository_versions_repository_id ON public.repository_versions(repository_id);
CREATE INDEX IF NOT EXISTS idx_repository_versions_job_id ON public.repository_versions(discovery_job_id);

-- AI classification results for discovered repositories
CREATE TABLE IF NOT EXISTS public.repository_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL UNIQUE REFERENCES public.discovered_repositories(id) ON DELETE CASCADE,
  primary_category text,
  secondary_categories text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  difficulty text,
  target_audience text[] DEFAULT '{}',
  supported_models text[] DEFAULT '{}',
  supported_ides text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  frameworks text[] DEFAULT '{}',
  industries text[] DEFAULT '{}',
  use_cases text[] DEFAULT '{}',
  quality_score int,
  confidence_score numeric CHECK (confidence_score >= 0 AND confidence_score <= 1),
  marketplace_relevance text,
  related_repositories text[] DEFAULT '{}',
  classified_at timestamptz NOT NULL DEFAULT now(),
  classification_result jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_repository_classifications_repository_id ON public.repository_classifications(repository_id);
CREATE INDEX IF NOT EXISTS idx_repository_classifications_primary_category ON public.repository_classifications(primary_category);

-- Review queue linking discovered repos to marketplace listings
CREATE TABLE IF NOT EXISTS public.import_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES public.discovered_repositories(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'needs_review', 'approved', 'rejected', 'archived')),
  priority int NOT NULL DEFAULT 5,
  notes text,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_import_queue_repository_id ON public.import_queue(repository_id);
CREATE INDEX IF NOT EXISTS idx_import_queue_status ON public.import_queue(status);
CREATE INDEX IF NOT EXISTS idx_import_queue_priority ON public.import_queue(priority DESC);

-- Discovery analytics / event log
CREATE TABLE IF NOT EXISTS public.discovery_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.discovery_jobs(id) ON DELETE SET NULL,
  query_id uuid REFERENCES public.discovery_queries(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('success', 'fail', 'skip', 'rate_limit', 'duplicate')),
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discovery_analytics_job_id ON public.discovery_analytics(job_id);
CREATE INDEX IF NOT EXISTS idx_discovery_analytics_query_id ON public.discovery_analytics(query_id);
CREATE INDEX IF NOT EXISTS idx_discovery_analytics_event_type ON public.discovery_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_discovery_analytics_created_at ON public.discovery_analytics(created_at);

-- Full-text search trigger for discovered repositories
CREATE OR REPLACE FUNCTION public.update_discovered_repository_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.owner, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.topics, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_discovered_repositories_search_vector ON public.discovered_repositories;
CREATE TRIGGER trg_discovered_repositories_search_vector
BEFORE INSERT OR UPDATE ON public.discovered_repositories
FOR EACH ROW EXECUTE FUNCTION public.update_discovered_repository_search_vector();

-- RLS: enable on all new tables
ALTER TABLE public.categorization_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovered_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_analytics ENABLE ROW LEVEL SECURITY;

-- Admins can manage everything
CREATE POLICY admin_all_categorization_jobs ON public.categorization_jobs FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all_discovery_queries ON public.discovery_queries FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all_discovery_jobs ON public.discovery_jobs FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all_discovered_repositories ON public.discovered_repositories FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all_repository_versions ON public.repository_versions FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all_repository_classifications ON public.repository_classifications FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all_import_queue ON public.import_queue FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY admin_all_discovery_analytics ON public.discovery_analytics FOR ALL TO public USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Service role can access everything (for background jobs)
CREATE POLICY service_all_categorization_jobs ON public.categorization_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all_discovery_queries ON public.discovery_queries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all_discovery_jobs ON public.discovery_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all_discovered_repositories ON public.discovered_repositories FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all_repository_versions ON public.repository_versions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all_repository_classifications ON public.repository_classifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all_import_queue ON public.import_queue FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_all_discovery_analytics ON public.discovery_analytics FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ensure is_admin() function exists; create a safe fallback if not.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'OWNER')
  );
EXCEPTION WHEN undefined_table THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_discovery_queries_updated_at ON public.discovery_queries;
CREATE TRIGGER trg_discovery_queries_updated_at BEFORE UPDATE ON public.discovery_queries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_discovery_jobs_updated_at ON public.discovery_jobs;
CREATE TRIGGER trg_discovery_jobs_updated_at BEFORE UPDATE ON public.discovery_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_import_queue_updated_at ON public.import_queue;
CREATE TRIGGER trg_import_queue_updated_at BEFORE UPDATE ON public.import_queue FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_categorization_jobs_updated_at ON public.categorization_jobs;
CREATE TRIGGER trg_categorization_jobs_updated_at BEFORE UPDATE ON public.categorization_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
