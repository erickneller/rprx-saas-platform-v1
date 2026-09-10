import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { type PlanKey, type IntervalKey } from '@/lib/ghlCheckoutConfig';
import { getStoredAffiliateRef } from '@/lib/affiliateStorage';
import { useCheckoutConfig, CHECKOUT_CONFIG_QUERY_KEY } from '@/hooks/useCheckoutConfig';
import { useCompany } from '@/hooks/useCompany';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPlan?: PlanKey;
  initialInterval?: IntervalKey;
}

function appendParams(rawUrl: string, params: Record<string, string | null | undefined>): string {
  try {
    const url = new URL(rawUrl);
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

export function UpgradeModal({ open, onOpenChange, initialPlan = 'partner', initialInterval = 'month' }: UpgradeModalProps) {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const { company } = useCompany();
  const { config } = useCheckoutConfig();
  const qc = useQueryClient();
  const [plan, setPlan] = useState<PlanKey>(initialPlan);
  const [interval, setInterval] = useState<IntervalKey>(initialInterval);
  const [iframeLoading, setIframeLoading] = useState(true);
  const startingTier = tier;

  useEffect(() => { setIframeLoading(true); }, [plan, interval]);

  // Poll for subscription tier change while open
  useEffect(() => {
    if (!open || !user) return;
    const id = window.setInterval(async () => {
      await qc.invalidateQueries({ queryKey: ['subscription-tier', 'v2', user.id] });
      const next = qc.getQueryData<string>(['subscription-tier', 'v2', user.id]);

      if (next && next !== 'free' && next !== startingTier) {
        toast.success(`Welcome to RPRx ${next === 'pro' ? 'Pro' : 'Partner'}!`);
        onOpenChange(false);
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, [open, user, qc, startingTier, onOpenChange]);

  const slot = config[plan][interval];
  const isBlank = !slot.value.trim();

  const checkoutUrl = useMemo(() => {
    if (slot.mode !== 'url' || isBlank) return '';
    return appendParams(slot.value, {
      email: user?.email ?? null,
      user_id: user?.id ?? null,
      ref: getStoredAffiliateRef(),
      company_id: company?.id ?? null,
      company: company?.name ?? null,
    });
  }, [slot, isBlank, user, company]);

  // Embed mode: render the admin-saved snippet (validated to GHL hosts on save).
  const embedHtml = slot.mode === 'embed' && !isBlank ? slot.value : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-3 border-b">
          <DialogTitle>{config.header.title}</DialogTitle>
          <DialogDescription>{config.header.description}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 pb-3 border-b flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Tabs value={plan} onValueChange={(v) => setPlan(v as PlanKey)}>
            <TabsList>
              <TabsTrigger value="partner">Partner</TabsTrigger>
              <TabsTrigger value="pro">Pro</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={interval} onValueChange={(v) => setInterval(v as IntervalKey)}>
            <TabsList>
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="year">Yearly <span className="ml-1 text-xs text-accent">−17%</span></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 relative bg-muted/30 overflow-auto">
          {isBlank ? (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <div className="max-w-md space-y-4">
                <p className="font-medium">Membership options are opening outside this window</p>
                <p className="text-sm text-muted-foreground">
                  The <strong>{plan}</strong> ({interval}) checkout link couldn't be loaded right now.
                  You can retry, or open the RPRx membership options page to choose the right path.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => qc.invalidateQueries({ queryKey: CHECKOUT_CONFIG_QUERY_KEY })}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Retry
                  </Button>
                  <Button
                    onClick={() => {
                      const ref = getStoredAffiliateRef();
                      const base = new URL('/join', window.location.origin).toString();
                      const url = appendParams(base, {
                        email: user?.email ?? null,
                        user_id: user?.id ?? null,
                        ref,
                      });
                      window.location.href = url;
                    }}
                  >
                    View RPRx membership options
                  </Button>
                </div>
              </div>
            </div>
          ) : slot.mode === 'embed' ? (
            <div
              className="w-full h-full p-2"
              dangerouslySetInnerHTML={{ __html: embedHtml }}
            />
          ) : (
            <>
              {iframeLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <iframe
                key={checkoutUrl}
                src={checkoutUrl}
                title="Checkout"
                className="w-full h-full border-0"
                onLoad={() => setIframeLoading(false)}
                allow="payment"
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
