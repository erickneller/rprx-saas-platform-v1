import { useState } from 'react';
import {
  useSidebarConfig,
  useUpdateNavVisibility,
  useUpsertNavRow,
  useDeleteNavRow,
  useSwapNavOrder,
  type NavConfigRow,
  type LinkType,
} from '@/hooks/useSidebarConfig';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { IconPicker } from './IconPicker';
import { getIcon } from '@/lib/lucideIconMap';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const NON_HIDEABLE = ['item:dashboard'];

interface EditorState {
  open: boolean;
  row: Partial<NavConfigRow> | null;
}

export function NavigationTab() {
  const { rows, isLoading, sections, itemsBySection } = useSidebarConfig();
  const updateVisibility = useUpdateNavVisibility();
  const upsert = useUpsertNavRow();
  const del = useDeleteNavRow();
  const swap = useSwapNavOrder();
  const [editor, setEditor] = useState<EditorState>({ open: false, row: null });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleToggle = async (id: string, visible: boolean) => {
    try {
      await updateVisibility.mutateAsync({ id, visible });
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (row: NavConfigRow) => {
    if (row.is_system) {
      toast.error('Cannot delete a built-in item');
      return;
    }
    if (!confirm(`Delete "${row.label}"? ${row.kind === 'section' ? 'All items inside will be removed.' : ''}`)) return;
    try {
      await del.mutateAsync(row.id);
      toast.success('Deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    }
  };

  const handleMove = async (row: NavConfigRow, dir: 'up' | 'down', siblings: NavConfigRow[]) => {
    const idx = siblings.findIndex(s => s.id === row.id);
    const target = dir === 'up' ? siblings[idx - 1] : siblings[idx + 1];
    if (!target) return;
    try {
      await swap.mutateAsync({ a: row, b: target });
    } catch {
      toast.error('Failed to reorder');
    }
  };

  const openNew = (kind: 'section' | 'item', parent_id: string | null) => {
    const siblings = kind === 'section'
      ? sections
      : (parent_id ? (itemsBySection.get(parent_id) || []) : []);
    const nextOrder = (siblings[siblings.length - 1]?.sort_order ?? 0) + 10;
    setEditor({
      open: true,
      row: {
        id: `${kind}:custom_${Date.now()}`,
        kind,
        parent_id,
        label: '',
        icon: kind === 'item' ? 'Star' : null,
        url: '',
        link_type: 'route',
        visible: true,
        sort_order: nextOrder,
        is_system: false,
        required_tier: 'free',
      },
    });
  };

  const openEdit = (row: NavConfigRow) => setEditor({ open: true, row: { ...row } });

  const saveEditor = async () => {
    if (!editor.row?.id || !editor.row.label?.trim()) {
      toast.error('Label required');
      return;
    }
    try {
      await upsert.mutateAsync(editor.row as any);
      toast.success('Saved');
      setEditor({ open: false, row: null });
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
  };

  const renderItemRow = (item: NavConfigRow, siblings: NavConfigRow[]) => {
    const isLocked = NON_HIDEABLE.includes(item.id);
    const Icon = getIcon(item.icon);
    return (
      <div key={item.id} className="flex items-center gap-2 pl-6 py-2 border-b border-border/50">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm flex-1 truncate">{item.label}</span>
        <span className="text-[10px] uppercase text-muted-foreground">{item.link_type}</span>
        <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${item.required_tier === 'pro' ? 'bg-primary/15 text-primary' : item.required_tier === 'partner' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
          {item.required_tier ?? 'free'}
        </span>
        {item.link_type === 'course' && (
          <Button asChild size="sm" variant="ghost" className="h-7 px-2">
            <Link to="#" onClick={(e) => { e.preventDefault(); document.querySelector<HTMLButtonElement>('[data-tab="courses"]')?.click(); }}>
              <BookOpen className="h-3 w-3" />
            </Link>
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleMove(item, 'up', siblings)} disabled={siblings[0]?.id === item.id}>
          <ArrowUp className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleMove(item, 'down', siblings)} disabled={siblings[siblings.length - 1]?.id === item.id}>
          <ArrowDown className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(item)} disabled={item.is_system}>
          <Trash2 className="h-3 w-3" />
        </Button>
        <Switch
          checked={item.visible}
          onCheckedChange={(c) => handleToggle(item.id, c)}
          disabled={isLocked || updateVisibility.isPending}
        />
      </div>
    );
  };

  const e = editor.row;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Sidebar Navigation</CardTitle>
            <CardDescription>
              Add, edit, reorder, or hide sidebar sections and items. Course-typed items open the Course Builder.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => openNew('section', null)}>
            <Plus className="h-4 w-4 mr-1" /> Add Section
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {sections.map((section) => {
            const items = itemsBySection.get(section.id) || [];
            return (
              <div key={section.id} className="space-y-1">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Label className="text-sm font-bold flex-1">{section.label}</Label>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleMove(section, 'up', sections)} disabled={sections[0]?.id === section.id}>
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleMove(section, 'down', sections)} disabled={sections[sections.length - 1]?.id === section.id}>
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-7" onClick={() => openNew('item', section.id)}>
                    <Plus className="h-3 w-3 mr-1" /> Item
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(section)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDelete(section)} disabled={section.is_system}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Switch
                    checked={section.visible}
                    onCheckedChange={(c) => handleToggle(section.id, c)}
                    disabled={updateVisibility.isPending}
                  />
                </div>
                {items.map((item) => renderItemRow(item, items))}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={editor.open} onOpenChange={(o) => setEditor({ open: o, row: o ? editor.row : null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{e?.id && rows.find(r => r.id === e.id) ? 'Edit' : 'New'} {e?.kind === 'section' ? 'Section' : 'Item'}</DialogTitle>
          </DialogHeader>
          {e && (
            <div className="space-y-3">
              <div>
                <Label>Label</Label>
                <Input value={e.label || ''} onChange={(ev) => setEditor({ ...editor, row: { ...e, label: ev.target.value } })} />
              </div>
              {e.kind === 'item' && (
                <>
                  <div>
                    <Label>Icon</Label>
                    <div className="mt-1">
                      <IconPicker value={e.icon} onChange={(name) => setEditor({ ...editor, row: { ...e, icon: name } })} />
                    </div>
                  </div>
                  <div>
                    <Label>Link type</Label>
                    <Select
                      value={e.link_type || 'route'}
                      onValueChange={(v: LinkType) => setEditor({ ...editor, row: { ...e, link_type: v, url: v === 'course' || v === 'coming_soon' ? '#' : (e.url || '') } })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="route">Internal route</SelectItem>
                        <SelectItem value="external">External link</SelectItem>
                        <SelectItem value="course">Course (mini-course page)</SelectItem>
                        <SelectItem value="coming_soon">Coming Soon (no link)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(e.link_type === 'route' || e.link_type === 'external') && (
                    <div>
                      <Label>URL</Label>
                      <Input
                        placeholder={e.link_type === 'route' ? '/my-page' : 'https://...'}
                        value={e.url || ''}
                        onChange={(ev) => setEditor({ ...editor, row: { ...e, url: ev.target.value } })}
                      />
                    </div>
                  )}
                  <div>
                    <Label>Required Tier</Label>
                    <Select
                      value={e.required_tier ?? 'free'}
                      onValueChange={(v) => setEditor({ ...editor, row: { ...e, required_tier: v as any } })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free (everyone)</SelectItem>
                        <SelectItem value="partner">Member & Pro</SelectItem>
                        <SelectItem value="pro">Pro only</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Locked items show a lock icon and open the upgrade modal.</p>
                  </div>
                  {e.parent_id && (
                    <div>
                      <Label>Section</Label>
                      <Select
                        value={e.parent_id}
                        onValueChange={(v) => setEditor({ ...editor, row: { ...e, parent_id: v } })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditor({ open: false, row: null })}>Cancel</Button>
            <Button onClick={saveEditor} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
