import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlan, useUpdatePlan, useDeletePlan, useCreatePlan, usePlans } from '@/hooks/usePlans';
import { PlanChecklist } from '@/components/plans/PlanChecklist';
import { PlanDownload } from '@/components/plans/PlanDownload';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Trash2, Edit2, Save, X, Calendar, Clock, FileText, Star, Sparkles, ArrowRight, ArrowLeft, Shield, Target, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useQueryClient } from '@tanstack/react-query';
import { useSubscription } from '@/hooks/useSubscription';
import { useNetlifyAssessmentResults } from '@/hooks/useNetlifyAssessmentResults';
import { planInputForStarterPlan, type AssessmentStarterPlanMatch } from '@/hooks/useNetlifyAssessmentPersistence';

export default function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading, error } = usePlan(id);
  const updatePlan = useUpdatePlan();
  const createPlan = useCreatePlan();
  const deletePlan = useDeletePlan();
  const { data: allPlans = [] } = usePlans();
  const { data: netlifyResults = [] } = useNetlifyAssessmentResults();
  const { toast } = useToast();
  const { data: assessments } = useAssessmentHistory();
  const queryClient = useQueryClient();
  const { tier } = useSubscription();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [notesChanged, setNotesChanged] = useState(false);

  useEffect(() => {
    if (plan) {
      setEditedTitle(plan.title);
      setNotes(plan.notes || '');
    }
  }, [plan]);

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !plan) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center flex-col gap-4">
          <p className="text-muted-foreground">Plan not found</p>
          <Button onClick={() => navigate('/plans')} className="bg-accent hover:bg-accent/90 text-accent-foreground">Back to Plans</Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  const content = plan.content;
  const completedSteps = content.completedSteps || [];
  const totalSteps = content.steps?.length || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;
  const isCompleted = plan.status === 'completed' || (totalSteps > 0 && completedSteps.length === totalSteps);

  const latestAssessment = assessments && assessments.length > 0 ? assessments[0] : null;
  const isFreeUser = tier === 'free';
  const isWellnessPlan = content.plan_kind === 'wellness' || content.source_assessment_type === 'physical' || plan.strategy_id === 'rprx-physical-starter-plan';
  const isWealthPlan = content.plan_kind === 'wealth' || content.source_assessment_type === 'financial' || plan.strategy_id === 'rprx-financial-starter-plan';
  const latestHealthResult = netlifyResults.find((result) => result.assessment_type === 'physical');
  const wellnessStarterPlan = allPlans.find((savedPlan) => savedPlan.strategy_id === 'rprx-physical-starter-plan');
  const showWellnessEscapeHatch = Boolean(!isWellnessPlan && latestHealthResult);
  const planLabel = content.plan_label || (isWellnessPlan ? 'Wellness Plan' : isWealthPlan ? 'Wealth Plan' : 'starter plan');
  const fullImplementationLabel = isWellnessPlan ? 'Unlock Full Wellness Roadmap' : isWealthPlan ? 'Unlock Full Wealth Implementation' : 'Unlock Full Implementation';
  const stepSectionTitle = isWellnessPlan ? 'First Wellness Moves' : isWealthPlan ? 'First Wealth Moves' : 'Step-by-Step Plan';
  const advisorSectionSubtitle = isWellnessPlan
    ? 'Use these notes with a qualified healthcare, wellness, or mental-health professional when appropriate'
    : 'Bring this to your CPA, EA, attorney, insurance advisor, or financial advisor when appropriate';

  // Derive display title: use strategy_name unless it's the generic fallback
  const displayTitle = plan.strategy_name && plan.strategy_name !== 'Implementation Plan'
    ? plan.strategy_name
    : plan.title;

  // Single primary horseman label (strict template compliance)
  const primaryHorseman = Array.isArray(content.horseman) && content.horseman.length > 0
    ? content.horseman[0]
    : null;

  // Strip generic AI filler openings from summary
  const FILLER_RE = /^(certainly|sure|of course|absolutely|great question|happy to help|here(?:'s| is)|let me)[^.!?]*[.!?]\s*/i;
  const cleanedSummary = content.summary
    ? content.summary.replace(FILLER_RE, '').replace(/\*\*/g, '').trim()
    : null;
  const isGenericSummary = cleanedSummary
    ? /^(this (plan|strategy) (will help|helps|is designed)|implementation plan for)/i.test(cleanedSummary) && cleanedSummary.length < 80
    : true;
  const displaySummary = cleanedSummary && !isGenericSummary ? cleanedSummary : null;

  const handleBuildWellnessStarterPlan = async () => {
    if (wellnessStarterPlan) {
      navigate(`/plans/${wellnessStarterPlan.id}`);
      return;
    }
    if (!latestHealthResult) return;

    try {
      const savedPlan = await createPlan.mutateAsync(planInputForStarterPlan({
        mode: 'physical',
        matches: (latestHealthResult.free_matches || []) as AssessmentStarterPlanMatch[],
        lockedMatches: (latestHealthResult.locked_matches || []) as AssessmentStarterPlanMatch[],
      }));
      toast({ title: 'Wellness starter plan built' });
      navigate(`/plans/${savedPlan.id}`);
    } catch {
      toast({
        title: 'Could not build Wellness Starter Plan',
        description: 'Please try again from your Health Assessment result or Assessment History.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStep = async (stepIndex: number) => {
    const currentCompleted = content.completedSteps || [];
    const newCompleted = currentCompleted.includes(stepIndex)
      ? currentCompleted.filter(i => i !== stepIndex)
      : [...currentCompleted, stepIndex];

    let newStatus: 'not_started' | 'in_progress' | 'completed' = plan.status;
    if (newCompleted.length === 0) {
      newStatus = 'not_started';
    } else if (newCompleted.length === totalSteps) {
      newStatus = 'completed';
    } else {
      newStatus = 'in_progress';
    }

    const wasFirstStep = currentCompleted.length === 0 && newCompleted.length === 1;
    const justCompleted = newCompleted.length === totalSteps && totalSteps > 0;

    try {
      await updatePlan.mutateAsync({
        id: plan.id,
        content: { ...content, completedSteps: newCompleted },
        status: newStatus,
      });

      // Invalidate money leak calculations
      queryClient.invalidateQueries({ queryKey: ['plans'] });

      // Contextual toasts
      if (justCompleted) {
        const impact = content.estimated_impact;
        const mid = impact ? Math.round((impact.low + impact.high) / 2) : null;
        toast({
          title: '🎉 Plan complete!',
          description: mid
            ? `You've recovered an estimated $${mid.toLocaleString()}`
            : 'Great work completing this plan!',
        });
      } else if (wasFirstStep) {
        toast({ title: '🎉 You\'re on your way!', description: 'First step complete.' });
      } else if (newCompleted.length > currentCompleted.length) {
        toast({ title: '✅ Step complete', description: `${newCompleted.length}/${totalSteps} steps done` });
      }
    } catch {
      toast({ title: 'Error updating plan', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) return;
    try {
      await updatePlan.mutateAsync({ id: plan.id, title: editedTitle.trim() });
      setIsEditingTitle(false);
    } catch {
      toast({ title: 'Error updating title', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleSaveNotes = async () => {
    try {
      await updatePlan.mutateAsync({ id: plan.id, notes: notes.trim() || null });
      setNotesChanged(false);
      toast({ title: 'Notes saved', description: 'Your notes have been updated.' });
    } catch {
      toast({ title: 'Error saving notes', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updatePlan.mutateAsync({ id: plan.id, status: newStatus as 'not_started' | 'in_progress' | 'completed' });
    } catch {
      toast({ title: 'Error updating status', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlan.mutateAsync(plan.id);
      toast({ title: 'Plan deleted', description: 'The plan has been removed.' });
      navigate('/plans');
    } catch {
      toast({ title: 'Error deleting plan', description: 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <AuthenticatedLayout breadcrumbs={[{ label: "My Plans", href: "/plans" }, { label: displayTitle }]}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/plans')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Plans
              </Button>
              <PlanDownload plan={plan} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Select value={plan.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="text-2xl font-bold" autoFocus />
                <Button size="icon" variant="ghost" onClick={handleSaveTitle}><Save className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { setIsEditingTitle(false); setEditedTitle(plan.title); }}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{displayTitle}</h1>
                <Button size="icon" variant="ghost" onClick={() => setIsEditingTitle(true)}><Edit2 className="h-4 w-4 text-muted-foreground" /></Button>
              </div>
            )}

            {/* Show plan.title as subtitle when it's different */}
            {displayTitle !== plan.title && (
              <p className="text-sm text-muted-foreground mt-1">{plan.title}</p>
            )}
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {plan.strategy_id && (
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                {plan.strategy_id}
              </Badge>
            )}
            {primaryHorseman && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                {primaryHorseman}
              </Badge>
            )}
            {content.complexity && (
              <Badge variant="secondary" className="gap-1">
                <Target className="h-3 w-3" />
                {'★'.repeat(content.complexity)}{'☆'.repeat(5 - content.complexity)}
              </Badge>
            )}
            {content.savings && (
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                {content.savings}
              </Badge>
            )}
            {content.taxReference && (
              <Badge variant="outline">{content.taxReference}</Badge>
            )}
          </div>

          {/* Progress bar */}
          {totalSteps > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{completedSteps.length}/{totalSteps} steps ({progress}%)</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Summary (strategy-specific only) */}
        {displaySummary && (
          <div className="text-sm text-foreground leading-relaxed border-l-2 border-primary/30 pl-4">
            {displaySummary}
          </div>
        )}

        {showWellnessEscapeHatch && (
          <Card className="border-emerald-200 bg-emerald-50/80">
            <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">This is not your Wellness Starter Plan</h2>
                <p className="text-sm text-muted-foreground">
                  You have a Health Assessment saved. Build or open the Wellness Starter Plan from that Health result here.
                </p>
              </div>
              <Button onClick={handleBuildWellnessStarterPlan} disabled={createPlan.isPending} className="shrink-0 bg-[#2e7d5c] hover:bg-[#25684c]">
                {wellnessStarterPlan ? 'Open Wellness Starter Plan' : createPlan.isPending ? 'Building…' : 'Build Wellness Starter Plan'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isFreeUser && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">Your free RPRx {planLabel} is unlocked</h2>
                <p className="text-sm text-muted-foreground">
                  Review this first {planLabel.toLowerCase()} and use it to decide your next move. Membership unlocks additional {isWellnessPlan ? 'wellness roadmap areas, resources, calculators, and partner support' : 'wealth plans, resources, calculators, and deeper implementation support'}.
                </p>
              </div>
              <Button onClick={() => navigate('/join')} className="shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground">
                {fullImplementationLabel}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Expected Result */}
        {content.expected_result && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Expected Result
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pb-4">
              {content.expected_result.impact_range && (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">Impact</span>
                  <span className="text-sm font-semibold">{content.expected_result.impact_range}</span>
                </div>
              )}
              {content.expected_result.first_win_timeline && (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">First win</span>
                  <span className="text-sm font-semibold">{content.expected_result.first_win_timeline}</span>
                </div>
              )}
              {content.expected_result.confidence_note && (
                <p className="text-xs text-muted-foreground italic pt-1">{content.expected_result.confidence_note}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Before You Start */}
        {content.before_you_start && content.before_you_start.length > 0 && (
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Before You Start</h2>
              <p className="text-sm text-muted-foreground">Gather these before working through the plan</p>
            </div>
            <Card>
              <CardContent className="pt-4 pb-4">
                <ul className="space-y-2">
                  {content.before_you_start.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Observation prompts */}
        {content.observation_prompts && content.observation_prompts.length > 0 && (
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{isWellnessPlan ? 'What to Observe or Track' : 'What to Confirm First'}</h2>
              <p className="text-sm text-muted-foreground">Use these prompts before deciding the next action</p>
            </div>
            <Card>
              <CardContent className="pt-4 pb-4">
                <ul className="space-y-2">
                  {content.observation_prompts.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Member roadmap */}
        {content.locked_roadmap && content.locked_roadmap.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-700" />
                {isWellnessPlan ? 'Member Wellness Roadmap' : 'Member Wealth Roadmap'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <p className="text-sm text-muted-foreground">
                These additional matched areas stay attached to this {planLabel.toLowerCase()}. Membership unlocks the deeper resource path for each one.
              </p>
              <div className="flex flex-wrap gap-2">
                {content.locked_roadmap.map((item, i) => (
                  <Badge key={`${item}-${i}`} variant="outline" className="bg-background/70">{item}</Badge>
                ))}
              </div>
              <Button size="sm" onClick={() => navigate('/join')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {fullImplementationLabel}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Professional questions */}
        {content.professional_questions && content.professional_questions.length > 0 && (
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Questions for the Right Professional</h2>
              <p className="text-sm text-muted-foreground">Keep these for a safe, productive conversation</p>
            </div>
            <Card>
              <CardContent className="pt-4 pb-4">
                <ul className="space-y-2">
                  {content.professional_questions.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Requirements (legacy field) */}
        {content.requirements && (
          <div className="space-y-2">
            <h2 className="text-base font-semibold">Key Requirements</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{content.requirements}</p>
          </div>
        )}

        {/* Implementation Steps */}
        {content.steps && content.steps.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{stepSectionTitle}</h2>
              <p className="text-sm text-muted-foreground">Check off each step as you complete it</p>
            </div>
            <Card>
              <CardContent className="pt-4 pb-2">
                <PlanChecklist
                  steps={content.steps}
                  completedSteps={completedSteps}
                  onToggleStep={handleToggleStep}
                  disabled={updatePlan.isPending}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Risks & Mistakes to Avoid */}
        {content.risks_and_mistakes_to_avoid && content.risks_and_mistakes_to_avoid.length > 0 && (
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Risks & Mistakes to Avoid</h2>
              <p className="text-sm text-muted-foreground">Watch out for these common pitfalls</p>
            </div>
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-4 pb-4">
                <ul className="space-y-2">
                  {content.risks_and_mistakes_to_avoid.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Advisor Packet */}
        {content.advisor_packet && content.advisor_packet.length > 0 && (
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Advisor Packet</h2>
              <p className="text-sm text-muted-foreground">{advisorSectionSubtitle}</p>
            </div>
            <Card>
              <CardContent className="pt-4 pb-4">
                <ul className="space-y-2">
                  {content.advisor_packet.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Ready for next strategy? */}
        {isCompleted && latestAssessment && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Ready for your next strategy?
                </h3>
                <p className="text-sm text-muted-foreground">
                  You've completed this plan! Generate your next strategy to keep the momentum.
                </p>
              </div>
              <Button onClick={() => navigate(`/results/${latestAssessment.id}`)} className="shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground">
                Next Strategy <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Personal Notes */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Personal Notes</h2>
          <Textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setNotesChanged(true); }}
            placeholder="Add your personal notes, reminders, or observations..."
            rows={4}
          />
          {notesChanged && (
            <Button size="sm" onClick={handleSaveNotes} disabled={updatePlan.isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {updatePlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Notes
            </Button>
          )}
        </div>

        {/* Metadata footer */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Created {new Date(plan.created_at).toLocaleDateString()}</div>
          <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Updated {new Date(plan.updated_at).toLocaleDateString()}</div>
        </div>

        {/* Disclaimer (always shown for compliance) */}
        <div className="text-xs text-muted-foreground italic p-4 bg-muted/50 rounded-lg border">
          {content.disclaimer || 'Educational information only. Not tax, legal, or financial advice. Consult a qualified professional before acting on any strategy.'}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
