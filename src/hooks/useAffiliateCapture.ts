import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { readStoredAffiliate, storeAffiliateRef } from '@/lib/affiliateStorage';

/**
 * On mount, captures ?ref= from URL and persists it in localStorage (90-day TTL).
 * On sign-in, upserts to affiliate_attributions (first-touch wins via PK conflict ignore).
 */
export function useAffiliateCapture() {
  const { user } = useAuth();

  // Capture from URL on every mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('aff') || params.get('affiliate');
      if (ref) {
        storeAffiliateRef(ref.trim(), `${window.location.pathname}${window.location.search}`);
      }
    } catch {}
  }, []);

  // Persist to DB when user signs in (first-touch only)
  useEffect(() => {
    if (!user) return;
    if (typeof window !== 'undefined' && window.location.pathname === '/join') return; // join flow records company-aware attribution
    const stored = readStoredAffiliate();
    if (!stored?.ref) return;
    (async () => {
      try {
        // Check if attribution already exists (first-touch wins)
        const { data: existing } = await (supabase
          .from('affiliate_attributions') as any)
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (existing) return;
        await (supabase.from('affiliate_attributions') as any).insert({
          user_id: user.id,
          affiliate_id: stored.ref,
          landing_path: stored.landingPath ?? null,
        });
      } catch (e) {
        console.warn('affiliate capture failed', e);
      }
    })();
  }, [user]);
}
