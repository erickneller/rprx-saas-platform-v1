import { useAdminUsersWithTier, useAdminCompanyRollup } from '@/hooks/useAdminInsights';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Crown, Building2, Video, Activity, Loader2 } from 'lucide-react';
import { useMemo } from 'react';

export function InsightsOverviewTab() {
  const { data: users = [], isLoading: u } = useAdminUsersWithTier();
  const { data: companies = [], isLoading: c } = useAdminCompanyRollup();

  const totals = useMemo(() => {
    const tiers = { free: 0, partner: 0, pro: 0 };
    users.forEach(u => {
      if (u.tier === 'pro') tiers.pro++;
      else if (u.tier === 'partner') tiers.partner++;
      else tiers.free++;
    });
    const totalOpens = companies.reduce((s, c) => s + (c.total_video_opens || 0), 0);
    const active7 = companies.reduce((s, c) => s + (c.active_last_7d || 0), 0);
    return { tiers, totalOpens, active7 };
  }, [users, companies]);

  if (u || c) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: users.length, icon: Users },
    { label: 'Free', value: totals.tiers.free, icon: Users },
    { label: 'Member', value: totals.tiers.partner, icon: Crown },
    { label: 'Pro', value: totals.tiers.pro, icon: Crown },
    { label: 'Companies', value: companies.length, icon: Building2 },
    { label: 'Active (7d, company members)', value: totals.active7, icon: Activity },
    { label: 'Total Video Opens', value: totals.totalOpens, icon: Video },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
              <s.icon className="h-6 w-6 text-primary" />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
