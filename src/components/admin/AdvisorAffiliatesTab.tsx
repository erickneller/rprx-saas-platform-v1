import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, ExternalLink, Loader2, Plus, Save, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { buildInviteUrl } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const PROD_BASE = 'https://app.rprx4life.com';

type AffiliateStatus = 'active' | 'inactive';

type AdvisorAffiliate = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  referral_code: string;
  commission_rate: number;
  status: AffiliateStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AffiliateForm = {
  name: string;
  email: string;
  company: string;
  company_id: string;
  is_default_company_affiliate: boolean;
  referral_code: string;
  commission_rate: string;
  status: AffiliateStatus;
  notes: string;
};

type AffiliateReportRow = {
  attribution_user_id: string;
  affiliate_id: string;
  affiliate_name: string | null;
  affiliate_email: string | null;
  affiliate_company: string | null;
  commission_rate: number | null;
  landing_path: string | null;
  captured_at: string;
  attribution_type: string | null;
  joined_company_id: string | null;
  joined_company_name: string | null;
  referred_user_name: string | null;
  referred_user_company: string | null;
  referred_user_phone: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  subscription_source: string | null;
  ghl_product_id: string | null;
  ghl_subscription_id: string | null;
  upgraded_at: string | null;
  estimated_monthly_commission: number | null;
};

type CompanyOption = {
  id: string;
  name: string;
};

type CompanyAffiliateRow = {
  company_id: string;
  affiliate_id: string;
  is_default: boolean;
  active: boolean;
};

const emptyForm: AffiliateForm = {
  name: '',
  email: '',
  company: '',
  company_id: '',
  is_default_company_affiliate: false,
  referral_code: '',
  commission_rate: '20',
  status: 'active',
  notes: '',
};

function slugifyCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function referralLink(code: string) {
  return `${PROD_BASE}/assessment?ref=${encodeURIComponent(code)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

function money(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value ?? 0));
}

function csvEscape(value: unknown) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadRows(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) {
    toast.info('No rows to export yet');
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function useAdvisorAffiliates() {
  return useQuery({
    queryKey: ['advisor-affiliates'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('advisor_affiliates') as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdvisorAffiliate[];
    },
  });
}

function useAffiliateReport() {
  return useQuery({
    queryKey: ['admin-affiliate-report'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_affiliate_report' as any);
      if (error) throw error;
      return (data ?? []) as AffiliateReportRow[];
    },
  });
}

function useCompaniesForAffiliates() {
  return useQuery({
    queryKey: ['admin-companies-affiliate-options'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('companies') as any)
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CompanyOption[];
    },
  });
}

function useCompanyAffiliateAssignments() {
  return useQuery({
    queryKey: ['company-affiliate-assignments'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('company_affiliates') as any)
        .select('company_id, affiliate_id, is_default, active')
        .eq('active', true);
      if (error) throw error;
      return (data ?? []) as CompanyAffiliateRow[];
    },
  });
}

export function AdvisorAffiliatesTab() {
  const qc = useQueryClient();
  const { data: affiliates = [], isLoading: affiliatesLoading } = useAdvisorAffiliates();
  const { data: report = [], isLoading: reportLoading } = useAffiliateReport();
  const { data: companies = [] } = useCompaniesForAffiliates();
  const { data: assignments = [] } = useCompanyAffiliateAssignments();
  const [form, setForm] = useState<AffiliateForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const saveAffiliate = useMutation({
    mutationFn: async (draft: AffiliateForm) => {
      const companyName = companies.find((c) => c.id === draft.company_id)?.name;
      const payload = {
        name: draft.name.trim(),
        email: draft.email.trim() || null,
        company: companyName || draft.company.trim() || null,
        referral_code: slugifyCode(draft.referral_code || draft.name),
        commission_rate: Number(draft.commission_rate || 20),
        status: draft.status,
        notes: draft.notes.trim() || null,
      };
      if (!payload.name || !payload.referral_code) throw new Error('Advisor name and referral code are required.');

      let affiliateId = editingId;
      if (editingId) {
        const { error } = await (supabase.from('advisor_affiliates') as any).update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase.from('advisor_affiliates') as any).insert(payload).select('id').single();
        if (error) throw error;
        affiliateId = data.id;
      }

      if (draft.company_id && affiliateId) {
        if (draft.is_default_company_affiliate) {
          const { error: clearErr } = await (supabase.from('company_affiliates') as any)
            .update({ is_default: false })
            .eq('company_id', draft.company_id)
            .eq('active', true);
          if (clearErr) throw clearErr;
        }
        const { error: linkErr } = await (supabase.from('company_affiliates') as any).upsert({
          company_id: draft.company_id,
          affiliate_id: affiliateId,
          is_default: draft.is_default_company_affiliate,
          active: true,
        }, { onConflict: 'company_id,affiliate_id' });
        if (linkErr) throw linkErr;
      }
    },
    onSuccess: async () => {
      toast.success(editingId ? 'Advisor affiliate updated' : 'Advisor affiliate created');
      setForm(emptyForm);
      setEditingId(null);
      await qc.invalidateQueries({ queryKey: ['advisor-affiliates'] });
      await qc.invalidateQueries({ queryKey: ['company-affiliate-assignments'] });
      await qc.invalidateQueries({ queryKey: ['admin-affiliate-report'] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save advisor affiliate'),
  });

  const summary = useMemo(() => {
    const active = affiliates.filter((a) => a.status === 'active').length;
    const referred = report.length;
    const upgraded = report.filter((r) => ['partner', 'pro', 'paid'].includes(String(r.subscription_tier))).length;
    const commissions = report.reduce((sum, row) => sum + Number(row.estimated_monthly_commission ?? 0), 0);
    return { active, referred, upgraded, commissions };
  }, [affiliates, report]);

  const startEdit = (row: AdvisorAffiliate) => {
    const assignment = assignments.find((a) => a.affiliate_id === row.id && a.active);
    setEditingId(row.id);
    setForm({
      name: row.name,
      email: row.email ?? '',
      company: row.company ?? '',
      company_id: assignment?.company_id ?? '',
      is_default_company_affiliate: assignment?.is_default ?? false,
      referral_code: row.referral_code,
      commission_rate: String(row.commission_rate ?? 20),
      status: row.status,
      notes: row.notes ?? '',
    });
  };

  const copyLink = async (code: string) => {
    const link = referralLink(code);
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Referral link copied');
    } catch {
      toast.info(link);
    }
  };

  const copyCompanyInviteLink = async (companyId: string, code: string) => {
    const { data: token, error } = await supabase.rpc('get_company_invite_token', { _company_id: companyId });
    if (error || !token) {
      toast.error('Could not fetch company invite token.');
      return;
    }
    const link = buildInviteUrl(token as string, code);
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Company + advisor invite link copied');
    } catch {
      toast.info(link);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const loading = affiliatesLoading || reportLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Advisor Affiliate Program
          </CardTitle>
          <CardDescription>
            Option A setup: RPRx captures referral codes, carries them into the GHL checkout URL, and reports leads/conversions for manual commission review.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Active advisors</p>
            <p className="text-2xl font-semibold">{summary.active}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Attributed leads</p>
            <p className="text-2xl font-semibold">{summary.referred}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Paid conversions</p>
            <p className="text-2xl font-semibold">{summary.upgraded}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Est. monthly commission</p>
            <p className="text-2xl font-semibold">{money(summary.commissions)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit advisor affiliate' : 'Add advisor affiliate'}</CardTitle>
          <CardDescription>
            Give each advisor a code like <code>smith-tax</code>. Their share link becomes <code>{PROD_BASE}/assessment?ref=smith-tax</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Advisor name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, referral_code: f.referral_code || slugifyCode(e.target.value) }))} placeholder="Jane Smith" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="advisor@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Company assignment</Label>
              <Select
                value={form.company_id || 'none'}
                onValueChange={(value) => {
                  const companyId = value === 'none' ? '' : value;
                  const companyName = companies.find((c) => c.id === companyId)?.name ?? '';
                  setForm((f) => ({ ...f, company_id: companyId, company: companyName || f.company, is_default_company_affiliate: companyId ? f.is_default_company_affiliate : false }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Optional company" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No company assignment</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Use this to generate /join company links with this advisor's code.</p>
            </div>
            <div className="space-y-2">
              <Label>Referral code</Label>
              <Input value={form.referral_code} onChange={(e) => setForm((f) => ({ ...f, referral_code: slugifyCode(e.target.value) }))} placeholder="smith-tax" />
            </div>
            <div className="space-y-2">
              <Label>Commission %</Label>
              <Input type="number" min="0" max="100" step="0.01" value={form.commission_rate} onChange={(e) => setForm((f) => ({ ...f, commission_rate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm((f) => ({ ...f, status: value as AffiliateStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 rounded-md border p-3 text-sm md:col-span-3">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={form.is_default_company_affiliate}
                disabled={!form.company_id}
                onChange={(e) => setForm((f) => ({ ...f, is_default_company_affiliate: e.target.checked }))}
              />
              Make this the default affiliate when the selected company's invite link is used without an individual advisor ref.
            </label>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Payment notes, niche, territory, agreement details..." />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => saveAffiliate.mutate(form)} disabled={saveAffiliate.isPending}>
              {saveAffiliate.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {editingId ? 'Save affiliate' : 'Create affiliate'}
            </Button>
            {editingId && <Button variant="outline" onClick={resetForm}>Cancel edit</Button>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Advisor links</CardTitle>
            <CardDescription>Share these links with advisor partners. The app stores the first referral touch for 90 days and passes the code into GHL checkout.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => downloadRows(affiliates as unknown as Record<string, unknown>[], 'advisor_affiliates.csv')}>
            <Download className="mr-2 h-4 w-4" /> Export advisors
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Advisor</TableHead>
                    <TableHead>Code / Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Attributed</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {affiliates.map((a) => {
                    const rows = report.filter((r) => r.affiliate_id?.toLowerCase() === a.referral_code.toLowerCase());
                    const paid = rows.filter((r) => ['partner', 'pro', 'paid'].includes(String(r.subscription_tier))).length;
                    const assignment = assignments.find((row) => row.affiliate_id === a.id && row.active);
                    const assignedCompany = companies.find((company) => company.id === assignment?.company_id);
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-medium">{a.name}</div>
                          <div className="text-xs text-muted-foreground">{assignedCompany?.name || a.company || a.email || '—'}{assignment?.is_default ? ' · default' : ''}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs">{a.referral_code}</div>
                          <a className="text-xs text-primary hover:underline" href={referralLink(a.referral_code)} target="_blank" rel="noopener noreferrer">
                            {referralLink(a.referral_code)}
                          </a>
                        </TableCell>
                        <TableCell><Badge variant={a.status === 'active' ? 'default' : 'outline'}>{a.status}</Badge></TableCell>
                        <TableCell>{Number(a.commission_rate).toFixed(2)}%</TableCell>
                        <TableCell>{rows.length}</TableCell>
                        <TableCell>{paid}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => copyLink(a.referral_code)} title="Copy legacy assessment referral link"><Copy className="h-4 w-4" /></Button>
                            {assignedCompany && (
                              <Button variant="ghost" size="sm" onClick={() => copyCompanyInviteLink(assignedCompany.id, a.referral_code)} title="Copy company invite link with advisor ref">
                                Copy join link
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => window.open(referralLink(a.referral_code), '_blank', 'noopener,noreferrer')} title="Open referral link"><ExternalLink className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => startEdit(a)}>Edit</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {affiliates.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground"><Plus className="mx-auto mb-2 h-5 w-5" />Add your first advisor affiliate above.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Attribution and commission review</CardTitle>
            <CardDescription>Use this to reconcile RPRx referrals with GHL subscriptions/products before paying advisor commissions.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => downloadRows(report as unknown as Record<string, unknown>[], 'advisor_affiliate_report.csv')}>
            <Download className="mr-2 h-4 w-4" /> Export report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Captured</TableHead>
                  <TableHead>Advisor</TableHead>
                  <TableHead>Referred user</TableHead>
                  <TableHead>Landing</TableHead>
                  <TableHead>Tier / Status</TableHead>
                  <TableHead>GHL product</TableHead>
                  <TableHead>Est. commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.map((row) => (
                  <TableRow key={`${row.attribution_user_id}-${row.captured_at}`}>
                    <TableCell>{formatDate(row.captured_at)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{row.affiliate_name || row.affiliate_id}</div>
                      <div className="text-xs text-muted-foreground">{row.affiliate_company || row.affiliate_email || 'Unmatched code'}</div>
                    </TableCell>
                    <TableCell>
                      <div>{row.referred_user_name || row.attribution_user_id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">{row.referred_user_company || row.referred_user_phone || '—'}</div>
                    </TableCell>
                    <TableCell className="text-xs">{row.landing_path || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={['partner', 'pro', 'paid'].includes(String(row.subscription_tier)) ? 'default' : 'outline'}>{row.subscription_tier || 'free'}</Badge>
                      <div className="text-xs text-muted-foreground">{row.subscription_status || 'not upgraded'}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{row.ghl_product_id || '—'}</TableCell>
                    <TableCell>{money(row.estimated_monthly_commission)}</TableCell>
                  </TableRow>
                ))}
                {report.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No attributed users yet. Send an advisor referral link and have the user sign up to populate this report.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
