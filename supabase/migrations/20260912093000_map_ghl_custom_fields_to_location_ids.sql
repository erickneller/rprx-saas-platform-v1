-- Map active RPRx GHL custom-field rows to the target location generated field IDs.
-- Generated after confirming the GHL inventory for location blzjJxWDaBpdex6lD5G3.
-- Old latest_netlify_* mappings are intentionally not changed here; they are legacy/unused.

UPDATE public.ghl_field_mappings AS m
SET ghl_field_key = v.ghl_field_id
FROM (VALUES
  ('profile_type', 'ZTu7tNs00rfrKaB1caDe'),
  ('filing_status', 'l1m4EjoHfv2iQnCyRTSW'),
  ('financial_goals', 'w1pUPmcoUwwFcgwD8xmQ'),
  ('monthly_income', 'MWq9TOtHkflYnt9AHjRD'),
  ('monthly_debt_payments', 'veo05wenbGg8ZtahwA7q'),
  ('emergency_fund_balance', 'cnFlmKj7U0YcjidepQxa'),
  ('rprx_score_total', '9OGNTI2nUXbtWq8LfREZ'),
  ('rprx_grade', 'MQEfuOr0UhplxH2aIO3o'),
  ('rprx_score_river', 'WTDfuVnTXdFsbXpOmLfS'),
  ('rprx_score_lake', 'sNYCG7645SzmRc8484ad'),
  ('rprx_score_rainbow', '7Y7HwTIr0fnKNz2ILoxI'),
  ('rprx_score_tax', 'BYMLjIGuyIP5Rnw7NFrT'),
  ('rprx_score_stress', 'FBRdMWGt5weC5CsWwk8C'),
  ('current_tier', 'lfKiyocE36DTE6Ur5yBv'),
  ('current_streak', 'ud2Q5OUolsRS5M9hAsxn'),
  ('total_points_earned', 'J0YQqX9ZlXCiYgN6wBYp'),
  ('onboarding_completed', 'bHsuTcVoyL8gdS3Aj8HH'),
  ('estimated_annual_leak_low', 'K29y6p3Yoi0OpnQg43HS'),
  ('estimated_annual_leak_high', 'T4xwtJFMbPIw2CoNcBnb'),
  ('rprx_company_id', 'agXvIXxQG0udavSLj9al'),
  ('rprx_company_name', 'ZpYDJZuSVRBAehyBGtjD'),
  ('rprx_company_slug', 'UbQsB67U2R6AGlefS9gP'),
  ('rprx_company_plan', 'aZMESlLfeWV7yYW0OP7f'),
  ('rprx_company_role', 'STuiUsKQu4fwUMMEYD5O'),
  ('rprx_company_ghl_location_id', 'lyGTNkjWUNdt9SBWwfgN'),
  ('affiliate_code', 'UKr8dk3OedAZINMuusMk'),
  ('affiliate_name', 'ADN7NzfUXwpbzRhORM42'),
  ('affiliate_email', 'KCkKKcgvXPflcvJhyKXm'),
  ('affiliate_company', '6Axrznmw3bXuXBCWeqtE'),
  ('affiliate_commission_rate', 'MJ7OFoE8XLJE0sJTdaMv'),
  ('affiliate_attribution_type', 'veq5yZ5jOswBR71hCjSk'),
  ('affiliate_landing_path', 'DlRviAel500yjzcKKqNq'),
  ('affiliate_captured_at', 'J13IoHt96CXRUoBeXuS0')
) AS v(profile_field, ghl_field_id)
WHERE m.profile_field = v.profile_field
  AND m.ghl_target_type = 'custom_field'
  AND m.is_active = true
  AND m.ghl_field_key IS DISTINCT FROM v.ghl_field_id;
