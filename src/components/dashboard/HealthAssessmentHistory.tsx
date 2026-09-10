import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Trash2, HeartPulse, Eye, Pencil, RotateCcw, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useHealthAssessments, useDeleteHealthAssessment } from '@/hooks/useHealthAssessmentHistory';
import { format } from 'date-fns';

export function HealthAssessmentHistory() {
  const { data: items = [], isLoading } = useHealthAssessments();
  const del = useDeleteHealthAssessment();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
              <HeartPulse className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">No health assessment yet</h3>
              <p className="text-sm text-muted-foreground">
                Take the RPRx Health Assessment to see your wellness opportunities.
              </p>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto bg-accent hover:bg-accent/90">
            <Link to="/health-assessment">
              Start Health Assessment
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const item = items[0];

  return (
    <>
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3 min-w-0">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                <HeartPulse className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">RPRx Physical Health Snapshot</h3>
                  <Badge variant="secondary" className="text-xs">Health</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated {format(new Date(item.updated_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            {typeof item.readiness_score === 'number' && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Readiness</p>
                <p className="text-2xl font-bold text-primary leading-none">{item.readiness_score}</p>
                {item.readiness_label && (
                  <p className="text-xs text-muted-foreground">{item.readiness_label}</p>
                )}
              </div>
            )}
          </div>

          {item.recommended_track_name && (
            <div className="text-sm text-foreground">
              <span className="text-muted-foreground">Recommended track: </span>
              <span className="font-medium">{item.recommended_track_name}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild size="sm" variant="default">
              <Link to="/health-assessment?mode=view">
                <Eye className="w-4 h-4 mr-1.5" /> View results
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/health-assessment?mode=edit">
                <Pencil className="w-4 h-4 mr-1.5" /> Edit answers
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/health-assessment">
                <RotateCcw className="w-4 h-4 mr-1.5" /> Take new
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmId(item.id)}
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete health assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes your saved snapshot. You can retake it any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmId) del.mutate(confirmId);
                setConfirmId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
