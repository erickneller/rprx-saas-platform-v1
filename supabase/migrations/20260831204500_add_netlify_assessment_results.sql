CREATE TABLE IF NOT EXISTS public.rprx_netlify_assessment_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  assessment_type text NOT NULL CHECK (assessment_type IN ('financial', 'physical')),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  matches jsonb NOT NULL DEFAULT '[]'::jsonb,
  free_matches jsonb NOT NULL DEFAULT '[]'::jsonb,
  locked_matches jsonb NOT NULL DEFAULT '[]'::jsonb,
  top_match_id text,
  top_match_name text,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rprx_netlify_assessment_results_user_created
  ON public.rprx_netlify_assessment_results(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rprx_netlify_assessment_results_type
  ON public.rprx_netlify_assessment_results(assessment_type);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rprx_netlify_assessment_results TO authenticated;
GRANT ALL ON public.rprx_netlify_assessment_results TO service_role;

ALTER TABLE public.rprx_netlify_assessment_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own netlify assessment results" ON public.rprx_netlify_assessment_results;
CREATE POLICY "Users view own netlify assessment results"
  ON public.rprx_netlify_assessment_results FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own netlify assessment results" ON public.rprx_netlify_assessment_results;
CREATE POLICY "Users insert own netlify assessment results"
  ON public.rprx_netlify_assessment_results FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own netlify assessment results" ON public.rprx_netlify_assessment_results;
CREATE POLICY "Users update own netlify assessment results"
  ON public.rprx_netlify_assessment_results FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own netlify assessment results" ON public.rprx_netlify_assessment_results;
CREATE POLICY "Users delete own netlify assessment results"
  ON public.rprx_netlify_assessment_results FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_rprx_netlify_assessment_results_updated_at ON public.rprx_netlify_assessment_results;
CREATE TRIGGER update_rprx_netlify_assessment_results_updated_at
  BEFORE UPDATE ON public.rprx_netlify_assessment_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
