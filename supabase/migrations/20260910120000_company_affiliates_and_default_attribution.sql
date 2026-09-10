-- Company invite + advisor affiliate attribution bridge.
-- Company invite links remain the primary entry path; optional ?ref= advisor codes ride on top.

-- 1) Company/advisor relationship: zero, one, or many affiliates per company.
CREATE TABLE IF NOT EXISTS public.company_affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  affiliate_id uuid NOT NULL REFERENCES public.advisor_affiliates(id) ON DELETE CASCADE,
  is_default boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, affiliate_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS company_affiliates_one_default_per_company_idx
  ON public.company_affiliates (company_id)
  WHERE is_default = true AND active = true;

CREATE INDEX IF NOT EXISTS company_affiliates_company_idx
  ON public.company_affiliates (company_id);

CREATE INDEX IF NOT EXISTS company_affiliates_affiliate_idx
  ON public.company_affiliates (affiliate_id);

ALTER TABLE public.company_affiliates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage company affiliates" ON public.company_affiliates;
CREATE POLICY "Admins can manage company affiliates"
  ON public.company_affiliates
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Company admins can view company affiliates" ON public.company_affiliates;
CREATE POLICY "Company admins can view company affiliates"
  ON public.company_affiliates
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR company_id IN (
      SELECT cm.company_id
      FROM public.company_members cm
      WHERE cm.user_id = auth.uid()
        AND cm.role IN ('owner', 'admin')
    )
  );

DROP TRIGGER IF EXISTS update_company_affiliates_updated_at ON public.company_affiliates;
CREATE TRIGGER update_company_affiliates_updated_at
  BEFORE UPDATE ON public.company_affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Attribution rows should know whether they came from an explicit advisor code,
-- a company default affiliate, or a legacy/referral route with no company.
ALTER TABLE public.affiliate_attributions
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attribution_type text NOT NULL DEFAULT 'explicit_ref';

ALTER TABLE public.affiliate_attributions
  DROP CONSTRAINT IF EXISTS affiliate_attributions_attribution_type_check;
ALTER TABLE public.affiliate_attributions
  ADD CONSTRAINT affiliate_attributions_attribution_type_check
  CHECK (attribution_type IN ('explicit_ref', 'company_default', 'legacy_ref'));

CREATE INDEX IF NOT EXISTS affiliate_attributions_company_id_idx
  ON public.affiliate_attributions (company_id);

-- 3) Secure server-side join + attribution. First touch wins: if the user already
-- has an attribution row, joining a company will not overwrite it.
CREATE OR REPLACE FUNCTION public.join_company_by_token_with_affiliate(
  _token uuid,
  _ref text DEFAULT NULL,
  _landing_path text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_company_id uuid;
  v_explicit_code text := NULLIF(lower(trim(_ref)), '');
  v_explicit_affiliate_id uuid;
  v_default_code text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id INTO v_company_id
  FROM public.companies
  WHERE invite_token = _token
  LIMIT 1;

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_company_id, v_user_id, 'member')
  ON CONFLICT (company_id, user_id) DO NOTHING;

  UPDATE public.profiles
  SET company_id = v_company_id,
      company_role = COALESCE(company_role, 'member')
  WHERE id = v_user_id;

  -- Explicit advisor code on /join?token=...&ref=... wins if it is active.
  IF v_explicit_code IS NOT NULL THEN
    SELECT af.id INTO v_explicit_affiliate_id
    FROM public.advisor_affiliates af
    WHERE lower(af.referral_code) = v_explicit_code
      AND af.status = 'active'
    LIMIT 1;

    IF v_explicit_affiliate_id IS NOT NULL THEN
      INSERT INTO public.affiliate_attributions (user_id, affiliate_id, landing_path, company_id, attribution_type)
      VALUES (v_user_id, v_explicit_code, COALESCE(_landing_path, '/join'), v_company_id, 'explicit_ref')
      ON CONFLICT (user_id) DO NOTHING;
      RETURN v_company_id;
    END IF;
  END IF;

  -- No valid explicit ref: use the company's active default affiliate if configured.
  SELECT lower(af.referral_code) INTO v_default_code
  FROM public.company_affiliates ca
  JOIN public.advisor_affiliates af ON af.id = ca.affiliate_id
  WHERE ca.company_id = v_company_id
    AND ca.active = true
    AND ca.is_default = true
    AND af.status = 'active'
  LIMIT 1;

  IF v_default_code IS NOT NULL THEN
    INSERT INTO public.affiliate_attributions (user_id, affiliate_id, landing_path, company_id, attribution_type)
    VALUES (v_user_id, v_default_code, COALESCE(_landing_path, '/join'), v_company_id, 'company_default')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN v_company_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_company_by_token_with_affiliate(uuid, text, text) TO authenticated;

-- 4) Report both dimensions for admin reconciliation and GHL sync visibility.
DROP FUNCTION IF EXISTS public.admin_affiliate_report();

CREATE FUNCTION public.admin_affiliate_report()
RETURNS TABLE (
  attribution_user_id uuid,
  affiliate_id text,
  affiliate_name text,
  affiliate_email text,
  affiliate_company text,
  commission_rate numeric,
  landing_path text,
  captured_at timestamptz,
  attribution_type text,
  joined_company_id uuid,
  joined_company_name text,
  referred_user_name text,
  referred_user_company text,
  referred_user_phone text,
  subscription_tier text,
  subscription_status text,
  subscription_source text,
  ghl_product_id text,
  ghl_subscription_id text,
  upgraded_at timestamptz,
  estimated_monthly_commission numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    aa.user_id AS attribution_user_id,
    aa.affiliate_id,
    af.name AS affiliate_name,
    af.email AS affiliate_email,
    af.company AS affiliate_company,
    COALESCE(af.commission_rate, 20.00) AS commission_rate,
    aa.landing_path,
    aa.captured_at,
    COALESCE(aa.attribution_type, 'legacy_ref') AS attribution_type,
    COALESCE(aa.company_id, p.company_id) AS joined_company_id,
    c.name AS joined_company_name,
    p.full_name AS referred_user_name,
    p.company AS referred_user_company,
    p.phone AS referred_user_phone,
    COALESCE(us.tier_override::text, us.tier::text, 'free') AS subscription_tier,
    COALESCE(us.status, 'not_upgraded') AS subscription_status,
    us.source AS subscription_source,
    us.ghl_product_id,
    us.ghl_subscription_id,
    us.started_at AS upgraded_at,
    CASE
      WHEN COALESCE(us.tier_override::text, us.tier::text, 'free') IN ('partner', 'pro')
       AND COALESCE(us.status, 'active') IN ('active', 'trialing', 'paid')
      THEN ROUND((97.00 * COALESCE(af.commission_rate, 20.00) / 100.00)::numeric, 2)
      ELSE 0::numeric
    END AS estimated_monthly_commission
  FROM public.affiliate_attributions aa
  LEFT JOIN public.advisor_affiliates af ON lower(af.referral_code) = lower(aa.affiliate_id)
  LEFT JOIN public.profiles p ON p.id = aa.user_id
  LEFT JOIN public.companies c ON c.id = COALESCE(aa.company_id, p.company_id)
  LEFT JOIN public.user_subscriptions us ON us.user_id = aa.user_id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY aa.captured_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_affiliate_report() TO authenticated;
