import { useState, useMemo } from 'react';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useAdminStrategies, useCreateStrategy, useUpdateStrategy, useDeleteStrategy, useDeleteStrategies, useImportStrategies, useBulkToggleActive, type StrategyRow, type StrategyInput } from '@/hooks/useAdminStrategies';
import { Checkbox } from '@/components/ui/checkbox';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Loader2, Shield, Users, Award, HelpCircle, Layers, BarChart3, Download, Upload, ArrowUpDown, ArrowUp, ArrowDown, MessageSquare, LayoutDashboard, GraduationCap, Zap, Building2, Star, BookOpen, PanelLeft, Database, Crown } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BadgesTab } from '@/components/admin/BadgesTab';
import { AssessmentQuestionsTab } from '@/components/admin/AssessmentQuestionsTab';
import { UsersTab } from '@/components/admin/UsersTab';
import { DeepDiveQuestionsTab } from '@/components/admin/DeepDiveQuestionsTab';
import { AnalyticsTab } from '@/components/admin/AnalyticsTab';
import { PromptTemplatesTab } from '@/components/admin/PromptTemplatesTab';
import { DashboardTab } from '@/components/admin/DashboardTab';
import { OnboardingTab } from '@/components/admin/OnboardingTab';
import { PageHelpTab } from '@/components/admin/PageHelpTab';
import { ActivityXpTab } from '@/components/admin/ActivityXpTab';
import { WizardCopyTab } from '@/components/admin/WizardCopyTab';
import { FeaturesTab } from '@/components/admin/FeaturesTab';
import { GHLFieldMappingTab } from '@/components/admin/GHLFieldMappingTab';
import { CompaniesTab } from '@/components/admin/CompaniesTab';
import { FeedbackTab } from '@/components/admin/FeedbackTab';
import { SupportRequestsTab } from '@/components/admin/SupportRequestsTab';
import { UserGuideTab } from '@/components/admin/UserGuideTab';
import { KnowledgeBaseTab } from '@/components/admin/KnowledgeBaseTab';
import { NavigationTab } from '@/components/admin/NavigationTab';
import { PartnersTab } from '@/components/admin/PartnersTab';
import { LibraryTab } from '@/components/admin/LibraryTab';
import { DataExportTab } from '@/components/admin/DataExportTab';
import { AssistantEngineTab } from '@/components/admin/AssistantEngineTab';
import { AssistantQualityTab } from '@/components/admin/AssistantQualityTab';
import { CoursesTab } from '@/components/admin/CoursesTab';
import { ProfileFieldsTab } from '@/components/admin/ProfileFieldsTab';
import { GhlProductMapTab } from '@/components/admin/GhlProductMapTab';
import { LandingPageTab } from '@/components/admin/LandingPageTab';
import { CheckoutLinksTab } from '@/components/admin/CheckoutLinksTab';
import { MembershipAccessTab } from '@/components/admin/MembershipAccessTab';
import { AdvisorAffiliatesTab } from '@/components/admin/AdvisorAffiliatesTab';




const HORSEMAN_TYPES = ['interest', 'taxes', 'insurance', 'education'];
const DIFFICULTIES = ['easy', 'moderate', 'advanced'];

const emptyForm: StrategyInput = {
  id: '',
  name: '',
  description: '',
  horseman_type: 'taxes',
  difficulty: 'moderate',
  estimated_impact: '',
  tax_return_line_or_area: '',
  financial_goals: [],
};

