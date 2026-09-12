import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useUpgradeGate } from '@/contexts/UpgradeGateContext';
import { useBillingCardSettings } from '@/hooks/useBillingCardSettings';
import { Sparkles, LifeBuoy, ArrowUpCircle } from 'lucide-react';

function buildContactHref(value: string): { href: string; external: boolean } {
  const v = (value || '').trim();
  if (!v) return { href: '#', external: false };
  if (/^(https?:|mailto:|tel:)/i.test(v)) {
    return { href: v, external: /^https?:/i.test(v) };
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    return { href: `mailto:${v}`, external: false };
  }
  return { href: v, external: false };
}

export function BillingCard() {
  const { tier, isFree, isPartner } = useSubscription();
  const { requireUpgrade } = useUpgradeGate();
  const { copy } = useBillingCardSettings();

  const tierLabel = tier === 'pro' ? 'Pro' : tier === 'partner' ? 'Member' : 'Free';

  const targetFeature = isPartner ? 'virtual-advisor' : 'strategy-assistant';
  const footer = copy.footerNote.replace('{email}', copy.supportEmail);
  const contact = buildContactHref(copy.supportEmail);
  const externalProps = contact.external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            {copy.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {copy.description}
          </p>
        </div>
        <Badge variant={isFree ? 'secondary' : 'default'} className="capitalize">
          {tierLabel}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => requireUpgrade({ feature: targetFeature })}>
          <ArrowUpCircle className="h-4 w-4 mr-2" />
          {isFree ? copy.upgradeLabel : copy.changeLabel}
        </Button>
        {!isFree && (
          <a href={contact.href} {...externalProps}>
            <Button variant="outline">
              <LifeBuoy className="h-4 w-4 mr-2" />
              {copy.supportLabel}
            </Button>
          </a>
        )}
      </div>

      {!isFree && (
        <p className="text-xs text-muted-foreground mt-3">
          {footer.split(copy.supportEmail).map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <a href={contact.href} {...externalProps} className="underline">{copy.supportEmail}</a>
              )}
            </span>
          ))}
        </p>
      )}
    </Card>
  );
}
