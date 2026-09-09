// Single source of truth for which features require which paid tier.
// Used by UpgradeGate, LockedButton, sidebar lock affordance, and route guards.

import type { SubscriptionTier } from '@/hooks/useSubscription';

export type RequiredTier = 'free' | 'partner' | 'pro';

export function normalizeRequiredTier(value: unknown): RequiredTier {
  return value === 'pro' || value === 'partner' || value === 'free'
    ? (value as RequiredTier)
    : 'free';
}

// Feature keys — short, kebab-case, used in analytics + UI lookup.
export type FeatureKey =
  | 'strategy-assistant'
  | 'plans'
  | 'debt-eliminator'
  | 'virtual-advisor'
  | 'family-overview'
  | 'partners-directory'
  | 'library'
  | 'equity-recapture-calculator';

export const FEATURE_TIER: Record<FeatureKey, RequiredTier> = {
  'strategy-assistant': 'partner',
  'plans':              'free',
  'debt-eliminator':    'partner',
  'partners-directory': 'partner',
  'library':            'partner',
  'equity-recapture-calculator': 'partner',
  'virtual-advisor':    'pro',
  'family-overview':    'pro',
};

// Map sidebar nav row IDs (DB-seeded `item:*`) → feature key.
// Used by AppSidebar to intercept gated clicks.
export const NAV_ITEM_FEATURE: Record<string, FeatureKey> = {
  'item:strategy_assistant': 'strategy-assistant',
  'item:plans':              'plans',
  'item:debt_eliminator':    'debt-eliminator',
  'item:partners':           'partners-directory',
  'item:rprx_partners':      'partners-directory',
  'item:library':            'library',
  'library':                 'library', // legacy seed id
  'item:virtual_advisor':    'virtual-advisor',
  'item:advisor_link':       'virtual-advisor',
  'item:equity_recapture_calculator': 'equity-recapture-calculator',
};

// Reverse map: feature key → sidebar nav row id (for DB-driven tier lookups by route).
export const FEATURE_NAV_ITEM: Record<FeatureKey, string> = Object.entries(NAV_ITEM_FEATURE).reduce(
  (acc, [navId, feature]) => {
    if (!(feature in acc)) acc[feature] = navId;
    return acc;
  },
  {} as Record<FeatureKey, string>,
);

// Map route paths → feature key (used by UpgradeRouteGuard).
export const ROUTE_FEATURE: Record<string, FeatureKey> = {
  '/strategy-assistant': 'strategy-assistant',
  '/plans':              'plans',
  '/debt-eliminator':    'debt-eliminator',
  '/partners':           'partners-directory',
  '/library':            'library',
  '/virtual-advisor':    'virtual-advisor',
  '/calculators/equity-recapture': 'equity-recapture-calculator',
};

const TIER_RANK: Record<string, number> = {
  free:    0,
  paid:    1, // legacy alias — keep so any stale 'paid' string ranks as partner
  partner: 1,
  pro:     2,
};


export function tierMeets(current: SubscriptionTier, required: RequiredTier): boolean {
  if (required === 'free') return true;
  return (TIER_RANK[current] ?? 0) >= (TIER_RANK[required] ?? 99);
}

export function featureRequiredTier(feature: FeatureKey): RequiredTier {
  return FEATURE_TIER[feature];
}
