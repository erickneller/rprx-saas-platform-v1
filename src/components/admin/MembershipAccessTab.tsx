import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSidebarConfig, useUpdateNavVisibility, useUpsertNavRow, type NavConfigRow } from '@/hooks/useSidebarConfig';
import { useAllLibraryCategories, useAllLibraryVideos, useUpsertLibraryVideo, type LibraryVideo } from '@/hooks/useLibrary';
import {
  useCheckoutConfig,
  useUpdateCheckoutConfig,
  type CheckoutConfig,
  type CheckoutMode,
  type CheckoutSlot,
} from '@/hooks/useCheckoutConfig';
import type { IntervalKey, PlanKey } from '@/lib/ghlCheckoutConfig';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, ShieldCheck, CreditCard, Library, Navigation, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type AccessTier = 'free' | 'partner' | 'pro';

type GhlProductRow = {
  ghl_product_id: string;
  tier: 'partner' | 'pro';
  billing_interval: 'month' | 'year';
  is_active: boolean;
  notes: string | null;
};

const TIERS: Array<{ value: AccessTier; label: string; description: string }> = [
  { value: 'free', label: 'Free', description: 'Everyone' },
  { value: 'partner', label: 'Partner', description: 'Partner + Pro' },
  { value: 'pro', label: 'Pro', description: 'Pro only' },
];

const PAID_TIERS: Array<{ value: 'partner' | 'pro'; label: string }> = [
  { value: 'partner', label: 'Partner' },
  { value: 'pro', label: 'Pro' },
];

const PLAN_LABEL: Record<PlanKey, string> = { partner: 'Partner', pro: 'Pro' };
const INTERVAL_LABEL: Record<IntervalKey, string> = { month: 'Monthly', year: 'Yearly' };

