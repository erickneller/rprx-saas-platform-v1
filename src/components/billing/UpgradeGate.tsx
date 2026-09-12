import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUpgradeGate } from '@/contexts/UpgradeGateContext';
import { featureRequiredTier, type FeatureKey } from '@/lib/upgradeFeatures';

interface UpgradeGateProps {
  feature: FeatureKey;
  children: ReactNode;
  /** Custom locked-state UI. Defaults to a friendly "Unlock with …" card. */
  fallback?: ReactNode;
  /** When true, also render a faded preview of children behind the fallback. */
  preview?: boolean;
}

/**
 * Wraps a region. If the user lacks access to `feature`, renders the fallback
 * (or a default upgrade card) instead of children.
 */
export function UpgradeGate({ feature, children, fallback, preview }: UpgradeGateProps) {
  const { isLocked, requireUpgrade } = useUpgradeGate();
  const locked = isLocked(feature);

  if (!locked) return <>{children}</>;

  const tierLabel = featureRequiredTier(feature) === 'pro' ? 'Pro' : 'Member';

  const defaultFallback = (
    <Card className="p-6 text-center border-dashed">
      <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-3">
        <Lock className="h-5 w-5 text-accent" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">Unlock with RPRx {tierLabel}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Upgrade to access this feature and keep your momentum going.
      </p>
      <Button onClick={() => requireUpgrade({ feature })}>
        Upgrade to {tierLabel}
      </Button>
    </Card>
  );

  if (preview) {
    return (
      <div className="relative">
        <div className="pointer-events-none blur-sm opacity-40 select-none" aria-hidden>
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {fallback ?? defaultFallback}
        </div>
      </div>
    );
  }

  return <>{fallback ?? defaultFallback}</>;
}
