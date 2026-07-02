-- Migration: AI categorization engine
-- Adds multi-category support, categorization jobs, and AI-generated metadata tracking.

-- 1. Extend categories with metadata
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS display_group text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories (is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories (parent_id);

-- 2. Seed official marketplace categories
INSERT INTO public.categories (name, slug, description, icon, is_active, sort_order, display_group)
VALUES
  ('Claude Code Skills', 'claude-code-skills', 'Skills purpose-built for Claude Code', 'Sparkles', true, 10, 'AI Assistant'),
  ('Cursor Rules', 'cursor-rules', 'Context and conventions for Cursor', 'Code2', true, 20, 'AI Assistant'),
  ('Codex Agents', 'codex-agents', 'Autonomous agents for Codex CLI', 'Bot', true, 30, 'AI Assistant'),
  ('Windsurf Workflows', 'windsurf-workflows', 'Reusable workflow templates for Windsurf', 'Workflow', true, 40, 'AI Assistant'),
  ('ChatGPT Prompts', 'chatgpt-prompts', 'Curated prompts for ChatGPT', 'MessageSquare', true, 50, 'AI Assistant'),
  ('Gemini Gems', 'gemini-gems', 'Instruction gems and memory for Gemini', 'Sparkles', true, 60, 'AI Assistant'),
  ('AI Agents', 'ai-agents', 'Autonomous agents for any task', 'Bot', true, 70, 'Type'),
  ('Workflow Templates', 'workflow-templates', 'Multi-step AI workflows', 'Workflow', true, 80, 'Type'),
  ('Architect Blueprints', 'architect-blueprints', 'AI-generated project blueprints', 'FileText', true, 90, 'Type'),
  ('Prompt Packs', 'prompt-packs', 'Curated prompt libraries', 'Lightbulb', true, 100, 'Type'),
  ('Automation', 'automation', 'No-code and code automation packs', 'Zap', true, 110, 'Type'),
  ('Memory Systems', 'memory-systems', 'Long-term context and memory packs', 'Database', true, 120, 'Type'),
  ('Documentation', 'documentation', 'README, spec, and doc templates', 'BookOpen', true, 130, 'Type'),
  ('Development Tools', 'development-tools', 'IDE plugins, CLI tools, and helpers', 'Wrench', true, 140, 'Type'),
  ('Frontend', 'frontend', 'UI, design, and frontend skills', 'Palette', true, 150, 'Domain'),
  ('Backend', 'backend', 'API, database, and backend skills', 'Cpu', true, 160, 'Domain'),
  ('Full Stack', 'full-stack', 'End-to-end project skills', 'Layers', true, 170, 'Domain'),
  ('API Development', 'api-development', 'REST, GraphQL, and API design', 'Globe', true, 180, 'Domain'),
  ('Database', 'database', 'Database schemas, queries, and tooling', 'Database', true, 190, 'Domain'),
  ('Authentication', 'authentication', 'Auth, identity, and access control', 'Shield', true, 200, 'Domain'),
  ('Security', 'security', 'Security audits, hardening, and best practices', 'ShieldCheck', true, 210, 'Domain'),
  ('DevOps', 'devops', 'CI/CD, cloud, and infrastructure', 'Globe', true, 220, 'Domain'),
  ('Docker', 'docker', 'Containerization with Docker', 'Container', true, 230, 'DevOps'),
  ('Kubernetes', 'kubernetes', 'Container orchestration with Kubernetes', 'Box', true, 240, 'DevOps'),
  ('Cloud', 'cloud', 'Multi-cloud and cloud-native skills', 'Cloud', true, 250, 'DevOps'),
  ('AWS', 'aws', 'Amazon Web Services skills', 'Cloud', true, 260, 'Cloud'),
  ('Azure', 'azure', 'Microsoft Azure skills', 'Cloud', true, 270, 'Cloud'),
  ('Google Cloud', 'google-cloud', 'Google Cloud Platform skills', 'Cloud', true, 280, 'Cloud'),
  ('CI/CD', 'ci-cd', 'Continuous integration and delivery', 'GitBranch', true, 290, 'DevOps'),
  ('Testing', 'testing', 'Unit, integration, and E2E testing', 'FlaskConical', true, 300, 'DevOps'),
  ('Debugging', 'debugging', 'Debugging tools and techniques', 'Bug', true, 310, 'DevOps'),
  ('Performance', 'performance', 'Performance optimization', 'Gauge', true, 320, 'DevOps'),
  ('Monitoring', 'monitoring', 'Observability and monitoring', 'Activity', true, 330, 'DevOps'),
  ('Logging', 'logging', 'Logging and log aggregation', 'ScrollText', true, 340, 'DevOps'),
  ('React', 'react', 'React skills, components, and patterns', 'Atom', true, 350, 'Framework'),
  ('Next.js', 'next-js', 'Next.js skills and patterns', 'SquareArrowOutUpRight', true, 360, 'Framework'),
  ('Vue', 'vue', 'Vue.js skills and patterns', 'Triangle', true, 370, 'Framework'),
  ('Angular', 'angular', 'Angular skills and patterns', 'Hexagon', true, 380, 'Framework'),
  ('Svelte', 'svelte', 'Svelte skills and patterns', 'Layers', true, 390, 'Framework'),
  ('Node.js', 'node-js', 'Node.js runtime skills', 'Server', true, 400, 'Language'),
  ('Python', 'python', 'Python skills and libraries', 'Code', true, 410, 'Language'),
  ('TypeScript', 'typescript', 'TypeScript skills and patterns', 'FileCode', true, 420, 'Language'),
  ('JavaScript', 'javascript', 'JavaScript skills and patterns', 'FileCode2', true, 430, 'Language'),
  ('Go', 'go', 'Go skills and patterns', 'Terminal', true, 440, 'Language'),
  ('Rust', 'rust', 'Rust skills and patterns', 'Cog', true, 450, 'Language'),
  ('Java', 'java', 'Java skills and patterns', 'Coffee', true, 460, 'Language'),
  ('C#', 'csharp', 'C# skills and patterns', 'Hash', true, 470, 'Language'),
  ('Mobile', 'mobile', 'Mobile development skills', 'Smartphone', true, 480, 'Domain'),
  ('React Native', 'react-native', 'React Native mobile apps', 'Smartphone', true, 490, 'Mobile'),
  ('Flutter', 'flutter', 'Flutter cross-platform apps', 'Smartphone', true, 500, 'Mobile'),
  ('Swift', 'swift', 'Swift and iOS development', 'Apple', true, 510, 'Mobile'),
  ('Kotlin', 'kotlin', 'Kotlin and Android development', 'Smartphone', true, 520, 'Mobile'),
  ('UI Components', 'ui-components', 'Reusable UI components and libraries', 'LayoutTemplate', true, 530, 'Frontend'),
  ('TailwindCSS', 'tailwindcss', 'Tailwind CSS utilities and patterns', 'Wind', true, 540, 'Frontend'),
  ('Design Systems', 'design-systems', 'Component libraries and design tokens', 'Palette', true, 550, 'Frontend'),
  ('shadcn/ui', 'shadcn-ui', 'shadcn/ui components and patterns', 'Component', true, 560, 'Frontend'),
  ('Supabase', 'supabase', 'Supabase skills and patterns', 'Database', true, 570, 'Backend'),
  ('Firebase', 'firebase', 'Firebase skills and patterns', 'Flame', true, 580, 'Backend'),
  ('Postgres', 'postgres', 'PostgreSQL skills and patterns', 'Database', true, 590, 'Backend'),
  ('MongoDB', 'mongodb', 'MongoDB skills and patterns', 'Database', true, 600, 'Backend'),
  ('Redis', 'redis', 'Redis skills and patterns', 'Database', true, 610, 'Backend'),
  ('GraphQL', 'graphql', 'GraphQL APIs and tooling', 'GitBranch', true, 620, 'API'),
  ('REST APIs', 'rest-apis', 'REST API design and tooling', 'Globe', true, 630, 'API'),
  ('Machine Learning', 'machine-learning', 'ML models, training, and inference', 'Brain', true, 640, 'AI'),
  ('LLMs', 'llms', 'Large language model integrations', 'MessageSquare', true, 650, 'AI'),
  ('RAG', 'rag', 'Retrieval-augmented generation', 'Search', true, 660, 'AI'),
  ('Vector Databases', 'vector-databases', 'Vector search and embeddings storage', 'Database', true, 670, 'AI'),
  ('Embeddings', 'embeddings', 'Embedding models and techniques', 'Layers', true, 680, 'AI'),
  ('Prompt Engineering', 'prompt-engineering', 'Prompt design and optimization', 'PenTool', true, 690, 'AI'),
  ('Fine Tuning', 'fine-tuning', 'Model fine-tuning and adaptation', 'Sliders', true, 700, 'AI'),
  ('AI Productivity', 'ai-productivity', 'Productivity and AI assistants', 'Zap', true, 710, 'AI'),
  ('Business Automation', 'business-automation', 'Business process automation', 'Briefcase', true, 720, 'Automation'),
  ('Content Creation', 'content-creation', 'AI content generation and editing', 'PenTool', true, 730, 'Automation'),
  ('Marketing', 'marketing', 'Marketing automation and tools', 'Megaphone', true, 740, 'Automation'),
  ('Sales', 'sales', 'Sales automation and tools', 'TrendingUp', true, 750, 'Automation'),
  ('SEO', 'seo', 'Search engine optimization tools', 'Search', true, 760, 'Automation'),
  ('Data Analysis', 'data-analysis', 'Data analysis and visualization', 'BarChart', true, 770, 'Automation'),
  ('Finance', 'finance', 'Finance and accounting automation', 'DollarSign', true, 780, 'Automation'),
  ('Education', 'education', 'Education and learning tools', 'GraduationCap', true, 790, 'Automation'),
  ('Developer Tools', 'developer-tools', 'Tools for software developers', 'Wrench', true, 800, 'Type'),
  ('Utilities', 'utilities', 'General utility skills and tools', 'Tool', true, 810, 'Type'),
  ('Open Source', 'open-source', 'Open source projects and contributions', 'Github', true, 820, 'Type')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  display_group = EXCLUDED.display_group,
  updated_at = now();

-- 3. Multi-category listing junction table
CREATE TABLE IF NOT EXISTS public.listing_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  confidence numeric(5,2) DEFAULT 0,
  reason text,
  is_ai_generated boolean DEFAULT false,
  manual_override boolean DEFAULT false,
  model_version text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (listing_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_categories_listing ON public.listing_categories (listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_categories_category ON public.listing_categories (category_id);
CREATE INDEX IF NOT EXISTS idx_listing_categories_primary ON public.listing_categories (listing_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_listing_categories_confidence ON public.listing_categories (category_id, confidence DESC);

-- 4. Categorization job queue
CREATE TABLE IF NOT EXISTS public.categorization_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  priority integer DEFAULT 5,
  attempt_count integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  error_message text,
  input_hash text,
  result jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categorization_jobs_status ON public.categorization_jobs (status, priority DESC, created_at);
CREATE INDEX IF NOT EXISTS idx_categorization_jobs_listing ON public.categorization_jobs (listing_id);

-- 5. Listing category analysis snapshot
CREATE TABLE IF NOT EXISTS public.listing_category_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  analyzed_content jsonb,
  generated_tags text[],
  generated_topics text[],
  model_version text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (listing_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_category_analysis_listing ON public.listing_category_analysis (listing_id);

-- 6. Trigger to keep listing_categories.updated_at current
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listing_categories_updated_at ON public.listing_categories;
CREATE TRIGGER trg_listing_categories_updated_at
BEFORE UPDATE ON public.listing_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_categorization_jobs_updated_at ON public.categorization_jobs;
CREATE TRIGGER trg_categorization_jobs_updated_at
BEFORE UPDATE ON public.categorization_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_listing_category_analysis_updated_at ON public.listing_category_analysis;
CREATE TRIGGER trg_listing_category_analysis_updated_at
BEFORE UPDATE ON public.listing_category_analysis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. RPC: get listings by category
CREATE OR REPLACE FUNCTION public.get_listings_by_category(
  p_category_slug text,
  p_status text DEFAULT 'ACTIVE',
  p_limit integer DEFAULT 24,
  p_offset integer DEFAULT 0,
  p_sort text DEFAULT 'downloads'
)
RETURNS TABLE (
  id uuid,
  title text,
  seo_title text,
  short_description text,
  description text,
  type text,
  price numeric,
  downloads bigint,
  views bigint,
  average_rating numeric,
  review_count bigint,
  images text[],
  tags text[],
  featured boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  creator jsonb,
  is_primary boolean,
  confidence numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.seo_title,
    l.short_description,
    l.description,
    l.type::text,
    l.price,
    l.downloads,
    l.views,
    l.average_rating,
    l.review_count,
    l.images,
    l.tags,
    l.featured,
    l.created_at,
    l.updated_at,
    jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url,
      'verified', c.verified
    ) AS creator,
    lc.is_primary,
    lc.confidence
  FROM public.listings l
  JOIN public.listing_categories lc ON lc.listing_id = l.id
  JOIN public.categories cat ON cat.id = lc.category_id
  JOIN public.users u ON u.id = l.creator_id
  LEFT JOIN public.creators c ON c.user_id = l.creator_id
  WHERE cat.slug = p_category_slug
    AND l.status = p_status
  ORDER BY
    CASE WHEN p_sort = 'newest' THEN l.created_at END DESC,
    CASE WHEN p_sort = 'highest_rated' THEN l.average_rating END DESC NULLS LAST,
    CASE WHEN p_sort = 'updated' THEN l.updated_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'featured' THEN l.featured END DESC,
    l.downloads DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. RPC: search listings by category
CREATE OR REPLACE FUNCTION public.search_listings_by_category(
  p_category_slug text,
  p_query text,
  p_status text DEFAULT 'ACTIVE',
  p_limit integer DEFAULT 24
)
RETURNS TABLE (
  id uuid,
  title text,
  seo_title text,
  short_description text,
  type text,
  price numeric,
  downloads bigint,
  average_rating numeric,
  review_count bigint,
  images text[],
  tags text[],
  featured boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  creator jsonb,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.seo_title,
    l.short_description,
    l.type::text,
    l.price,
    l.downloads,
    l.average_rating,
    l.review_count,
    l.images,
    l.tags,
    l.featured,
    l.created_at,
    l.updated_at,
    jsonb_build_object(
      'id', u.id,
      'name', u.name,
      'avatar_url', u.avatar_url,
      'verified', c.verified
    ) AS creator,
    ts_rank(l.search_vector, websearch_to_tsquery('english', p_query))::real AS rank
  FROM public.listings l
  JOIN public.listing_categories lc ON lc.listing_id = l.id
  JOIN public.categories cat ON cat.id = lc.category_id
  JOIN public.users u ON u.id = l.creator_id
  LEFT JOIN public.creators c ON c.user_id = l.creator_id
  WHERE cat.slug = p_category_slug
    AND l.status = p_status
    AND l.search_vector @@ websearch_to_tsquery('english', p_query)
  ORDER BY rank DESC, l.downloads DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. RLS policies
ALTER TABLE public.listing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorization_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_category_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read listing categories"
  ON public.listing_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service can manage listing categories"
  ON public.listing_categories FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read categorization jobs"
  ON public.categorization_jobs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service can manage categorization jobs"
  ON public.categorization_jobs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can read listing category analysis"
  ON public.listing_category_analysis FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service can manage listing category analysis"
  ON public.listing_category_analysis FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 10. RPC: category counts
CREATE OR REPLACE FUNCTION public.get_category_counts()
RETURNS TABLE (
  slug text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cat.slug,
    COUNT(DISTINCT lc.listing_id)::bigint AS count
  FROM public.categories cat
  JOIN public.listing_categories lc ON lc.category_id = cat.id
  JOIN public.listings l ON l.id = lc.listing_id
  WHERE l.status = 'ACTIVE'
  GROUP BY cat.slug;
END;
$$ LANGUAGE plpgsql STABLE;

-- 11. RPC: categorization status
CREATE OR REPLACE FUNCTION public.get_categorization_status()
RETURNS TABLE (
  total bigint,
  pending bigint,
  processing bigint,
  completed bigint,
  failed bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total,
    COUNT(*) FILTER (WHERE status = 'pending')::bigint AS pending,
    COUNT(*) FILTER (WHERE status = 'processing')::bigint AS processing,
    COUNT(*) FILTER (WHERE status = 'completed')::bigint AS completed,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint AS failed
  FROM public.categorization_jobs;
END;
$$ LANGUAGE plpgsql STABLE;

-- 11. RPC: uncategorized listings
CREATE OR REPLACE FUNCTION public.get_uncategorized_listings(
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  type text,
  status text,
  created_at timestamp with time zone,
  category_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.type::text,
    l.status::text,
    l.created_at,
    COUNT(lc.id)::bigint AS category_count
  FROM public.listings l
  LEFT JOIN public.listing_categories lc ON lc.listing_id = l.id
  GROUP BY l.id
  HAVING COUNT(lc.id) = 0
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- 12. RPC: low confidence categorizations
CREATE OR REPLACE FUNCTION public.get_low_confidence_categories(
  p_threshold numeric DEFAULT 50,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  listing_id uuid,
  category_slug text,
  category_name text,
  confidence numeric,
  title text,
  reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lc.listing_id,
    cat.slug AS category_slug,
    cat.name AS category_name,
    lc.confidence,
    l.title,
    lc.reason
  FROM public.listing_categories lc
  JOIN public.categories cat ON cat.id = lc.category_id
  JOIN public.listings l ON l.id = lc.listing_id
  WHERE lc.confidence < p_threshold
  ORDER BY lc.confidence ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 14. Update listing search_vector when categories or tags change
CREATE OR REPLACE FUNCTION public.update_listing_search_vector_from_categories()
RETURNS TRIGGER AS $$
DECLARE
  listing_id uuid;
  category_text text;
  tag_text text;
  listing_record public.listings%ROWTYPE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    listing_id := OLD.listing_id;
  ELSE
    listing_id := NEW.listing_id;
  END IF;

  SELECT * INTO listing_record FROM public.listings WHERE id = listing_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(string_agg(cat.name, ' '), '')
  INTO category_text
  FROM public.listing_categories lc
  JOIN public.categories cat ON cat.id = lc.category_id
  WHERE lc.listing_id = listing_id;

  tag_text := COALESCE(array_to_string(listing_record.tags, ' '), '');

  UPDATE public.listings
  SET search_vector = to_tsvector(
    'english',
    COALESCE(listing_record.title, '') || ' ' ||
    COALESCE(listing_record.seo_title, '') || ' ' ||
    COALESCE(listing_record.short_description, '') || ' ' ||
    COALESCE(listing_record.description, '') || ' ' ||
    tag_text || ' ' ||
    category_text
  )
  WHERE id = listing_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_search_vector_on_categories ON public.listing_categories;
CREATE TRIGGER trg_update_search_vector_on_categories
AFTER INSERT OR UPDATE OR DELETE ON public.listing_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_listing_search_vector_from_categories();

-- 15. Security: revoke PUBLIC EXECUTE on new RPCs
REVOKE ALL ON FUNCTION public.get_listings_by_category(text, text, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_listings_by_category(text, text, integer, integer, text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.search_listings_by_category(text, text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_listings_by_category(text, text, text, integer) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_category_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_category_counts() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_categorization_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_categorization_status() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_uncategorized_listings(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_uncategorized_listings(integer, integer) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.get_low_confidence_categories(numeric, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_low_confidence_categories(numeric, integer) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.update_listing_search_vector_from_categories() FROM PUBLIC;
