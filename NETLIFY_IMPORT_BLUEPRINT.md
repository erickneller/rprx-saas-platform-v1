# RPRx Netlify UX Import Blueprint

## Access status

- Repository cloned successfully from `https://github.com/erickneller/rprx-saas-platform-v1.git` into `/home/clouduser/rprx-saas-platform-v1`.
- Branch: `main` tracking `origin/main`.
- Current repo builds with `npm run build`.
- Current test suite passes with `npm test -- --run`: 4 files / 29 tests passing.

## Current Lovable app foundation to preserve

The Lovable app is a Vite + React + TypeScript + Tailwind/shadcn app using Supabase and React Query.

Preserve these core systems:

- Supabase auth and `AuthProvider`.
- Protected routes and `WizardGuard`.
- Existing dashboard/sidebar app shell.
- Existing routes:
  - `/auth`
  - `/dashboard`
  - `/assessment`
  - `/results/:id`
  - `/assessments`
  - `/profile`
  - `/partners`
  - `/library`
  - `/health-assessment`
  - `/virtual-advisor`
  - `/calculators/equity-recapture`
- Existing financial persistence tables:
  - `assessment_questions`
  - `assessment_responses`
  - `user_assessments`
  - `deep_dive_questions`
  - `user_deep_dives`
  - `saved_plans`
- Existing health persistence table:
  - `user_health_assessments`
- Existing general lead/submission table:
  - `assessment_submissions`
- Existing GHL sync edge function:
  - `supabase/functions/ghl-sync/index.ts`
- Existing subscription/feature-gating logic and `get_subscription_tier` calls.

## Current Lovable assessment implementation

### Financial

- Route: `/assessment`
- Page: `src/pages/Assessment.tsx`
- Main component: `src/components/assessment/AssessmentWizard.tsx`
- Hook: `src/hooks/useAssessment.ts`
- Question source: Supabase `assessment_questions` via `src/hooks/useAssessmentQuestions.ts`
- Current financial assessment is a 15-question core flow plus primary-horseman deep dive.
- It calculates horseman scores, inserts a `user_assessments` row, inserts `assessment_responses`, optionally inserts `user_deep_dives`, updates profile RPRx score/leak fields, starts onboarding, attempts plan generation, logs gamification, and navigates to `/results/:id`.

### Health

- Route: `/health-assessment`
- Page: `src/pages/HealthAssessment.tsx`
- Store: `src/store/healthAssessmentStore.ts`
- Components: `src/components/health-assessment/*`
- Current health assessment is a multi-step health profile/habit/screening/goals/contact flow, not the Netlify yes/no topic matcher.
- Results report: `src/components/health-assessment/PhysicalSnapshotReport.tsx`
- It saves authenticated user results to `user_health_assessments` and updates `assessment_submissions` best-effort.

## Netlify UX pieces to import

Use Netlify as the UX/content/logic source, not as the backend foundation.

### Import / merge

1. Two-path assessment entry UX
   - Financial/wealth path and physical/health path.
   - Clear copy: both are free; no detailed financial/medical data required.
   - This should become part of Lovable landing/dashboard/assessments flow.

2. Netlify-style lightweight assessment screens
   - Sectioned yes/no flow.
   - Conditional follow-ups shown only when earlier answers make them relevant.
   - Matrix questions for groups of related yes/no rows.
   - Progress indicator based on currently visible applicable questions.

3. Financial assessment content/engine
   - Netlify has the larger financial question set.
   - Initial sections: Family, Income, Deductions, Buying & Selling, Debt, Insurance, plus final work-style section.
   - Includes 47 themes and 503 strategies embedded in `THEMES`.
   - Matching logic: evaluate theme triggers against answer map, sort hot/high-value matches first.

4. Physical/health assessment content/engine
   - Netlify PHYS engine sections: Mind & Mood, Body & Movement, Conditions, Prevention & Recovery, Almost Done.
   - Main yes/no topics plus follow-ups, professional-care matrix, money-stress/health-setback/work-style routing.
   - Results should show selected/help-requested topics and partner/resource matches.

5. Results UX
   - Matched areas cards.
   - Free top matched areas vs locked member/library content.
   - Educational disclaimers on each assessment/results path.
   - `Add to my plan` / `In my plan` behavior, but persisted to Lovable/Supabase `saved_plans`.

6. Profile/My Assessments merge
   - Lovable should own persistence; Netlify profile concept should influence UX.
   - Show completed financial and health assessments, top matches, selected plan items, and partner matches.

### Do not import directly

- Netlify's stub sign-in logic.
- Netlify's lack of persistence.
- Netlify's prototype checkout/booking stubs.
- Client-only state as the final source of truth.

## Recommended implementation sequence

### Phase 1: Add a reusable assessment engine data layer

Add frontend engine modules first, without changing database schema yet:

- `src/lib/rprx-assessments/ruleEngine.ts`
- `src/lib/rprx-assessments/financialContent.ts`
- `src/lib/rprx-assessments/physicalContent.ts`
- `src/lib/rprx-assessments/types.ts`

These should model Netlify concepts:

- sections
- questions
- yes/no matrix items
- `showIf` rules
- answer map
- matched financial themes
- matched physical topics/resources
- free/locked result partitioning

### Phase 2: Replace/upgrade financial UX while preserving persistence

Modify `AssessmentWizard`/`useAssessment` or create a new component under the same `/assessment` route that:

- Uses Netlify financial questions/conditional rendering.
- Converts visible answers into existing `user_assessments` + `assessment_responses` writes.
- Stores the full Netlify answer map in an additional JSON payload if schema allows, or add a safe migration if needed.
- Keeps current scoring/profile/plan/GHL behavior working.

### Phase 3: Replace/upgrade health UX

Either:

- Keep current `/health-assessment` persistence table and replace the current multi-step profile/habits assessment with Netlify's yes/no physical engine, or
- Add a new route/component first and swap sidebar links after QA.

Recommended: create the new engine component behind `/health-assessment?engine=netlify` or an internal feature flag first, then make it default after it saves correctly.

### Phase 4: Results and plan persistence

Add shared result components:

- `AssessmentResultCard`
- `LockedMemberResultCard`
- `AddToPlanButton`
- `PartnerMatchCard`

Persist selected plan items to `saved_plans`; do not leave them as session-only state.

### Phase 5: GHL mapping

Update `ghl-sync` mapping only after DB fields are stable. It should receive summarized fields, not all private answers unless explicitly needed:

- assessment type completed
- primary/secondary financial horseman or health topic
- top free matches
- requested partner/resource categories
- membership interest
- booking intent

## Important implementation guardrails

- Do not rewrite Auth, Dashboard, Sidebar, Supabase client, ProtectedRoute, WizardGuard, existing subscription gates, or GHL function wholesale.
- Do not expose Supabase service role keys or GHL/Stripe/OpenAI secrets in frontend code.
- Keep RPRx as the first working tenant; defer full white-label admin UI until the RPRx path works end-to-end.
- Add database migrations only when frontend mapping is clear.
- Prefer additive components/modules over destructive rewrites.
- Verify after each phase with `npm run build`, `npm test -- --run`, and live browser QA.

## Immediate next code step

Create the `src/lib/rprx-assessments/*` engine modules from the Netlify source and add tests for:

- conditional `showIf` rule evaluation
- visible question calculation
- financial theme matching
- physical topic matching
- free vs locked result partitioning

Only after those tests pass should the UI be swapped into the Lovable routes.
