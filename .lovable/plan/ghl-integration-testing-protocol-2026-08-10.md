# GHL Integration Testing Protocol

Goal: safely verify that the app ↔ GoHighLevel sync works end-to-end without polluting the production GHL account or RPRx user base.

## Prerequisites

1. **Secrets configured** in Supabase Edge Function settings:
   - `GHL_API_KEY` — a GHL location API key with contact write permission.
   - `GHL_LOCATION_ID` — the target GHL location/sub-account ID.
   - `GHL_WEBHOOK_SECRET` — shared secret for inbound GHL webhooks.
   - `GHL_CHECKOUT_WEBHOOK_SECRET` — shared secret for checkout/subscription webhooks.
   - `RESEND_API_KEY` and `APP_PUBLIC_URL` — only needed if testing claim emails.
2. **Field mappings exist** in Admin Panel → GHL Field Mapping. At minimum map:
   - `full_name` → standard `name`
   - `email` → standard `email`
   - `phone` → standard `phone`
   - `primary_horseman` → custom field or tag of your choice
3. **Test contact cleanup plan**: use a disposable email (e.g., `test+<date>@yourdomain.com`) and delete the GHL contact after each test run.

## Phase 1 — App → GHL sync (dry run)

1. Sign in to the app as an admin/test user.
2. Go to **Admin Panel → GHL Field Mapping**.
3. Click **Test sync (dry run, my user)**.
4. Verify the JSON preview shows:
   - `locationId` matches `GHL_LOCATION_ID`.
   - `email`, `name`/`firstName`/`lastName`, `phone` are populated correctly.
   - Custom fields and tags render with the expected keys and transformed values.
5. If the payload looks wrong, fix mappings before doing a live sync.

## Phase 2 — App → GHL live sync on signup

1. Use an incognito window and a fresh test email.
2. Sign up through the normal flow (or a company join link if testing company-tier assignment).
3. Complete profile fields that are mapped to GHL (full name, phone, etc.).
4. Check the **Edge Function logs** for `ghl-sync`:
   - Look for `success: true` and a returned `contactId`.
   - If it fails, the log will show the GHL status and error body.
5. In GHL, search for the test email and confirm:
   - Contact exists.
   - Standard fields match.
   - Custom fields and tags match the mapping configuration.
6. Verify the app profile now has `ghl_contact_id` populated (visible in the database or via a profile query).
7. Delete the GHL test contact and the app test user when done.

## Phase 3 — App → GHL live sync on profile update

1. With the same test user, change a mapped profile field (e.g., phone or full name).
2. Save the profile.
3. `useProfile.ts` invokes `ghl-sync` automatically on `updateProfile` success.
4. Confirm in GHL that the contact reflects the updated value within seconds.

## Phase 4 — GHL → App webhook sync

1. Get the test user's `ghl_contact_id` from the profile.
2. Send a simulated GHL contact-update webhook to the edge function:
   - URL: `https://wkzgjvnpnhyluxvclymh.supabase.co/functions/v1/ghl-webhook`
   - Header: `X-Webhook-Secret: <GHL_WEBHOOK_SECRET>`
   - Body example:
     ```json
     {
       "id": "<ghl_contact_id>",
       "firstName": "Updated",
       "lastName": "Name",
       "phone": "+15551234567"
     }
     ```
3. Verify the response shows `success: true` and lists the updated fields.
4. Refresh the test user's profile in the app and confirm the name/phone changed.
5. Test the negative case: send a webhook for a contact ID not linked to any profile; expect `skipped: true, reason: "No matching profile"`.

## Phase 5 — Checkout/subscription webhook

1. In Admin Panel → GHL Product → Tier Mapping, add a test mapping:
   - GHL Product ID: a real or fake product ID
   - Tier: `partner` or `pro`
   - Billing interval: `month` or `year`
   - Active: true
2. Send a test `subscription.active` event:
   - URL: `https://wkzgjvnpnhyluxvclymh.supabase.co/functions/v1/ghl-checkout-webhook`
   - Header: `X-Webhook-Secret: <GHL_CHECKOUT_WEBHOOK_SECRET>`
   - Body:
     ```json
     {
       "event_type": "subscription.active",
       "email": "test+<date>@yourdomain.com",
       "product_id": "<mapped_product_id>",
       "subscription_id": "sub_test_123",
       "contact_id": "contact_test_123",
       "current_period_end": "2026-09-10T00:00:00Z"
     }
     ```
3. For an existing app user, verify `user_subscriptions` is upserted with the correct tier and status `active`.
4. For a non-existing user, verify a `pending_ghl_subscriptions` row is created and (if Resend is configured) a claim email is queued.
5. Test cancellation:
   - Send `subscription.canceled` for the same user/email.
   - Verify the subscription row is downgraded to `free`/`canceled` or the pending row is removed.

## Validation checklist

- [ ] Dry-run payload matches expectations before any live call.
- [ ] Signup creates a GHL contact and stores `ghl_contact_id`.
- [ ] Profile updates propagate to GHL within seconds.
- [ ] GHL contact updates propagate back to the app profile.
- [ ] Unknown contact IDs are ignored gracefully.
- [ ] Subscription webhook grants the correct tier for mapped products.
- [ ] Subscription webhook handles unmapped products with a clear `unmapped_product` error.
- [ ] Cancellation/downgrade events reset the user to `free`.
- [ ] No production user data or real customer contacts are used during testing.

## Safety rules

- Always start with **dry run** before live sync.
- Use disposable test emails and delete GHL contacts after each test.
- Do not test checkout webhooks with real customer emails.
- If a test fails, read the Edge Function log first; do not retry blindly against live GHL.
