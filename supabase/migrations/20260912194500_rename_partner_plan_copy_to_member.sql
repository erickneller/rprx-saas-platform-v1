-- Rename customer-facing paid membership copy from "Partner" to "Member"
-- while preserving the internal tier key (`partner`) and legitimate partner/advisor concepts.

UPDATE public.landing_card_config
SET content = jsonb_set(
  content,
  '{plans}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN plan->>'key' = 'partner' THEN
          plan || jsonb_build_object(
            'name', 'Member',
            'cta', 'Become a Member'
          )
        WHEN plan->>'key' = 'pro' THEN
          jsonb_set(
            plan,
            '{features}',
            (
              SELECT jsonb_agg(
                CASE WHEN feature = 'Everything in Partner' THEN 'Everything in Member' ELSE feature END
                ORDER BY feature_ord
              )
              FROM jsonb_array_elements_text(plan->'features') WITH ORDINALITY AS features(feature, feature_ord)
            )
          )
        ELSE plan
      END
      ORDER BY plan_ord
    )
    FROM jsonb_array_elements(content->'plans') WITH ORDINALITY AS plans(plan, plan_ord)
  ),
  true
)
WHERE id = 'pricing'
  AND content ? 'plans';
