import { useMemo, useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useLibraryCategories, useLibraryVideos } from '@/hooks/useLibrary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Lock, Play } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { resolveVideoSource } from '@/lib/videoSource';
import { useSubscription } from '@/hooks/useSubscription';
import { useUpgradeGate } from '@/contexts/UpgradeGateContext';
import { normalizeRequiredTier, tierMeets } from '@/lib/upgradeFeatures';
import { useLogVideoOpen } from '@/hooks/useLogVideoOpen';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function Library() {
  const { data: categories = [], isLoading: catLoading } = useLibraryCategories();
  const { data: videos = [], isLoading: vidLoading } = useLibraryVideos();
  const { tier } = useSubscription();
  const { requireUpgrade } = useUpgradeGate();
  const logVideoOpen = useLogVideoOpen();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [playingIds, setPlayingIds] = useState<Set<string>>(new Set());

  const isLoading = catLoading || vidLoading;

  const sortVideos = <T extends { created_at: string }>(list: T[]) =>
    [...list].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? db - da : da - db;
    });

  const grouped = useMemo(() => {
    const visibleCats =
      selectedCategoryId === 'all'
        ? categories
        : categories.filter(c => c.id === selectedCategoryId);

    return visibleCats
      .map(cat => ({
        ...cat,
        videos: sortVideos(videos.filter(v => v.category_id === cat.id)),
      }))
      .filter(g => g.videos.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, videos, selectedCategoryId, sortOrder]);

  return (
    <AuthenticatedLayout title="RPRx Library">
      <div className="p-4 md:p-6 space-y-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">RPRx Library</h1>
        </div>
        <p className="text-muted-foreground">
          Browse our curated video library to deepen your financial knowledge.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 min-w-0 space-y-1.5">
            <Label htmlFor="category-filter" className="text-xs uppercase tracking-wide text-muted-foreground">
              Category
            </Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:w-56 space-y-1.5">
            <Label htmlFor="sort-order" className="text-xs uppercase tracking-wide text-muted-foreground">
              Sort
            </Label>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'newest' | 'oldest')}>
              <SelectTrigger id="sort-order">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No library videos available yet. Check back soon!
            </CardContent>
          </Card>
        ) : (
          grouped.map(cat => (
            <section key={cat.id} className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{cat.name}</h2>
                {cat.description && (
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                )}
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cat.videos.map(video => {
                  const required = normalizeRequiredTier(video.required_tier);
                  const locked = !tierMeets(tier, required);
                  const source = resolveVideoSource(video.video_url);

                  if (locked) {
                    const label = required === 'pro' ? 'Pro' : 'Member';
                    return (
                      <Card key={video.id} className="flex flex-col overflow-hidden">
                        <AspectRatio ratio={16 / 9}>
                          <div className="relative w-full h-full bg-muted">
                            {video.thumbnail_url && (
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="w-full h-full object-cover opacity-40"
                              />
                            )}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-sm">
                              <Lock className="h-8 w-8 text-primary" />
                              <span className="text-xs font-medium uppercase tracking-wide text-primary">
                                {label} only
                              </span>
                            </div>
                          </div>
                        </AspectRatio>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className="truncate">{video.title}</span>
                            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col justify-between gap-3">
                          <CardDescription>{video.description}</CardDescription>
                          <Button
                            size="sm"
                            onClick={() => requireUpgrade({ feature: 'library', requiredTier: required })}
                          >
                            Unlock with {label}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  }

                  const isPlaying = playingIds.has(video.id);
                  const showPoster = !isPlaying && !!video.thumbnail_url && source.kind !== 'unknown';

                  const handlePlay = () => {
                    setPlayingIds(prev => {
                      const next = new Set(prev);
                      next.add(video.id);
                      return next;
                    });
                    logVideoOpen({
                      source: 'library_video',
                      sourceId: video.id,
                      title: video.title,
                      videoUrl: video.video_url,
                    });
                  };

                  return (
                    <Card key={video.id} className="flex flex-col overflow-hidden">
                      {showPoster ? (
                        <AspectRatio ratio={16 / 9}>
                          <button
                            type="button"
                            onClick={handlePlay}
                            className="group relative w-full h-full block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Play ${video.title}`}
                          >
                            <img
                              src={video.thumbnail_url!}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                              <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                <Play className="h-6 w-6 text-black fill-black ml-0.5" />
                              </div>
                            </div>
                          </button>
                        </AspectRatio>
                      ) : source.kind !== 'unknown' ? (
                        <div onClick={() => !isPlaying && handlePlay()}>
                          <VideoPlayer url={video.video_url} title={video.title} />
                        </div>
                      ) : video.thumbnail_url ? (
                        <AspectRatio ratio={16 / 9}>
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        </AspectRatio>
                      ) : null}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{video.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <CardDescription>{video.description}</CardDescription>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </AuthenticatedLayout>
  );
}
