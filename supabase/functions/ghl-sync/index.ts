import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GHL_API_BASE = "https://services.leadconnectorhq.com";

const STANDARD_KEYS = new Set([
  "firstName", "lastName", "name", "email", "phone",
  "companyName", "address1", "city", "state", "postalCode", "country",
  "website", "dateOfBirth",
]);

function applyTransform(value: unknown, transform: string): unknown {
  if (value === null || value === undefined) return undefined;
  switch (transform) {
    case "split_first_name": {
      const s = String(value).trim();
      return s ? s.split(/\s+/)[0] : undefined;
    }
    case "split_last_name": {
      const s = String(value).trim();
      const parts = s ? s.split(/\s+/) : [];
      return parts.length > 1 ? parts.slice(1).join(" ") : undefined;
    }
    case "join_comma":
      return Array.isArray(value) ? value.join(", ") : String(value);
    case "boolean_yesno":
      return value ? "Yes" : "No";
    case "number": {
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    }
    case "lowercase":
      return String(value).toLowerCase();
    case "none":
    default:
      return value;
  }
}

function compactTitles(items: unknown, max = 8): string {
  if (!Array.isArray(items)) return "";
  return items
    .map((item: any) => String(item?.title ?? item?.name ?? item?.topic ?? "").trim())
    .filter(Boolean)
    .slice(0, max)
    .join(" | ");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    if (body?.source === "ghl-webhook") {
      return new Response(JSON.stringify({ skipped: true, reason: "webhook origin" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const dryRun: boolean = !!body?.dryRun;
    const assessmentResultId = typeof body?.assessmentResultId === "string" ? body.assessmentResultId : null;

    const GHL_API_KEY = Deno.env.get("GHL_API_KEY");
    const GHL_LOCATION_ID = Deno.env.get("GHL_LOCATION_ID");

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load profile
    const { data: profile } = await service
      .from("profiles").select("*").eq("id", user.id).maybeSingle();

    // Load latest assessment for derived fields
    const { data: latestAssessment } = await (service
      .from("assessment_submissions") as any)
      .select("primary_horseman, secondary_horseman, readiness_label, recommended_track")
      .eq("email", (user.email ?? "").toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let netlifyQuery = (service
      .from("rprx_netlify_assessment_results") as any)
      .select("id, assessment_type, matches, free_matches, locked_matches, top_match_name, completed_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (assessmentResultId) {
      netlifyQuery = (service
        .from("rprx_netlify_assessment_results") as any)
        .select("id, assessment_type, matches, free_matches, locked_matches, top_match_name, completed_at")
        .eq("user_id", user.id)
        .eq("id", assessmentResultId)
        .limit(1);
    }

    const { data: latestNetlifyAssessment } = await netlifyQuery.maybeSingle();

    // Load mappings
    const { data: mappings } = await service
      .from("ghl_field_mappings").select("*").eq("is_active", true).order("sort_order");

    // Source value resolver
    const sourceValues: Record<string, unknown> = {
      ...(profile ?? {}),
      email: user.email,
      primary_horseman: latestAssessment?.primary_horseman ?? null,
      secondary_horseman: latestAssessment?.secondary_horseman ?? null,
      readiness_label: latestAssessment?.readiness_label ?? null,
      recommended_track: latestAssessment?.recommended_track ?? null,
      latest_netlify_assessment_id: latestNetlifyAssessment?.id ?? null,
      latest_netlify_assessment_type: latestNetlifyAssessment?.assessment_type ?? null,
      latest_netlify_top_match: latestNetlifyAssessment?.top_match_name ?? null,
      latest_netlify_match_count: Array.isArray(latestNetlifyAssessment?.matches) ? latestNetlifyAssessment.matches.length : null,
      latest_netlify_free_match_count: Array.isArray(latestNetlifyAssessment?.free_matches) ? latestNetlifyAssessment.free_matches.length : null,
      latest_netlify_locked_match_count: Array.isArray(latestNetlifyAssessment?.locked_matches) ? latestNetlifyAssessment.locked_matches.length : null,
      latest_netlify_free_matches: compactTitles(latestNetlifyAssessment?.free_matches, 5),
      latest_netlify_locked_matches: compactTitles(latestNetlifyAssessment?.locked_matches, 10),
      latest_netlify_completed_at: latestNetlifyAssessment?.completed_at ?? null,
    };

    const standardFields: Record<string, unknown> = {};
    const customFields: Array<{ key: string; field_value: unknown }> = [];
    const tags: string[] = [];

    for (const m of (mappings ?? []) as any[]) {
      const raw = sourceValues[m.profile_field];
      const transformed = applyTransform(raw, m.transform || "none");
      if (transformed === undefined || transformed === null || transformed === "") continue;

      if (m.ghl_target_type === "standard") {
        const key = STANDARD_KEYS.has(m.ghl_field_key) ? m.ghl_field_key : m.ghl_field_key;
        standardFields[key] = transformed;
      } else if (m.ghl_target_type === "custom_field") {
        customFields.push({ key: m.ghl_field_key, field_value: transformed });
      } else if (m.ghl_target_type === "tag") {
        const tpl = m.ghl_field_key || "{value}";
        tags.push(tpl.replace("{value}", String(transformed)));
      }
    }

    const ghlPayload: Record<string, unknown> = {
      locationId: GHL_LOCATION_ID,
      ...standardFields,
    };
    if (!ghlPayload.email && user.email) ghlPayload.email = user.email;
    if (customFields.length) ghlPayload.customFields = customFields;
    if (tags.length) ghlPayload.tags = tags;

    if (dryRun) {
      return new Response(JSON.stringify({ success: true, dryRun: true, payload: ghlPayload }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      return new Response(JSON.stringify({ error: "GHL integration not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ghlResponse = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify(ghlPayload),
    });

    if (!ghlResponse.ok) {
      const errBody = await ghlResponse.text();
      console.error(`GHL upsert failed [${ghlResponse.status}]: ${errBody}`);
      return new Response(
        JSON.stringify({ error: "GHL sync failed", status: ghlResponse.status, detail: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ghlData = await ghlResponse.json();
    const contactId = ghlData?.contact?.id;
    if (contactId) {
      await service.from("profiles").update({ ghl_contact_id: contactId }).eq("id", user.id);
    }

    return new Response(
      JSON.stringify({ success: true, contactId, payload: ghlPayload }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ghl-sync error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