function TierSelect({
  value,
  onChange,
  disabled,
  paidOnly = false,
}: {
  value: AccessTier | 'partner' | 'pro';
  onChange: (value: AccessTier) => void;
  disabled?: boolean;
  paidOnly?: boolean;
}) {
  const options = paidOnly ? PAID_TIERS : TIERS;
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[150px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((tier) => (
          <SelectItem key={tier.value} value={tier.value}>
            {tier.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TierBadge({ tier }: { tier: AccessTier | string | null | undefined }) {
  const value = tier || 'free';
  const className =
    value === 'pro'
      ? 'bg-primary/15 text-primary border-primary/20'
      : value === 'partner'
        ? 'bg-accent text-accent-foreground border-accent'
        : 'bg-muted text-muted-foreground border-muted';

  return <Badge variant="outline" className={`capitalize ${className}`}>{value}</Badge>;
}

function useGhlProductRows() {
  return useQuery({
    queryKey: ['ghl-product-tier-map'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ghl_product_tier_map' as never)
        .select('*')
        .order('tier')
        .order('billing_interval');
      if (error) throw error;
      return ((data ?? []) as unknown) as GhlProductRow[];
    },
  });
}

function useSaveGhlProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: GhlProductRow) => {
      const { error } = await supabase.from('ghl_product_tier_map' as never)
        .upsert(row, { onConflict: 'ghl_product_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ghl-product-tier-map'] });
      toast.success('GHL product access saved');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Failed to save GHL product access')),
  });
}

function useDeleteGhlProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ghl_product_tier_map' as never).delete().eq('ghl_product_id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ghl-product-tier-map'] });
      toast.success('GHL product mapping deleted');
    },
    onError: (e: unknown) => toast.error(errorMessage(e, 'Failed to delete GHL product mapping')),
  });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function MembershipAccessTab() {
  const { rows: navRows, isLoading: navLoading } = useSidebarConfig();
  const updateNavVisibility = useUpdateNavVisibility();
  const upsertNavRow = useUpsertNavRow();

  const { data: categories = [], isLoading: catLoading } = useAllLibraryCategories();
  const { data: videos = [], isLoading: videoLoading } = useAllLibraryVideos();
  const upsertVideo = useUpsertLibraryVideo();

  const { data: ghlRows = [], isLoading: ghlLoading } = useGhlProductRows();
  const saveGhlProduct = useSaveGhlProduct();
  const deleteGhlProduct = useDeleteGhlProduct();

  const { config: checkoutConfig, isLoading: checkoutLoading, isDefault: checkoutUsingDefaults } = useCheckoutConfig();
  const updateCheckoutConfig = useUpdateCheckoutConfig();
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutConfig | null>(null);
  const draft = checkoutDraft ?? checkoutConfig;

  const [newProduct, setNewProduct] = useState<GhlProductRow>({
    ghl_product_id: '',
    tier: 'partner',
    billing_interval: 'month',
    is_active: true,
    notes: '',
  });

  const navItems = useMemo(
    () => navRows.filter((row) => row.kind === 'item').sort((a, b) => a.sort_order - b.sort_order),
    [navRows],
  );

  const categoryName = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((category) => map.set(category.id, category.name));
    return map;
  }, [categories]);

  const counts = useMemo(() => {
    const countByTier = (items: Array<{ required_tier?: string | null }>) => ({
      free: items.filter((i) => (i.required_tier ?? 'free') === 'free').length,
      partner: items.filter((i) => i.required_tier === 'partner').length,
      pro: items.filter((i) => i.required_tier === 'pro').length,
    });
    return {
      nav: countByTier(navItems),
      library: countByTier(videos),
      products: {
        partner: ghlRows.filter((r) => r.tier === 'partner').length,
        pro: ghlRows.filter((r) => r.tier === 'pro').length,
      },
    };
  }, [navItems, videos, ghlRows]);

  const setNavTier = async (row: NavConfigRow, required_tier: AccessTier) => {
    try {
      await upsertNavRow.mutateAsync({ ...row, required_tier });
      toast.success(`${row.label} now requires ${required_tier}`);
    } catch (e: unknown) {
      toast.error(errorMessage(e, 'Failed to update navigation access'));
    }
  };

  const setVideoTier = async (video: LibraryVideo, required_tier: AccessTier) => {
    try {
      await upsertVideo.mutateAsync({ ...video, required_tier });
      toast.success(`${video.title} now requires ${required_tier}`);
    } catch (e: unknown) {
      toast.error(errorMessage(e, 'Failed to update library access'));
    }
  };

  const setVideoActive = async (video: LibraryVideo, is_active: boolean) => {
    try {
      await upsertVideo.mutateAsync({ ...video, is_active });
      toast.success(is_active ? 'Library item activated' : 'Library item hidden');
    } catch (e: unknown) {
      toast.error(errorMessage(e, 'Failed to update library item'));
    }
  };

  const setProductActive = (row: GhlProductRow, is_active: boolean) => {
    saveGhlProduct.mutate({ ...row, is_active });
  };

  const setCheckoutSlot = (plan: PlanKey, interval: IntervalKey, slot: CheckoutSlot) => {
    setCheckoutDraft({
      ...draft,
      [plan]: {
        ...draft[plan],
        [interval]: slot,
      },
    });
  };

  const saveCheckout = async () => {
    try {
      await updateCheckoutConfig.mutateAsync(draft);
      setCheckoutDraft(null);
      toast.success('Checkout access links saved');
    } catch (e: unknown) {
      toast.error(errorMessage(e, 'Failed to save checkout links'));
    }
  };

  const isLoading = navLoading || catLoading || videoLoading || ghlLoading || checkoutLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Membership Access Center
          </CardTitle>
          <CardDescription>
            One clean place to move app menu items, library resources, checkout links, and GHL products into or out of each membership tier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-background p-3">
              <p className="text-sm font-medium">Navigation items</p>
              <p className="text-xs text-muted-foreground">Free {counts.nav.free} · Partner {counts.nav.partner} · Pro {counts.nav.pro}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-sm font-medium">Library resources</p>
              <p className="text-xs text-muted-foreground">Free {counts.library.free} · Partner {counts.library.partner} · Pro {counts.library.pro}</p>
            </div>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-sm font-medium">GHL product mappings</p>
              <p className="text-xs text-muted-foreground">Partner {counts.products.partner} · Pro {counts.products.pro}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Navigation className="h-5 w-5" /> App Menu & Route Access
          </CardTitle>
          <CardDescription>
            Controls the sidebar menu and the tier required when members open protected routes.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Menu item</TableHead>
                <TableHead>Path / Type</TableHead>
                <TableHead>Required membership</TableHead>
                <TableHead>Visible</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {navItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{item.url || '—'}</div>
                    <div className="text-xs text-muted-foreground capitalize">{item.link_type}</div>
                  </TableCell>
                  <TableCell>
                    <TierSelect
                      value={item.required_tier ?? 'free'}
                      onChange={(tier) => setNavTier(item, tier)}
                      disabled={upsertNavRow.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.visible}
                      onCheckedChange={(visible) => updateNavVisibility.mutate({ id: item.id, visible })}
                      disabled={item.id === 'item:dashboard' || updateNavVisibility.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Library className="h-5 w-5" /> Library Content Access
          </CardTitle>
          <CardDescription>
            Controls which membership tier can watch each RPRx Library video/resource.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Required membership</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No library resources yet.</TableCell></TableRow>
              ) : videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>
                    <div className="font-medium">{video.title}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[420px]">{video.video_url || 'No video URL'}</div>
                  </TableCell>
                  <TableCell>{categoryName.get(video.category_id) ?? video.category_id}</TableCell>
                  <TableCell>
                    <TierSelect
                      value={video.required_tier ?? 'free'}
                      onChange={(tier) => setVideoTier(video, tier)}
                      disabled={upsertVideo.isPending}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={video.is_active}
                      onCheckedChange={(active) => setVideoActive(video, active)}
                      disabled={upsertVideo.isPending}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" /> Checkout Links
          </CardTitle>
          <CardDescription>
            Controls where upgrade prompts send members for each paid tier.
            {checkoutUsingDefaults && ' Currently using default checkout values until saved.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Checkout modal title</Label>
              <Input
                value={draft.header.title}
                onChange={(e) => setCheckoutDraft({ ...draft, header: { ...draft.header, title: e.target.value } })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Public funnel URL</Label>
              <Input
                value={draft.publicFunnel}
                onChange={(e) => setCheckoutDraft({ ...draft, publicFunnel: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Checkout modal description</Label>
            <Input
              value={draft.header.description}
              onChange={(e) => setCheckoutDraft({ ...draft, header: { ...draft.header, description: e.target.value } })}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {(['partner', 'pro'] as PlanKey[]).map((plan) => (
              <Card key={plan} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">{PLAN_LABEL[plan]} checkout</h3>
                  <TierBadge tier={plan} />
                </div>
                <div className="space-y-4">
                  {(['month', 'year'] as IntervalKey[]).map((interval) => {
                    const slot = draft[plan][interval];
                    return (
                      <div key={interval} className="space-y-2 rounded-md border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Label>{INTERVAL_LABEL[interval]}</Label>
                          <Select
                            value={slot.mode}
                            onValueChange={(mode) => setCheckoutSlot(plan, interval, { ...slot, mode: mode as CheckoutMode })}
                          >
                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="url">URL</SelectItem>
                              <SelectItem value="embed">Embed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          value={slot.value}
                          placeholder={slot.mode === 'embed' ? '<iframe ... or <script ...' : 'https://checkout...'}
                          onChange={(e) => setCheckoutSlot(plan, interval, { ...slot, value: e.target.value })}
                        />
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={saveCheckout} disabled={updateCheckoutConfig.isPending}>
              {updateCheckoutConfig.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save checkout links
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" /> GHL Product → Membership Tier
          </CardTitle>
          <CardDescription>
            Controls which tier gets unlocked when a GoHighLevel purchase webhook comes in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="p-4 bg-muted/30">
            <div className="grid gap-3 md:grid-cols-5 items-end">
              <div className="md:col-span-2 space-y-1.5">
                <Label>GHL Product ID</Label>
                <Input
                  value={newProduct.ghl_product_id}
                  placeholder="Paste product ID"
                  onChange={(e) => setNewProduct((p) => ({ ...p, ghl_product_id: e.target.value.trim() }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unlock tier</Label>
                <TierSelect
                  value={newProduct.tier}
                  paidOnly
                  onChange={(tier) => setNewProduct((p) => ({ ...p, tier }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Billing</Label>
                <Select
                  value={newProduct.billing_interval}
                  onValueChange={(interval) => setNewProduct((p) => ({ ...p, billing_interval: interval as GhlProductRow['billing_interval'] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Monthly</SelectItem>
                    <SelectItem value="year">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={!newProduct.ghl_product_id || saveGhlProduct.isPending}
                onClick={() => {
                  saveGhlProduct.mutate(newProduct, {
                    onSuccess: () => setNewProduct({ ghl_product_id: '', tier: 'partner', billing_interval: 'month', is_active: true, notes: '' }),
                  });
                }}
              >
                {saveGhlProduct.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add / Save
              </Button>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label>Notes</Label>
              <Input
                value={newProduct.notes ?? ''}
                placeholder="Optional internal note"
                onChange={(e) => setNewProduct((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </Card>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product ID</TableHead>
                  <TableHead>Unlocks</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ghlRows.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No GHL products mapped yet.</TableCell></TableRow>
                ) : ghlRows.map((row) => (
                  <TableRow key={row.ghl_product_id}>
                    <TableCell className="font-mono text-xs">{row.ghl_product_id}</TableCell>
                    <TableCell>
                      <TierSelect value={row.tier} paidOnly onChange={(tier) => saveGhlProduct.mutate({ ...row, tier })} />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.billing_interval}
                        onValueChange={(billing_interval) => saveGhlProduct.mutate({ ...row, billing_interval: billing_interval as GhlProductRow['billing_interval'] })}
                      >
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="month">Monthly</SelectItem>
                          <SelectItem value="year">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Switch checked={row.is_active} onCheckedChange={(active) => setProductActive(row, active)} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">{row.notes || '—'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteGhlProduct.mutate(row.ghl_product_id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
