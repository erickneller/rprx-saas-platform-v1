// GHL checkout webhook → upserts user_subscriptions (or pending_ghl_subscriptions)
// and emails a "claim your account" link for buyers without an account yet.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

// Hardcoded fallback used when ghl_product_tier_map has no row for a product.
// Admins can override per product in the admin panel.
const FALLBACK_PRODUCT_MAP: Record<string, { tier: "partner" | "pro"; billing_interval: "month" | "year" }> = {};

type Event =
  | "subscription.active"
  | "subscription.renewed"
  | "subscription.canceled"
  | "subscription.refunded"
  | "subscription.failed";

function pick<T = unknown>(obj: any, ...keys: string[]): T | undefined {
  for (const k of keys) {
    const segs = k.split(".");
    let cur = obj;
    for (const s of segs) cur = cur?.[s];
    if (cur !== undefined && cur !== null && cur !== "") return cur as T;
  }
  return undefined;
}

function normalizeEventType(raw: unknown): Event {
  const s = String(raw ?? "").toLowerCase().trim();
  if (s.includes("refund")) return "subscription.refunded";
  if (s.includes("cancel")) return "subscription.canceled";
  if (s.includes("fail")) return "subscription.failed";
  if (s.includes("renew")) return "subscription.renewed";
  return "subscription.active";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const sharedSecret = Deno.env.get("GHL_CHECKOUT_WEBHOOK_SECRET");
  if (!sharedSecret) {
    console.error("GHL_CHECKOUT_WEBHOOK_SECRET not configured");
    return new Response("Not configured", { status: 500, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const headerSecret = req.headers.get("x-webhook-secret");
  const querySecret = url.searchParams.get("secret");
  if (headerSecret !== sharedSecret && querySecret !== sharedSecret) {
    return new Response("Invalid webhook secret", { status: 403, headers: corsHeaders });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }

  const eventType = normalizeEventType(pick(payload, "event_type", "event", "type"));
  const email = String(
    pick(payload, "email", "contact.email", "customer.email") ?? "",
  ).toLowerCase().trim();
  const ghl_contact_id = pick<string>(payload, "contact_id", "contactId", "contact.id");
  const ghl_subscription_id = pick<string>(
    payload, "subscription_id", "subscriptionId", "subscription.id",
  );
  const ghl_product_id = pick<string>(
    payload, "product_id", "productId", "product.id", "priceId", "price_id",
  );
  const current_period_end_raw = pick<string | number>(
    payload, "current_period_end", "currentPeriodEnd", "next_billing_date", "subscription.next_payment_date",
  );
  const affiliate_id = pick<string>(
    payload, "affiliate_id", "affiliateId", "ref", "affiliate.id", "affiliate.code",
  ) ?? null;
  const passed_user_id = pick<string>(
    payload, "user_id", "userId", "metadata.user_id", "custom_fields.user_id",
  ) ?? null;

  if (!email && !passed_user_id) {
    return new Response(JSON.stringify({ ok: false, error: "missing_email_or_user_id" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let current_period_end: string | null = null;
  if (current_period_end_raw) {
    const d = typeof current_period_end_raw === "number"
      ? new Date(current_period_end_raw * (current_period_end_raw < 1e12 ? 1000 : 1))
      : new Date(current_period_end_raw);
    if (!isNaN(d.getTime())) current_period_end = d.toISOString();
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Resolve tier from product map (DB first, fallback constant)
  let tier: "free" | "partner" | "pro" = "free";
  let billing_interval: string | null = null;

  if (eventType === "subscription.active" || eventType === "subscription.renewed") {
    if (!ghl_product_id) {
      return new Response(JSON.stringify({ ok: false, error: "missing_product_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: mapRow } = await admin
      .from("ghl_product_tier_map")
      .select("tier, billing_interval, is_active")
      .eq("ghl_product_id", ghl_product_id)
      .maybeSingle();

    if (mapRow && (mapRow as any).is_active) {
      tier = (mapRow as any).tier;
      billing_interval = (mapRow as any).billing_interval ?? null;
    } else if (FALLBACK_PRODUCT_MAP[ghl_product_id]) {
      tier = FALLBACK_PRODUCT_MAP[ghl_product_id].tier;
      billing_interval = FALLBACK_PRODUCT_MAP[ghl_product_id].billing_interval;
    } else {
      console.warn(`No tier mapping for GHL product ${ghl_product_id}`);
      return new Response(JSON.stringify({ ok: false, error: "unmapped_product", ghl_product_id }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Resolve auth user — try passed user_id first (most reliable), then email lookup
  let userId: string | null = null;
  let resolvedEmail: string = email;

  if (passed_user_id) {
    const { data: u } = await admin.auth.admin.getUserById(passed_user_id);
    if (u?.user) {
      userId = u.user.id;
      resolvedEmail = (u.user.email ?? email).toLowerCase();
    }
  }
  if (!userId && email) {
    let page = 1;
    while (page <= 10) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const found = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (found) { userId = found.id; break; }
      if (data.users.length < 200) break;
      page++;
    }
  }

  const isCancelLike =
    eventType === "subscription.canceled" ||
    eventType === "subscription.refunded" ||
    eventType === "subscription.failed";

  if (userId) {
    if (isCancelLike) {
      const { error } = await admin
        .from("user_subscriptions")
        .upsert({
          user_id: userId,
          email: resolvedEmail,
          tier: "free",
          status: "canceled",
          source: "ghl",
          ghl_contact_id: ghl_contact_id ?? null,
          ghl_subscription_id: ghl_subscription_id ?? null,
          ghl_product_id: ghl_product_id ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (error) console.error("downgrade upsert failed", error);
    } else {
      const { error } = await admin
        .from("user_subscriptions")
        .upsert({
          user_id: userId,
          email: resolvedEmail,
          tier,
          status: "active",
          source: "ghl",
          billing_interval,
          ghl_contact_id: ghl_contact_id ?? null,
          ghl_subscription_id: ghl_subscription_id ?? null,
          ghl_product_id: ghl_product_id ?? null,
          affiliate_id,
          current_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      if (error) console.error("active upsert failed", error);

      // Mirror affiliate attribution (first-touch wins)
      if (affiliate_id) {
        await admin.from("affiliate_attributions")
          .insert({ user_id: userId, affiliate_id, landing_path: 'ghl-checkout' })
          .then(() => {}, () => {}); // ignore conflict
      }
    }

    return new Response(JSON.stringify({ ok: true, matched_user: userId, tier, event: eventType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // No user yet — manage pending_ghl_subscriptions
  if (isCancelLike) {
    await admin.from("pending_ghl_subscriptions").delete().eq("email", email);
    return new Response(JSON.stringify({ ok: true, pending_removed: true, event: eventType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Upsert pending and send claim email (only on first activation)
  const { data: existing } = await admin
    .from("pending_ghl_subscriptions")
    .select("email, claim_token, claimed_at")
    .eq("email", email)
    .maybeSingle();

  const { error: upErr } = await admin
    .from("pending_ghl_subscriptions")
    .upsert({
      email,
      tier,
      billing_interval,
      ghl_contact_id: ghl_contact_id ?? null,
      ghl_subscription_id: ghl_subscription_id ?? null,
      ghl_product_id: ghl_product_id ?? null,
      current_period_end,
      // keep existing claim_token if present
      ...(existing?.claim_token ? { claim_token: existing.claim_token } : {}),
      claimed_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "email" });

  if (upErr) {
    console.error("pending upsert failed", upErr);
    return new Response(JSON.stringify({ ok: false, error: "pending_upsert_failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Send claim email only when the row is brand-new or unclaimed and on first activation event.
  const isFirstActivation = !existing || existing.claimed_at == null;
  if (isFirstActivation && eventType === "subscription.active") {
    try {
      const siteUrl =
        Deno.env.get("APP_PUBLIC_URL") ?? "https://app.rprx4life.com";
      const redirectTo = `${siteUrl}/auth/callback?claim=1`;

      // Generate a magic-link / invite via Supabase Admin API.
      // signup link will create the user if they don't exist; magiclink fails if not present.
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: "signup",
        email,
        password: crypto.randomUUID(),
        options: { redirectTo },
      });
      if (linkErr) throw linkErr;
      const actionLink = (linkData as any)?.properties?.action_link;

      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey && actionLink) {
        const tierLabel = tier === "pro" ? "Pro" : "Member";
        const html = `
          <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;color:#0f172a">
            <h1 style="margin:0 0 12px 0;font-size:22px;">Welcome to RPRx ${tierLabel} 🎉</h1>
            <p style="line-height:1.6">Thanks for your purchase. Click the button below to activate your account — your ${tierLabel} access is waiting for you inside.</p>
            <p style="text-align:center;margin:32px 0">
              <a href="${actionLink}" style="background:#0ea5e9;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block">Activate my account</a>
            </p>
            <p style="font-size:13px;color:#475569;line-height:1.5">If the button doesn't work, copy and paste this link into your browser:<br/>${actionLink}</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
            <p style="font-size:12px;color:#64748b">If you didn't make this purchase, please contact support@rprx4life.com.</p>
          </div>
        `;
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "RPRx <noreply@notify.rprx4life.com>",
            to: [email],
            subject: `Activate your RPRx ${tierLabel} account`,
            html,
          }),
        });
        if (!r.ok) {
          console.error("Resend send failed", r.status, await r.text());
        }
      } else {
        console.warn("RESEND_API_KEY missing or action link unavailable; skipping claim email");
      }
    } catch (e) {
      console.error("claim email error", e);
    }
  }

  return new Response(JSON.stringify({ ok: true, pending: true, tier, event: eventType }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
