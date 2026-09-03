import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNetlifyAssessmentResults } from '@/hooks/useNetlifyAssessmentResults';

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NetlifyAssessmentHistory() {
  const { data: results = [], isLoading } = useNetlifyAssessmentResults();

  if (isLoading) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardContent className="p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">RPRx assessment results</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Financial and physical RPRx results saved to your account and ready for your next plan step.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><Link to="/assessment">Financial assessment</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/health-assessment">Physical assessment</Link></Button>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            No RPRx assessment results saved yet. Complete one of the assessments above after signing in.
          </div>
        ) : (
          <div className="space-y-3">
            {results.slice(0, 5).map((result) => (
              <div key={result.id} className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant={result.assessment_type === 'financial' ? 'default' : 'secondary'}>
                      {result.assessment_type === 'financial' ? 'Financial' : 'Physical'}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {fmt(result.completed_at)}</span>
                  </div>
                  <p className="font-medium text-foreground">Top match: {result.top_match_name || 'No match triggered'}</p>
                  <p className="text-sm text-muted-foreground">
                    {result.matches?.length ?? 0} total matches · {(result.free_matches?.length ?? 0)} free · {(result.locked_matches?.length ?? 0)} locked
                  </p>
                </div>
                <ChevronRight className="hidden h-5 w-5 text-muted-foreground sm:block" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
