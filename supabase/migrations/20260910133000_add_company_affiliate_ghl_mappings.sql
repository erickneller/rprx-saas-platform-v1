-- Default GHL custom-field mappings for company membership and advisor affiliate attribution.
-- Uses NOT EXISTS because ghl_field_mappings intentionally has no natural unique key.

INSERT INTO public.ghl_field_mappings (profile_field, ghl_target_type, ghl_field_key, transform, sort_order, notes)
SELECT v.profile_field, v.ghl_target_type, v.ghl_field_key, v.transform, v.sort_order, v.notes
FROM (VALUES
  ('rprx_company_id','custom_field','rprx_company_id','none',620,'Company ID from active company membership'),
  ('rprx_company_name','custom_field','rprx_company_name','none',630,'Company name from active company membership'),
  ('rprx_company_slug','custom_field','rprx_company_slug','none',640,'Company slug from active company membership'),
  ('rprx_company_plan','custom_field','rprx_company_plan','none',650,'Company plan'),
  ('rprx_company_role','custom_field','rprx_company_role','none',660,'Role in joined company'),
  ('rprx_company_ghl_location_id','custom_field','rprx_company_ghl_location_id','none',670,'Company-specific GHL location ID, when configured'),
  ('affiliate_code','custom_field','affiliate_code','none',680,'Advisor affiliate code/id attributed to user'),
  ('affiliate_name','custom_field','affiliate_name','none',690,'Advisor affiliate display name'),
  ('affiliate_email','custom_field','affiliate_email','none',700,'Advisor affiliate email'),
  ('affiliate_company','custom_field','affiliate_company','none',710,'Advisor affiliate company'),
  ('affiliate_commission_rate','custom_field','affiliate_commission_rate','number',720,'Advisor affiliate commission rate'),
  ('affiliate_attribution_type','custom_field','affiliate_attribution_type','none',730,'Attribution type: explicit_ref, company_default, legacy_ref, etc.'),
  ('affiliate_landing_path','custom_field','affiliate_landing_path','none',740,'Landing path/query captured for attribution'),
  ('affiliate_captured_at','custom_field','affiliate_captured_at','none',750,'Attribution captured timestamp')
) AS v(profile_field, ghl_target_type, ghl_field_key, transform, sort_order, notes)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.ghl_field_mappings m
  WHERE m.profile_field = v.profile_field
    AND m.ghl_target_type = v.ghl_target_type
    AND m.ghl_field_key = v.ghl_field_key
);
