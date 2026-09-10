import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, Database, Users, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { downloadCSV, fetchFullTable, fetchFullTableViaEdge } from '@/lib/csvExport';
import { supabase } from '@/integrations/supabase/client';
import { DataImportDialog } from './DataImportDialog';

interface TableDef {
  name: string;
  label: string;
  description: string;
  needsEdge: boolean; // true = user data behind RLS, use edge function
  rpc?: string; // optional RPC instead of table
}

const CONFIG_TABLES: TableDef[] = [
  { name: 'strategy_catalog_v2', label: 'Strategy Catalog', description: 'Canonical strategy catalog (single source of truth for the engine and admin UI)', needsEdge: false },
  { name: 'prompt_engine_config', label: 'Prompt Engine Config', description: 'Scoring weights & output settings for Strategy Engine V2', needsEdge: false },
  { name: 'assessment_questions', label: 'Assessment Questions', description: 'Core assessment questions', needsEdge: false },
  { name: 'deep_dive_questions', label: 'Deep Dive Questions', description: 'Horseman deep dive questions', needsEdge: false },
  { name: 'badge_definitions', label: 'Badge Definitions', description: 'Gamification badges', needsEdge: false },
  { name: 'onboarding_content', label: 'Onboarding Content', description: '30-day journey content', needsEdge: false },
  { name: 'prompt_templates', label: 'Prompt Templates', description: 'AI system prompts', needsEdge: true },
  { name: 'feature_flags', label: 'Feature Flags', description: 'Global toggles', needsEdge: false },
  { name: 'page_help_content', label: 'Page Help', description: 'Contextual help content', needsEdge: false },
  { name: 'knowledge_base', label: 'Knowledge Base', description: 'AI knowledge documents', needsEdge: true },
  { name: 'dashboard_card_config', label: 'Dashboard Config', description: 'Dashboard card layout', needsEdge: false },
  { name: 'sidebar_nav_config', label: 'Sidebar Nav Config', description: 'Navigation visibility', needsEdge: false },
  { name: 'activity_xp_config', label: 'Activity XP Config', description: 'XP reward definitions', needsEdge: false },
  { name: 'user_guide_sections', label: 'User Guide Sections', description: 'User manual content', needsEdge: false },
  { name: 'partner_categories', label: 'Partner Categories', description: 'Partner category list', needsEdge: false },
  { name: 'partners', label: 'Partners', description: 'Partner directory', needsEdge: false },
  { name: 'company_partner_visibility', label: 'Company Partner Visibility', description: 'Per-company partner toggles', needsEdge: true },
  { name: 'advisor_affiliates', label: 'Advisor Affiliates', description: 'Advisor referral codes and commission settings', needsEdge: false },
  { name: 'wizard_step_content', label: 'Wizard Copy', description: 'Profile wizard step text', needsEdge: false },
];

const USER_TABLES: TableDef[] = [
  { name: 'admin_list_users', label: 'Users (Full Profile)', description: 'Profiles + auth data via RPC', needsEdge: false, rpc: 'admin_list_users' },
  { name: 'user_assessments', label: 'User Assessments', description: 'Completed assessments', needsEdge: true },
  { name: 'assessment_responses', label: 'Assessment Responses', description: 'Individual question answers', needsEdge: true },
  { name: 'user_deep_dives', label: 'Deep Dives', description: 'Completed deep dives', needsEdge: true },
  { name: 'user_active_strategies', label: 'Active Strategies', description: 'User-activated strategies', needsEdge: true },
  { name: 'saved_plans', label: 'Saved Plans', description: 'AI-generated plan saves', needsEdge: true },
  { name: 'user_badges', label: 'User Badges', description: 'Earned badges', needsEdge: true },
  { name: 'user_activity_log', label: 'Activity Log', description: 'XP activity history', needsEdge: true },
  { name: 'user_onboarding_progress', label: 'Onboarding Progress', description: '30-day journey progress', needsEdge: true },
  { name: 'conversations', label: 'Conversations', description: 'Chat conversation headers', needsEdge: true },
  { name: 'messages', label: 'Messages', description: 'Chat messages', needsEdge: true },
  { name: 'companies', label: 'Companies', description: 'Organization records', needsEdge: true },
  { name: 'company_members', label: 'Company Members', description: 'Org membership', needsEdge: true },
  { name: 'company_affiliates', label: 'Company Affiliates', description: 'Company advisor/default affiliate assignments', needsEdge: true },
  { name: 'debt_journeys', label: 'Debt Journeys', description: 'Debt eliminator journeys', needsEdge: true },
  { name: 'user_debts', label: 'User Debts', description: 'Individual debts', needsEdge: true },
  { name: 'debt_payments', label: 'Debt Payments', description: 'Payment history', needsEdge: true },
  { name: 'page_feedback', label: 'Page Feedback', description: 'User feedback/ratings', needsEdge: true },
  { name: 'user_subscriptions', label: 'Subscriptions', description: 'Subscription tiers', needsEdge: true },
  { name: 'user_roles', label: 'User Roles', description: 'Admin/moderator roles', needsEdge: true },
  { name: 'affiliate_attributions', label: 'Affiliate Attributions', description: 'Captured referral attribution records', needsEdge: true },
];

