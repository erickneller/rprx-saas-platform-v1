-- Default GHL field/tag mappings for the imported RPRx Netlify-style assessment engine.
-- Uses NOT EXISTS because ghl_field_mappings intentionally has no natural unique key.

INSERT INTO public.ghl_field_mappings (profile_field, ghl_target_type, ghl_field_key, transform, sort_order, notes)
SELECT v.profile_field, v.ghl_target_type, v.ghl_field_key, v.transform, v.sort_order, v.notes
FROM (VALUES
  ('latest_netlify_assessment_type','custom_field','rprx_latest_assessment_type','none',520,'Latest imported RPRx assessment type: financial or physical'),
  ('latest_netlify_top_match','custom_field','rprx_latest_top_match','none',530,'Top matched imported RPRx result area'),
  ('latest_netlify_match_count','custom_field','rprx_latest_match_count','number',540,'Total imported RPRx result matches'),
  ('latest_netlify_free_match_count','custom_field','rprx_latest_free_match_count','number',550,'Unlocked/free imported RPRx result count'),
  ('latest_netlify_locked_match_count','custom_field','rprx_latest_locked_match_count','number',560,'Locked/member-path imported RPRx result count'),
  ('latest_netlify_free_matches','custom_field','rprx_latest_free_matches','none',570,'Unlocked/free imported RPRx match titles'),
  ('latest_netlify_locked_matches','custom_field','rprx_latest_locked_matches','none',580,'Locked/member-path imported RPRx match titles'),
  ('latest_netlify_completed_at','custom_field','rprx_latest_assessment_completed_at','none',590,'Latest imported RPRx assessment completion timestamp'),
  ('latest_netlify_assessment_type','tag','rprx-assessment:{value}','lowercase',600,'Tag contacts by imported RPRx assessment type'),
  ('latest_netlify_top_match','tag','rprx-top-match:{value}','lowercase',610,'Tag contacts by imported RPRx top match')
) AS v(profile_field, ghl_target_type, ghl_field_key, transform, sort_order, notes)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.ghl_field_mappings m
  WHERE m.profile_field = v.profile_field
    AND m.ghl_target_type = v.ghl_target_type
    AND m.ghl_field_key = v.ghl_field_key
);

INSERT INTO public.feature_flags (id, enabled, value, updated_at)
VALUES ('rprx_netlify_assessment_default', true, 'default_on_with_legacy_query_param_rollback', now())
ON CONFLICT (id) DO UPDATE
SET enabled = EXCLUDED.enabled,
    value = EXCLUDED.value,
    updated_at = now();
