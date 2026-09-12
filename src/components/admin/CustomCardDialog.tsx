import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type {
  CustomCardContentType,
  CustomCardInput,
  DashboardCardConfig,
} from '@/hooks/useDashboardConfig';

interface CustomCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: DashboardCardConfig | null;
  onSave: (input: CustomCardInput) => Promise<void> | void;
  isSaving?: boolean;
}

const TIERS = [
  { value: 'free', label: 'Free' },
  { value: 'partner', label: 'Member' },
  { value: 'pro', label: 'Pro' },
];

export function CustomCardDialog({ open, onOpenChange, initial, onSave, isSaving }: CustomCardDialogProps) {
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<CustomCardContentType>('text');
  const [size, setSize] = useState<'full' | 'half' | 'compact'>('full');
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [html, setHtml] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageLink, setImageLink] = useState('');
  const [companyIds, setCompanyIds] = useState<string[]>([]);
  const [tiers, setTiers] = useState<string[]>([]);

  const { data: companies = [] } = useQuery({
    queryKey: ['admin-companies-mini'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('companies') as any)
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title || initial.display_name || '');
      setContentType((initial.content_type as CustomCardContentType) || 'text');
      setSize(initial.default_size || 'full');
      const c = initial.content || {};
      setUrl(c.url || '');
      setCaption(c.caption || '');
      setMarkdown(c.markdown || '');
      setHtml(c.html || '');
      setImageAlt(c.alt || '');
      setImageLink(c.link || '');
      setCompanyIds(initial.audience_company_ids || []);
      setTiers(initial.audience_tiers || []);
    } else {
      setTitle(''); setContentType('text'); setSize('full');
      setUrl(''); setCaption(''); setMarkdown(''); setHtml('');
      setImageAlt(''); setImageLink('');
      setCompanyIds([]); setTiers([]);
    }
  }, [open, initial]);

  const buildContent = () => {
    switch (contentType) {
      case 'video': return { url, caption };
      case 'image': return { url, alt: imageAlt, link: imageLink };
      case 'text': return { markdown };
      case 'embed': return { html };
    }
  };

  const handleSave = async () => {
    await onSave({
      title: title.trim(),
      content_type: contentType,
      content: buildContent(),
      default_size: size,
      audience_company_ids: companyIds,
      audience_tiers: tiers,
    });
  };

  const toggleCompany = (id: string) => {
    setCompanyIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleTier = (t: string) => {
    setTiers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const canSave = title.trim().length > 0 && (
    (contentType === 'video' && url.trim()) ||
    (contentType === 'image' && url.trim()) ||
    (contentType === 'text' && markdown.trim()) ||
    (contentType === 'embed' && html.trim())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Custom Card' : 'Add Custom Card'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Welcome Video" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Content type</Label>
              <Select value={contentType} onValueChange={(v) => setContentType(v as CustomCardContentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="text">Text / Markdown</SelectItem>
                  <SelectItem value="embed">Embed / HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={size} onValueChange={(v) => setSize(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="half">Half Width</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {contentType === 'video' && (
            <>
              <div className="space-y-2">
                <Label>Video URL (YouTube, Vimeo, Loom, Descript, or .mp4)</Label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Caption (optional)</Label>
                <Input value={caption} onChange={e => setCaption(e.target.value)} />
              </div>
            </>
          )}

          {contentType === 'image' && (
            <>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Alt text</Label>
                <Input value={imageAlt} onChange={e => setImageAlt(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Click-through link (optional)</Label>
                <Input value={imageLink} onChange={e => setImageLink(e.target.value)} placeholder="https://..." />
              </div>
            </>
          )}

          {contentType === 'text' && (
            <div className="space-y-2">
              <Label>Markdown content</Label>
              <Textarea
                value={markdown}
                onChange={e => setMarkdown(e.target.value)}
                rows={8}
                placeholder="## Heading&#10;&#10;Your text here..."
              />
            </div>
          )}

          {contentType === 'embed' && (
            <div className="space-y-2">
              <Label>HTML / Embed code</Label>
              <Textarea
                value={html}
                onChange={e => setHtml(e.target.value)}
                rows={8}
                placeholder='<iframe src="https://..."></iframe>'
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Only iframes from YouTube, Vimeo, Loom, Descript, Calendly, GHL, and common form providers are allowed.
              </p>
            </div>
          )}

          <div className="space-y-2 pt-2 border-t">
            <Label>Visible to subscription tiers</Label>
            <div className="flex gap-4">
              {TIERS.map(t => (
                <label key={t.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={tiers.includes(t.value)}
                    onCheckedChange={() => toggleTier(t.value)}
                  />
                  {t.label}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Leave both unchecked to show to all tiers.</p>
          </div>

          <div className="space-y-2">
            <Label>Visible to companies</Label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
              {companies.length === 0 && (
                <p className="text-xs text-muted-foreground">No companies found.</p>
              )}
              {companies.map(c => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={companyIds.includes(c.id)}
                    onCheckedChange={() => toggleCompany(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Leave empty to show to all companies.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave || isSaving}>
            {isSaving ? 'Saving...' : initial ? 'Save changes' : 'Create card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
