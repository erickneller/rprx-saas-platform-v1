import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, ChevronDown, ChevronRight, FileText, Pencil, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNetlifyAssessmentResults } from '@/hooks/useNetlifyAssessmentResults';
import { useCreatePlan, usePlans } from '@/hooks/usePlans';
import { planInputForStarterPlan, type AssessmentStarterPlanMatch } from '@/hooks/useNetlifyAssessmentPersistence';
import { toast } from '@/hooks/use-toast';

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function NetlifyAssessmentHistory() {
  const { data: results = [], isLoading } = useNetlifyAssessmentResults();
  const { data: plans = [] } = usePlans();
  const createPlan = useCreatePlan();
  const [openResultId, setOpenResultId] = useState<string | null>(null);
  const navigate = useNavigate();
  const latestHealthResult = results.find((result) => result.assessment_type === 'physical');
  const wellnessStarterPlan = plans.find((plan) => plan.strategy_id === 'rprx-physical-starter-plan');
  const showWellnessStarterPrompt = Boolean(latestHealthResult && !wellnessStarterPlan);

  const editResult = (result: (typeof results)[number]) => {
    window.sessionStorage.setItem('rprx-edit-assessment', JSON.stringify({
      id: result.id,
      mode: result.assessment_type,
      answers: result.answers,
      completedAt: result.completed_at,
    }));
    navigate(`${result.assessment_type === 'physical' ? '/health-assessment' : '/assessment'}?editResultId=${result.id}`);
  };

  const buildStarterPlan = async (result: (typeof results)[number]) => {
    const strategyId = `rprx-${result.assessment_type}-starter-plan`;
    const existing = plans.find((plan) => plan.strategy_id === strategyId);
    if (existing) {
      navigate(`/plans/${existing.id}`);
      return;
    }

    try {
      const plan = await createPlan.mutateAsync(planInputForStarterPlan({
        mode: result.assessment_type,
        matches: (result.free_matches || []) as AssessmentStarterPlanMatch[],
        lockedMatches: (result.locked_matches || []) as AssessmentStarterPlanMatch[],
      }));
      toast({ title: result.assessment_type === 'physical' ? 'Wellness starter plan built' : 'Wealth starter plan built' });
      navigate(`/plans/${plan.id}`);
    } catch {
      toast({
        title: 'Could not build starter plan',
        description: 'Please try again after confirming you are signed in.',
        variant: 'destructive',
      });
    }
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

        {showWellnessStarterPrompt && latestHealthResult ? (
          <div className="mb-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Your Health Assessment is ready for a Wellness Starter Plan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Build a focused workspace from your first open wellness priorities — no fresh Health Assessment needed.
                </p>
              </div>
              <Button size="sm" onClick={() => buildStarterPlan(latestHealthResult)} disabled={createPlan.isPending}>
                <FileText className="mr-2 h-4 w-4" /> Build Wellness Starter Plan
              </Button>
            </div>
          </div>
        ) : null}

        {results.length === 0 ? (
          <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            No RPRx assessment results saved yet. Complete one of the assessments above after signing in.
          </div>
        ) : (
          <div className="space-y-3">
            {results.slice(0, 5).map((result) => {
              const isOpen = openResultId === result.id;
              const isHealth = result.assessment_type === 'physical';
              const starterStrategyId = `rprx-${result.assessment_type}-starter-plan`;
              const starterPlan = plans.find((plan) => plan.strategy_id === starterStrategyId);
              const starterLabel = isHealth ? 'Wellness Starter Plan' : 'Wealth Starter Plan';
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
                        {isHealth
                          ? `${result.matches?.length ?? 0} matched areas · ${result.free_matches?.length ?? 0} open free · ${result.locked_matches?.length ?? 0} member roadmap`
                          : `${result.matches?.length ?? 0} matched strategies · ${result.free_matches?.length ?? 0} open free`}
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
                        <Button
                          size="sm"
                          onClick={() => starterPlan ? navigate(`/plans/${starterPlan.id}`) : buildStarterPlan(result)}
                          disabled={createPlan.isPending}
                          variant={starterPlan ? 'outline' : 'default'}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          {starterPlan ? `View ${starterLabel}` : `Build ${starterLabel}`}
                        </Button>
                        <Button size="sm" onClick={() => editResult(result)} variant="outline">
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
