import { useRef, useState } from 'react';
import {
  useAllLibraryCategories,
  useAllLibraryVideos,
  useUpsertLibraryCategory,
  useDeleteLibraryCategory,
  useUpsertLibraryVideo,
  useDeleteLibraryVideo,
  type LibraryCategory,
  type LibraryVideo,
} from '@/hooks/useLibrary';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { resolveVideoSource } from '@/lib/videoSource';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const THUMBNAIL_BUCKET = 'course-assets';
const THUMBNAIL_PREFIX = 'library-thumbnails';

export function LibraryTab() {
  const { data: categories = [], isLoading: catLoading } = useAllLibraryCategories();
  const { data: videos = [], isLoading: vidLoading } = useAllLibraryVideos();
  const upsertCategory = useUpsertLibraryCategory();
  const deleteCategory = useDeleteLibraryCategory();
  const upsertVideo = useUpsertLibraryVideo();
  const deleteVideo = useDeleteLibraryVideo();

  // Category form
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catForm, setCatForm] = useState({ id: '', name: '', description: '', sort_order: 0, is_active: true });
  const [catEditing, setCatEditing] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  // Video form
  const [vidDialogOpen, setVidDialogOpen] = useState(false);
  const [vidForm, setVidForm] = useState<Partial<LibraryVideo> & { title: string; category_id: string }>({
    title: '', category_id: '', description: '', video_url: '', thumbnail_url: '', sort_order: 0, is_active: true, required_tier: 'free',
  });
  const [vidEditing, setVidEditing] = useState(false);
  const [deleteVidId, setDeleteVidId] = useState<string | null>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const thumbFileRef = useRef<HTMLInputElement>(null);

  const handleThumbUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setUploadingThumb(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${THUMBNAIL_PREFIX}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from(THUMBNAIL_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(path);
      setVidForm(f => ({ ...f, thumbnail_url: data.publicUrl }));
      toast.success('Thumbnail uploaded');
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploadingThumb(false);
      if (thumbFileRef.current) thumbFileRef.current.value = '';
    }
  };

  // Category handlers
  const openCreateCat = () => {
    setCatEditing(false);
    setCatForm({ id: '', name: '', description: '', sort_order: categories.length, is_active: true });
    setCatDialogOpen(true);
  };
  const openEditCat = (cat: LibraryCategory) => {
    setCatEditing(true);
    setCatForm({ id: cat.id, name: cat.name, description: cat.description, sort_order: cat.sort_order, is_active: cat.is_active });
    setCatDialogOpen(true);
  };
  const saveCat = async () => {
    if (!catForm.id || !catForm.name) { toast.error('ID and Name required'); return; }
    try {
      await upsertCategory.mutateAsync(catForm);
      toast.success(catEditing ? 'Category updated' : 'Category created');
      setCatDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };
  const confirmDeleteCat = async () => {
    if (!deleteCatId) return;
    try { await deleteCategory.mutateAsync(deleteCatId); toast.success('Category deleted'); }
    catch (e: any) { toast.error(e.message); }
    setDeleteCatId(null);
  };

  // Video handlers
  const openCreateVid = () => {
    setVidEditing(false);
    setVidForm({ title: '', category_id: categories[0]?.id ?? '', description: '', video_url: '', thumbnail_url: '', sort_order: 0, is_active: true, required_tier: 'free' });
    setVidDialogOpen(true);
  };
  const openEditVid = (v: LibraryVideo) => {
    setVidEditing(true);
    setVidForm({ id: v.id, title: v.title, category_id: v.category_id, description: v.description, video_url: v.video_url, thumbnail_url: v.thumbnail_url || '', sort_order: v.sort_order, is_active: v.is_active, required_tier: v.required_tier ?? 'free' });
    setVidDialogOpen(true);
  };
  const saveVid = async () => {
    if (!vidForm.title || !vidForm.category_id) { toast.error('Title and Category required'); return; }
    try {
      await upsertVideo.mutateAsync(vidForm as any);
      toast.success(vidEditing ? 'Video updated' : 'Video created');
      setVidDialogOpen(false);
    } catch (e: any) { toast.error(e.message); }
  };
  const confirmDeleteVid = async () => {
    if (!deleteVidId) return;
    try { await deleteVideo.mutateAsync(deleteVidId); toast.success('Video deleted'); }
    catch (e: any) { toast.error(e.message); }
    setDeleteVidId(null);
  };

  if (catLoading || vidLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const previewSource = resolveVideoSource(vidForm.video_url);
  const hasPreview = previewSource.kind !== 'unknown';

  return (
    <div className="space-y-8">
      {/* ===== CATEGORIES ===== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Library Categories</CardTitle>
          <Button size="sm" onClick={openCreateCat}><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.length === 0 && <p className="text-muted-foreground text-sm">No categories yet.</p>}
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between border rounded-md p-3">
              <div>
                <span className="font-medium">{cat.name}</span>
                <span className="text-xs text-muted-foreground ml-2">({cat.id})</span>
                {!cat.is_active && <span className="text-xs text-destructive ml-2">Inactive</span>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEditCat(cat)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteCatId(cat.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ===== VIDEOS ===== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Videos</CardTitle>
          <Button size="sm" onClick={openCreateVid} disabled={categories.length === 0}><Plus className="h-4 w-4 mr-1" /> Add Video</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {videos.length === 0 && <p className="text-muted-foreground text-sm">No videos yet.</p>}
          {videos.map(v => (
            <div key={v.id} className="flex items-center justify-between border rounded-md p-3">
              <div className="min-w-0">
                <span className="font-medium">{v.title}</span>
                <span className="text-xs text-muted-foreground ml-2">{categories.find(c => c.id === v.category_id)?.name}</span>
                <span className={`text-[10px] uppercase ml-2 px-1.5 py-0.5 rounded ${v.required_tier === 'pro' ? 'bg-primary/15 text-primary' : v.required_tier === 'partner' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {v.required_tier ?? 'free'}
                </span>
                {!v.is_active && <span className="text-xs text-destructive ml-2">Inactive</span>}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => openEditVid(v)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteVidId(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{catEditing ? 'Edit Category' : 'New Category'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>ID (slug)</Label><Input value={catForm.id} onChange={e => setCatForm(f => ({ ...f, id: e.target.value }))} disabled={catEditing} placeholder="e.g. tax-tips" /></div>
            <div><Label>Name</Label><Input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Sort Order</Label><Input type="number" value={catForm.sort_order} onChange={e => setCatForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={catForm.is_active} onCheckedChange={v => setCatForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
            <Button onClick={saveCat} disabled={upsertCategory.isPending} className="w-full">{upsertCategory.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Dialog */}
      <Dialog open={vidDialogOpen} onOpenChange={setVidDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{vidEditing ? 'Edit Video' : 'New Video'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={vidForm.title} onChange={e => setVidForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div>
              <Label>Category</Label>
              <Select value={vidForm.category_id} onValueChange={v => setVidForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Short Description</Label><Textarea value={vidForm.description || ''} onChange={e => setVidForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div>
              <Label>Video URL</Label>
              <Input value={vidForm.video_url || ''} onChange={e => setVidForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=... or https://...mp4" />
              <p className="text-xs text-muted-foreground mt-1">YouTube, Loom, or direct .mp4/.webm URL (e.g. GHL Media Library)</p>
            </div>
            {hasPreview && (
              <div>
                <Label className="text-xs text-muted-foreground">Preview</Label>
                <div className="mt-1 rounded-md overflow-hidden border">
                  <VideoPlayer url={vidForm.video_url} title="Preview" />
                </div>
              </div>
            )}
            <div>
              <Label>Thumbnail (optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={vidForm.thumbnail_url || ''}
                  onChange={e => setVidForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                  placeholder="https://..."
                />
                <input
                  ref={thumbFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleThumbUpload(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => thumbFileRef.current?.click()}
                  disabled={uploadingThumb}
                >
                  {uploadingThumb ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="ml-1">Upload</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upload an image or paste a direct image URL. Google Drive share links won't render.
              </p>
              {vidForm.thumbnail_url && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={vidForm.thumbnail_url}
                    alt="Thumbnail preview"
                    className="h-24 rounded border object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setVidForm(f => ({ ...f, thumbnail_url: '' }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label>Required Tier</Label>
              <Select value={vidForm.required_tier ?? 'free'} onValueChange={(v) => setVidForm(f => ({ ...f, required_tier: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (everyone)</SelectItem>
                  <SelectItem value="partner">Member & Pro</SelectItem>
                  <SelectItem value="pro">Pro only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Lower tiers will see a lock with an upgrade prompt.</p>
            </div>
            <div><Label>Sort Order</Label><Input type="number" value={vidForm.sort_order ?? 0} onChange={e => setVidForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} /></div>
            <div className="flex items-center gap-2"><Switch checked={vidForm.is_active ?? true} onCheckedChange={v => setVidForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
            <Button onClick={saveVid} disabled={upsertVideo.isPending} className="w-full">{upsertVideo.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Alerts */}
      <AlertDialog open={!!deleteCatId} onOpenChange={() => setDeleteCatId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Category?</AlertDialogTitle><AlertDialogDescription>This will also delete all videos in this category.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteCat}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteVidId} onOpenChange={() => setDeleteVidId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Video?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteVid}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