export function DataExportTab() {
  const [loading, setLoading] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [importTable, setImportTable] = useState<TableDef | null>(null);

  const handleExport = async (table: TableDef) => {
    setLoading(table.name);
    try {
      let data: Record<string, unknown>[];

      if (table.rpc) {
        const { data: rpcData, error } = await supabase.rpc(table.rpc as any);
        if (error) throw error;
        data = (rpcData || []) as Record<string, unknown>[];
      } else if (table.needsEdge) {
        data = await fetchFullTableViaEdge(table.name);
      } else {
        data = await fetchFullTable(table.name);
      }

      if (data.length === 0) {
        toast.info(`${table.label}: no data to export`);
        return;
      }

      downloadCSV(data, `${table.name}.csv`);
      toast.success(`Exported ${data.length} rows from ${table.label}`);
    } catch (err) {
      toast.error(`Failed to export ${table.label}: ${(err as Error).message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    const allTables = [...CONFIG_TABLES, ...USER_TABLES];
    let exported = 0;
    let failed = 0;

    for (const table of allTables) {
      try {
        let data: Record<string, unknown>[];
        if (table.rpc) {
          const { data: rpcData, error } = await supabase.rpc(table.rpc as any);
          if (error) throw error;
          data = (rpcData || []) as Record<string, unknown>[];
        } else if (table.needsEdge) {
          data = await fetchFullTableViaEdge(table.name);
        } else {
          data = await fetchFullTable(table.name);
        }

        if (data.length > 0) {
          downloadCSV(data, `${table.name}.csv`);
          exported++;
        }
      } catch {
        failed++;
      }
      // Small delay to avoid browser download throttling
      await new Promise(r => setTimeout(r, 300));
    }

    setDownloadingAll(false);
    if (failed > 0) {
      toast.warning(`Exported ${exported} tables, ${failed} failed`);
    } else {
      toast.success(`Exported ${exported} tables`);
    }
  };

  const renderTableRow = (table: TableDef, allowImport: boolean) => (
    <div key={table.name} className="flex items-center justify-between py-2 px-3 rounded-md border">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{table.label}</span>
          {table.needsEdge && <Badge variant="outline" className="text-xs">RLS bypass</Badge>}
          {table.rpc && <Badge variant="secondary" className="text-xs">RPC</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{table.description}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport(table)}
          disabled={loading === table.name || downloadingAll}
          className="gap-1"
        >
          {loading === table.name ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          CSV
        </Button>
        {allowImport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportTable(table)}
            disabled={loading === table.name || downloadingAll}
            className="gap-1"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">
          Download any table as CSV to feed into external LLMs for prompt refinement.
        </p>
        <Button
          onClick={handleDownloadAll}
          disabled={downloadingAll}
          className="gap-1"
        >
          {downloadingAll ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download All Tables
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" /> Back Office / Configuration
          </CardTitle>
          <CardDescription>Strategy definitions, questions, prompts, and system config</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {CONFIG_TABLES.map((t) => renderTableRow(t, true))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> User Data
          </CardTitle>
          <CardDescription>Profiles, assessments, strategies, chat history, and more (export only)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {USER_TABLES.map((t) => renderTableRow(t, false))}
        </CardContent>
      </Card>

      {importTable && (
        <DataImportDialog
          open={!!importTable}
          onOpenChange={(open) => !open && setImportTable(null)}
          tableName={importTable.name}
          tableLabel={importTable.label}
        />
      )}
    </div>
  );
}
