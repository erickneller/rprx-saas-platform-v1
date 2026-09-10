import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown, ChevronRight, Pencil, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNetlifyAssessmentResults } from '@/hooks/useNetlifyAssessmentResults';

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NetlifyAssessmentHistory() {
  const { data: results = [], isLoading } = useNetlifyAssessmentResults();
  const [openResultId, setOpenResultId] = useState<string | null>(null);
  const navigate = useNavigate();

  const editResult = (result: (typeof results)[number]) => {
    window.sessionStorage.setItem('rprx-edit-assessment', JSON.stringify({
      id: result.id,
      mode: result.assessment_type,
      answers: result.answers,
      completedAt: result.completed_at,
    }));
    navigate(`${result.assessment_type === 'physical' ? '/health-assessment' : '/assessment'}?editResultId=${result.id}`);
  };

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
              Wealth and Health RPRx results saved to your account and ready for your next plan step.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><Link to="/assessment">Wealth assessment</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/health-assessment">Health assessment</Link></Button>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            No RPRx assessment results saved yet. Complete one of the assessments above after signing in.
          </div>
        ) : (
          <div className="space-y-3">
            {results.slice(0, 5).map((result) => {
              const isOpen = openResultId === result.id;
              return (
                <div key={result.id} className="rounded-lg border bg-background p-4 transition hover:border-primary/40">
                  <button
                    type="button"
                    onClick={() => setOpenResultId(isOpen ? null : result.id)}
                    className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between"
                    aria-expanded={isOpen}
                  >
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <Badge variant={result.assessment_type === 'financial' ? 'default' : 'secondary'}>
                          {result.assessment_type === 'financial' ? 'Wealth' : 'Health'}
                        </Badge>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> {fmt(result.completed_at)}</span>
                      </div>
                      <p className="font-medium text-foreground">Top match: {result.top_match_name || 'No match triggered'}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.matches?.length ?? 0} total matches · {(result.free_matches?.length ?? 0)} free · {(result.locked_matches?.length ?? 0)} locked
                      </p>
                    </div>
                    {isOpen ? <ChevronDown className="hidden h-5 w-5 text-muted-foreground sm:block" /> : <ChevronRight className="hidden h-5 w-5 text-muted-foreground sm:block" />}
                  </button>

                  {isOpen ? (
                    <div className="mt-4 border-t pt-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        {(result.free_matches || []).slice(0, 3).map((match) => (
                          <div key={match.id} className="rounded-lg border bg-muted/30 p-3">
                            <p className="text-sm font-semibold text-foreground">{match.title}</p>
                            {match.category ? <p className="mt-1 text-xs text-muted-foreground">{match.category}</p> : null}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => editResult(result)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit answers
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link to={result.assessment_type === 'physical' ? '/health-assessment' : '/assessment'}>Start fresh assessment</Link>
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