export default function AdminPanel() {
  const { data: strategies = [], isLoading } = useAdminStrategies();
  const createStrategy = useCreateStrategy();
  const updateStrategy = useUpdateStrategy();
  const deleteStrategy = useDeleteStrategy();
  const deleteStrategies = useDeleteStrategies();
  const importStrategies = useImportStrategies();
  const bulkToggleActive = useBulkToggleActive();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StrategyInput>(emptyForm);
  const [goalsInput, setGoalsInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sort state
  type SortField = 'id' | 'name' | 'horseman_type' | 'difficulty' | 'tax_return_line_or_area' | 'sort_order' | 'is_active';
  const [sortField, setSortField] = useState<SortField>('horseman_type');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedStrategies = useMemo(() => {
    const sorted = [...strategies].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'boolean') return (aVal === bVal ? 0 : aVal ? -1 : 1);
      if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
      return String(aVal).localeCompare(String(bVal));
    });
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [strategies, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Import error state
  interface ImportError { row: number; id: string; field: string; message: string }
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importErrorsOpen, setImportErrorsOpen] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setGoalsInput('');
    setDialogOpen(true);
  };

  const openEdit = (row: StrategyRow) => {
    setEditingId(row.id);
    setForm({
      id: row.id,
      name: row.name,
      description: row.description,
      horseman_type: row.horseman_type,
      difficulty: row.difficulty,
      estimated_impact: row.estimated_impact || '',
      tax_return_line_or_area: row.tax_return_line_or_area || '',
      financial_goals: row.financial_goals || [],
    });
    setGoalsInput((row.financial_goals || []).join(', '));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.id || !form.name) {
      toast.error('ID and Name are required');
      return;
    }
    const goals = goalsInput.split(',').map(g => g.trim()).filter(Boolean);
    const payload = { ...form, financial_goals: goals };

    try {
      if (editingId) {
        await updateStrategy.mutateAsync(payload);
        toast.success('Strategy updated');
      } else {
        await createStrategy.mutateAsync(payload);
        toast.success('Strategy created');
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStrategy.mutateAsync(deleteId);
      toast.success('Strategy deleted');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to delete');
    }
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    try {
      await deleteStrategies.mutateAsync(Array.from(selectedIds));
      toast.success(`${selectedIds.size} strategies deleted`);
      setSelectedIds(new Set());
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to delete');
    }
    setBulkDeleteOpen(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === strategies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(strategies.map(s => s.id)));
    }
  };

  // CSV helpers
  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const handleExportCSV = () => {
    const rows = selectedIds.size > 0 ? strategies.filter(s => selectedIds.has(s.id)) : strategies;
    const headers = ['id','name','description','horseman_type','difficulty','estimated_impact','tax_return_line_or_area','financial_goals','sort_order','is_active'];
    const csvLines = [headers.join(',')];
    for (const s of rows) {
      csvLines.push([
        escapeCSV(s.id),
        escapeCSV(s.name),
        escapeCSV(s.description),
        escapeCSV(s.horseman_type),
        escapeCSV(s.difficulty),
        escapeCSV(s.estimated_impact || ''),
        escapeCSV(s.tax_return_line_or_area || ''),
        escapeCSV((s.financial_goals || []).join(';')),
        String(s.sort_order),
        String(s.is_active),
      ].join(','));
    }
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'strategies.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} strategies`);
  };

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let current = '';
    let inQuotes = false;
    let row: string[] = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"' && text[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { row.push(current); current = ''; }
        else if (ch === '\n' || ch === '\r') {
          if (ch === '\r' && text[i + 1] === '\n') i++;
          row.push(current); current = '';
          if (row.some(c => c.trim())) rows.push(row);
          row = [];
        } else { current += ch; }
      }
    }
    row.push(current);
    if (row.some(c => c.trim())) rows.push(row);
    return rows;
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length < 2) { toast.error('CSV has no data rows'); return; }
        const headers = parsed[0].map(h => h.trim().toLowerCase());
        const idIdx = headers.indexOf('id');
        const nameIdx = headers.indexOf('name');
        const descIdx = headers.indexOf('description');
        const horseIdx = headers.indexOf('horseman_type');
        const diffIdx = headers.indexOf('difficulty');
        if (idIdx < 0 || nameIdx < 0 || descIdx < 0 || horseIdx < 0 || diffIdx < 0) {
          toast.error('CSV missing required columns: id, name, description, horseman_type, difficulty');
          return;
        }
        const impactIdx = headers.indexOf('estimated_impact');
        const taxIdx = headers.indexOf('tax_return_line_or_area');
        const goalsIdx = headers.indexOf('financial_goals');
        const orderIdx = headers.indexOf('sort_order');
        const activeIdx = headers.indexOf('is_active');

        const errors: ImportError[] = [];
        const validItems: StrategyInput[] = [];
        const seenIds = new Set<string>();

        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i];
          const rowNum = i + 1;
          const id = row[idIdx]?.trim() || '';
          const name = row[nameIdx]?.trim() || '';
          const description = row[descIdx]?.trim() || '';
          const horseman = row[horseIdx]?.trim().toLowerCase() || '';
          const diff = row[diffIdx]?.trim().toLowerCase() || '';
          let hasError = false;

          if (!id) { errors.push({ row: rowNum, id: id || '(empty)', field: 'id', message: 'ID is required' }); hasError = true; }
          if (!name) { errors.push({ row: rowNum, id: id || '(empty)', field: 'name', message: 'Name is required' }); hasError = true; }
          if (!description) { errors.push({ row: rowNum, id: id || '(empty)', field: 'description', message: 'Description is required' }); hasError = true; }
          if (!HORSEMAN_TYPES.includes(horseman)) { errors.push({ row: rowNum, id: id || '(empty)', field: 'horseman_type', message: `Invalid horseman type: "${horseman}"` }); hasError = true; }
          if (!DIFFICULTIES.includes(diff)) { errors.push({ row: rowNum, id: id || '(empty)', field: 'difficulty', message: `Invalid difficulty: "${diff}"` }); hasError = true; }
          if (id && seenIds.has(id)) { errors.push({ row: rowNum, id, field: 'id', message: 'Duplicate ID in CSV' }); hasError = true; }

          if (id) seenIds.add(id);

          if (!hasError) {
            validItems.push({
              id,
              name,
              description,
              horseman_type: horseman,
              difficulty: diff,
              estimated_impact: impactIdx >= 0 ? row[impactIdx]?.trim() : undefined,
              tax_return_line_or_area: taxIdx >= 0 ? row[taxIdx]?.trim() : undefined,
              financial_goals: goalsIdx >= 0 ? (row[goalsIdx]?.trim() || '').split(';').filter(Boolean) : [],
              sort_order: orderIdx >= 0 ? parseInt(row[orderIdx]?.trim() || '0', 10) || 0 : 0,
              is_active: activeIdx >= 0 ? row[activeIdx]?.trim().toLowerCase() !== 'false' : true,
            });
          }
        }

        // Upsert valid rows
        let dbImported = 0;
        if (validItems.length > 0) {
          try {
            await importStrategies.mutateAsync(validItems);
            dbImported = validItems.length;
          } catch {
            // Batch failed — try individual upserts
            for (const item of validItems) {
              try {
                await importStrategies.mutateAsync([item]);
                dbImported++;
              } catch (itemErr: unknown) {
                errors.push({ row: 0, id: item.id, field: 'database', message: (itemErr as Error).message || 'DB insert failed' });
              }
            }
          }
        }

        const totalRows = parsed.length - 1;
        if (errors.length > 0) {
          setImportErrors(errors);
          setImportErrorsOpen(true);
          toast.warning(`Imported ${dbImported} of ${totalRows} strategies. ${errors.length} error(s) found.`);
        } else {
          toast.success(`Imported ${dbImported} strategies successfully`);
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Import failed');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const allActive = strategies.length > 0 && strategies.every(s => s.is_active);
  const noneActive = strategies.length > 0 && strategies.every(s => !s.is_active);
  const handleMasterToggle = async (checked: boolean) => {
    try {
      await bulkToggleActive.mutateAsync(checked);
      toast.success(checked ? 'All strategies activated' : 'All strategies deactivated');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to toggle');
    }
  };



  const horsemanColor = (h: string) => {
    const map: Record<string, string> = {
      interest: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      taxes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      insurance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      education: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };
    return map[h] || '';
  };

  return (
    <AuthenticatedLayout title="Admin Panel">
      <div className="p-4 md:p-6 space-y-6 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </div>
          <a
            href="/admin/insights"
            className="text-sm font-medium text-primary hover:underline"
          >
            → Insights Dashboard
          </a>
        </div>

        <Tabs defaultValue="strategies">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto py-1">
            <TabsTrigger value="strategies" className="gap-1">
              <Shield className="h-4 w-4" /> Strategies
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-1">
              <Award className="h-4 w-4" /> Badges
            </TabsTrigger>
            <TabsTrigger value="xp-activities" className="gap-1">
              <Zap className="h-4 w-4" /> XP Activities
            </TabsTrigger>
            <TabsTrigger value="assessment-questions" className="gap-1">
              <HelpCircle className="h-4 w-4" /> Assessment Q's
            </TabsTrigger>
            <TabsTrigger value="deepdive-questions" className="gap-1">
              <Layers className="h-4 w-4" /> Deep Dive Q's
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="prompts" className="gap-1">
              <MessageSquare className="h-4 w-4" /> Prompts
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="gap-1">
              <GraduationCap className="h-4 w-4" /> Onboarding
            </TabsTrigger>
            <TabsTrigger value="page-help" className="gap-1">
              <HelpCircle className="h-4 w-4" /> Page Help
            </TabsTrigger>
            <TabsTrigger value="wizard-copy" className="gap-1">
              <GraduationCap className="h-4 w-4" /> Wizard Copy
            </TabsTrigger>
            <TabsTrigger value="profile-fields" className="gap-1">
              <Users className="h-4 w-4" /> Profile Fields
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-1">
              <Zap className="h-4 w-4" /> Features
            </TabsTrigger>
            <TabsTrigger value="membership-access" className="gap-1">
              <Crown className="h-4 w-4" /> Membership Access
            </TabsTrigger>
            <TabsTrigger value="advisor-affiliates" className="gap-1">
              <Users className="h-4 w-4" /> Advisor Affiliates
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-1">
              <Building2 className="h-4 w-4" /> Companies
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-1">
              <Star className="h-4 w-4" /> Feedback
            </TabsTrigger>
            <TabsTrigger value="support" className="gap-1">
              <HelpCircle className="h-4 w-4" /> Support
            </TabsTrigger>
            <TabsTrigger value="user-guide" className="gap-1">
              <HelpCircle className="h-4 w-4" /> User Guide
            </TabsTrigger>
            <TabsTrigger value="knowledge-base" className="gap-1">
              <BookOpen className="h-4 w-4" /> Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="navigation" className="gap-1">
              <PanelLeft className="h-4 w-4" /> Navigation
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-1">
              <BookOpen className="h-4 w-4" /> Courses
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-1">
              <Building2 className="h-4 w-4" /> Partners
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-1">
              <BookOpen className="h-4 w-4" /> Library
            </TabsTrigger>
            <TabsTrigger value="data-export" className="gap-1">
              <Database className="h-4 w-4" /> Data Export
            </TabsTrigger>
            <TabsTrigger value="assistant-engine" className="gap-1">
              <MessageSquare className="h-4 w-4" /> Assistant Engine
            </TabsTrigger>
            <TabsTrigger value="assistant-quality" className="gap-1">
              <BarChart3 className="h-4 w-4" /> Assistant Quality
            </TabsTrigger>
            <TabsTrigger value="ghl-mapping" className="gap-1">
              <Database className="h-4 w-4" /> GHL Mapping
            </TabsTrigger>
            <TabsTrigger value="ghl-products" className="gap-1">
              <Database className="h-4 w-4" /> GHL Products
            </TabsTrigger>
            <TabsTrigger value="checkout-links" className="gap-1">
              <Database className="h-4 w-4" /> Checkout Links
            </TabsTrigger>
            <TabsTrigger value="landing-page" className="gap-1">
              <LayoutDashboard className="h-4 w-4" /> Landing Page
            </TabsTrigger>
          </TabsList>

          <TabsContent value="landing-page" className="space-y-4">
            <LandingPageTab />
          </TabsContent>

          <TabsContent value="membership-access" className="space-y-4">
            <MembershipAccessTab />
          </TabsContent>

          <TabsContent value="advisor-affiliates" className="space-y-4">
            <AdvisorAffiliatesTab />
          </TabsContent>


          {/* ===== STRATEGIES TAB ===== */}
          <TabsContent value="strategies" className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="text-muted-foreground">
                    Total: <span className="font-medium text-foreground">{strategies.length}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Active: <span className="font-medium text-foreground">{strategies.filter(s => s.is_active).length}</span>
                  </span>
                  {selectedIds.size > 0 && (
                    <span className="text-muted-foreground">
                      Selected: <span className="font-medium text-foreground">{selectedIds.size}</span>
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">Source: strategy_catalog_v2</span>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <Label htmlFor="master-active" className="text-sm">Activate all</Label>
                <Switch
                  id="master-active"
                  checked={allActive}
                  onCheckedChange={handleMasterToggle}
                  disabled={bulkToggleActive.isPending || strategies.length === 0}
                  className={!allActive && !noneActive ? 'opacity-60' : ''}
                />
              </div>
              <div className="flex-1" />
              {selectedIds.size > 0 && (
                <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Selected ({selectedIds.size})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <label>
                <Button variant="outline" size="sm" className="gap-1" asChild>
                  <span><Upload className="h-4 w-4" /> Import CSV</span>
                </Button>
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
              </label>
              <Button onClick={openCreate} className="gap-1">
                <Plus className="h-4 w-4" /> Add Strategy
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-[1000px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={strategies.length > 0 && selectedIds.size === strategies.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-24 cursor-pointer select-none" onClick={() => handleSort('id')}>
                        <span className="flex items-center">ID <SortIcon field="id" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
                        <span className="flex items-center">Name <SortIcon field="name" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('horseman_type')}>
                        <span className="flex items-center">Horseman <SortIcon field="horseman_type" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('difficulty')}>
                        <span className="flex items-center">Difficulty <SortIcon field="difficulty" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('tax_return_line_or_area')}>
                        <span className="flex items-center">Tax Line / Area <SortIcon field="tax_return_line_or_area" /></span>
                      </TableHead>
                      <TableHead>Financial Goals</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort('sort_order')}>
                        <span className="flex items-center">Order <SortIcon field="sort_order" /></span>
                      </TableHead>
                      <TableHead className="w-20 cursor-pointer select-none" onClick={() => handleSort('is_active')}>
                        <span className="flex items-center">Active <SortIcon field="is_active" /></span>
                      </TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStrategies.map((s) => (
                      <TableRow key={s.id} data-state={selectedIds.has(s.id) ? 'selected' : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(s.id)}
                            onCheckedChange={() => toggleSelect(s.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.id}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={horsemanColor(s.horseman_type)}>
                            {s.horseman_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{s.difficulty}</TableCell>
                        <TableCell className="text-sm">{s.tax_return_line_or_area || '—'}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {(s.financial_goals || []).join(', ') || '—'}
                        </TableCell>
                        <TableCell className="text-xs">{s.sort_order}</TableCell>
                        <TableCell>
                          <Switch
                            checked={s.is_active}
                            onCheckedChange={(checked) =>
                              updateStrategy.mutate({ id: s.id, is_active: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {strategies.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No strategies found. Add your first one!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="users" className="space-y-4">
            <UsersTab />
          </TabsContent>
          {/* ===== BADGES TAB ===== */}
          <TabsContent value="badges" className="space-y-4">
            <BadgesTab />
          </TabsContent>
          {/* ===== XP ACTIVITIES TAB ===== */}
          <TabsContent value="xp-activities" className="space-y-4">
            <ActivityXpTab />
          </TabsContent>

          {/* ===== ASSESSMENT QUESTIONS TAB ===== */}
          <TabsContent value="assessment-questions" className="space-y-4">
            <AssessmentQuestionsTab />
          </TabsContent>

          {/* ===== DEEP DIVE QUESTIONS TAB ===== */}
          <TabsContent value="deepdive-questions" className="space-y-4">
            <DeepDiveQuestionsTab />
          </TabsContent>

          {/* ===== ANALYTICS TAB ===== */}
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsTab />
          </TabsContent>

          {/* ===== PROMPT TEMPLATES TAB ===== */}
          <TabsContent value="prompts" className="space-y-4">
            <PromptTemplatesTab />
          </TabsContent>

          {/* ===== DASHBOARD CONFIG TAB ===== */}
          <TabsContent value="dashboard" className="space-y-4">
            <DashboardTab />
          </TabsContent>

          {/* ===== ONBOARDING TAB ===== */}
          <TabsContent value="onboarding" className="space-y-4">
            <OnboardingTab />
          </TabsContent>

          {/* ===== PAGE HELP TAB ===== */}
          <TabsContent value="page-help" className="space-y-4">
            <PageHelpTab />
          </TabsContent>

          {/* ===== WIZARD COPY TAB ===== */}
          <TabsContent value="wizard-copy" className="space-y-4">
            <WizardCopyTab />
          </TabsContent>

          {/* ===== PROFILE FIELDS TAB ===== */}
          <TabsContent value="profile-fields" className="space-y-4">
            <ProfileFieldsTab />
          </TabsContent>

          {/* ===== FEATURES TAB ===== */}
          <TabsContent value="features" className="space-y-4">
            <FeaturesTab />
          </TabsContent>

          {/* ===== GHL MAPPING TAB ===== */}
          <TabsContent value="ghl-mapping" className="space-y-4">
            <GHLFieldMappingTab />
          </TabsContent>

          {/* ===== COMPANIES TAB ===== */}
          <TabsContent value="companies" className="space-y-4">
            <CompaniesTab />
          </TabsContent>

          {/* ===== FEEDBACK TAB ===== */}
          <TabsContent value="feedback" className="space-y-4">
            <FeedbackTab />
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <SupportRequestsTab />
          </TabsContent>

          {/* ===== USER GUIDE TAB ===== */}
          <TabsContent value="user-guide" className="space-y-4">
            <UserGuideTab />
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <CoursesTab />
          </TabsContent>

          {/* ===== NAVIGATION TAB ===== */}
          <TabsContent value="navigation" className="space-y-4">
            <NavigationTab />
          </TabsContent>

          {/* ===== PARTNERS TAB ===== */}
          <TabsContent value="partners" className="space-y-4">
            <PartnersTab />
          </TabsContent>

          {/* ===== LIBRARY TAB ===== */}
          <TabsContent value="library" className="space-y-4">
            <LibraryTab />
          </TabsContent>

          {/* ===== DATA EXPORT TAB ===== */}
          <TabsContent value="data-export" className="space-y-4">
            <DataExportTab />
          </TabsContent>

          {/* ===== KNOWLEDGE BASE TAB ===== */}
          <TabsContent value="knowledge-base" className="space-y-4">
            <KnowledgeBaseTab />
          </TabsContent>

          {/* ===== ASSISTANT ENGINE TAB ===== */}
          <TabsContent value="assistant-engine" className="space-y-4">
            <AssistantEngineTab />
          </TabsContent>

          {/* ===== ASSISTANT QUALITY TAB ===== */}
          <TabsContent value="assistant-quality" className="space-y-4">
            <AssistantQualityTab />
          </TabsContent>

          {/* ===== GHL PRODUCTS TAB ===== */}
          <TabsContent value="ghl-products" className="space-y-4">
            <GhlProductMapTab />
          </TabsContent>

          {/* ===== CHECKOUT LINKS TAB ===== */}
          <TabsContent value="checkout-links" className="space-y-4">
            <CheckoutLinksTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create / Edit Strategy Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Strategy' : 'Add Strategy'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Strategy ID</Label>
                <Input
                  placeholder="e.g. T-1"
                  value={form.id}
                  disabled={!!editingId}
                  onChange={(e) => setForm(f => ({ ...f, id: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Horseman Type</Label>
                <Select value={form.horseman_type} onValueChange={(v) => setForm(f => ({ ...f, horseman_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HORSEMAN_TYPES.map(h => (
                      <SelectItem key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Strategy Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Tax Return Line or Area</Label>
              <Input
                placeholder="e.g. Schedule A, Line 5"
                value={form.tax_return_line_or_area || ''}
                onChange={(e) => setForm(f => ({ ...f, tax_return_line_or_area: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Financial Goals (comma-separated)</Label>
              <Input
                placeholder="e.g. Reduce taxes, Maximize deductions"
                value={goalsInput}
                onChange={(e) => setGoalsInput(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm(f => ({ ...f, difficulty: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map(d => (
                      <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Estimated Impact</Label>
                <Input
                  placeholder="e.g. $500-$2000/yr"
                  value={form.estimated_impact || ''}
                  onChange={(e) => setForm(f => ({ ...f, estimated_impact: e.target.value }))}
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={createStrategy.isPending || updateStrategy.isPending}
            >
              {(createStrategy.isPending || updateStrategy.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingId ? 'Update Strategy' : 'Create Strategy'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Strategy?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove strategy "{deleteId}" and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Strategies?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedIds.size} selected strategies. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Import Errors Dialog */}
      <Dialog open={importErrorsOpen} onOpenChange={setImportErrorsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Errors ({importErrors.length})</DialogTitle>
            <DialogDescription>
              The following rows failed validation. Fix them in your CSV and re-import.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 min-h-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead className="w-28">ID</TableHead>
                  <TableHead className="w-32">Field</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importErrors.map((err, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm">{err.row > 0 ? err.row : '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{err.id}</TableCell>
                    <TableCell className="text-sm">{err.field}</TableCell>
                    <TableCell className="text-sm text-destructive">{err.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setImportErrorsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
