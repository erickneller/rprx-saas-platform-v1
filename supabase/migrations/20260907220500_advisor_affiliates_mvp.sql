-- Advisor Affiliate MVP for Option A: RPRx attribution + GHL product/order-form checkout.
-- RPRx captures ?ref=, keeps first-touch attribution, and gives admins an advisor report.

CREATE TABLE IF NOT EXISTS public.advisor_affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  company text,
  referral_code text NOT NULL UNIQUE,
  commission_rate numeric(5,2) NOT NULL DEFAULT 20.00,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.advisor_affiliates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage advisor affiliates" ON public.advisor_affiliates;
CREATE POLICY "Admins can manage advisor affiliates"
  ON public.advisor_affiliates
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS update_advisor_affiliates_updated_at ON public.advisor_affiliates;
CREATE TRIGGER update_advisor_affiliates_updated_at
  BEFORE UPDATE ON public.advisor_affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- The original affiliate_attributions table let users read their own row only.
-- Admins need read access for reporting and manual commission review.
DROP POLICY IF EXISTS "Admins can view affiliate attributions" ON public.affiliate_attributions;
CREATE POLICY "Admins can view affiliate attributions"
  ON public.affiliate_attributions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Optional but useful for manual correction/support when a lead signs up before the ref code is captured.
DROP POLICY IF EXISTS "Admins can manage affiliate attributions" ON public.affiliate_attributions;
CREATE POLICY "Admins can manage affiliate attributions"
  ON public.affiliate_attributions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS affiliate_attributions_affiliate_id_idx
  ON public.affiliate_attributions (affiliate_id);

CREATE INDEX IF NOT EXISTS user_subscriptions_affiliate_id_idx
  ON public.user_subscriptions (affiliate_id);

CREATE OR REPLACE FUNCTION public.admin_affiliate_report()
RETURNS TABLE (
  attribution_user_id uuid,
  affiliate_id text,
  affiliate_name text,
  affiliate_email text,
  affiliate_company text,
  commission_rate numeric,
  landing_path text,
  captured_at timestamptz,
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
  LEFT JOIN public.user_subscriptions us ON us.user_id = aa.user_id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY aa.captured_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_affiliate_report() TO authenticated;
