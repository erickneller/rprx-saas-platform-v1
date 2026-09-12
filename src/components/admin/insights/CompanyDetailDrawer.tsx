import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useAdminUsersWithTier, type CompanyRollup } from '@/hooks/useAdminInsights';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useMemo } from 'react';

interface Props {
  company: CompanyRollup | null;
  onOpenChange: (open: boolean) => void;
}

export function CompanyDetailDrawer({ company, onOpenChange }: Props) {
  const { data: allUsers = [] } = useAdminUsersWithTier();

  const members = useMemo(
    () => (company ? allUsers.filter(u => u.company_id === company.company_id) : []),
    [company, allUsers],
  );

  const tierData = company
    ? [
        { name: 'Free', value: company.free_count },
        { name: 'Member', value: company.partner_count },
        { name: 'Pro', value: company.pro_count },
      ]
    : [];

  const openData = company
    ? [
        { name: 'Course', value: company.course_opens },
        { name: 'Library', value: company.library_opens },
      ]
    : [];

  return (
    <Sheet open={!!company} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        {!company ? null : (
          <>
            <SheetHeader>
              <SheetTitle>{company.company_name}</SheetTitle>
              <SheetDescription>
                {company.member_count} members · Plan{' '}
                <span className="capitalize">{company.plan}</span> · Avg streak{' '}
                {Number(company.avg_streak).toFixed(1)}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs uppercase text-muted-foreground mb-2">Members by tier</p>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={tierData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {tierData.map((_, i) => (
                            <Cell key={i} fill="hsl(var(--primary))" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs uppercase text-muted-foreground mb-2">Video opens by source</p>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={openData}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Members ({members.length})</h3>
                <div className="space-y-2">
                  {members.map(m => (
                    <Card key={m.id}>
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">{m.tier}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                  {members.length === 0 && (
                    <p className="text-sm text-muted-foreground">No members.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
