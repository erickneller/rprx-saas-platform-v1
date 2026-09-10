import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Library, Lock, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AnswerMap, AssessmentQuestion, AssessmentSection, FinancialTheme, PhysicalQuestionMatch } from '@/lib/rprx-assessments';
import {
  calculateProgress,
  financialAssessmentMeta,
  getFinancialMatches,
  getPhysicalMatches,
  partitionResults,
  physicalSolutions,
  pruneHiddenAnswers,
  visibleMatrixItems,
  visibleQuestions,
} from '@/lib/rprx-assessments';
import { cn } from '@/lib/utils';
import { useNetlifyAssessmentPersistence } from '@/hooks/useNetlifyAssessmentPersistence';
import { useUpgradeGate } from '@/contexts/UpgradeGateContext';

type Mode = 'financial' | 'physical';

type Props = {
  mode: Mode;
  title: string;
  eyebrow: string;
  subtitle: string;
  disclaimer: string;
  sections: AssessmentSection[];
  questions: AssessmentQuestion[];
  onExit?: () => void;
};

const yesNo = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

function reasonLabel(match: FinancialTheme | PhysicalQuestionMatch) {
  const reasons = match.matchedReasons ?? [];
  if (!reasons.length) return 'Based on your assessment answers.';
  return `Triggered by ${reasons.slice(0, 2).map((r) => `${r.q}: ${r.is}`).join(', ')}.`;
}

function matchTitle(match: FinancialTheme | PhysicalQuestionMatch) {
  return 'name' in match ? match.name : match.topic;
}

function matchCategory(match: FinancialTheme | PhysicalQuestionMatch) {
  return 'name' in match ? match.horseman || match.group : match.section;
}

function resultNoun(mode: Mode) {
  return mode === 'financial' ? 'strategy areas' : 'areas where you asked for help';
}

function tacticCount(matches: readonly (FinancialTheme | PhysicalQuestionMatch)[]) {
  return matches.reduce((total, match) => total + ('tactics' in match ? match.tactics.length : 0), 0);
}

function physicalPartnerMatches(matches: readonly (FinancialTheme | PhysicalQuestionMatch)[]) {
  const seen = new Set<string>();
  return matches.flatMap((match) => {
    if ('tactics' in match) return [];
    const options = physicalSolutions[match.topic ?? match.id] ?? [];
    return options.filter((option) => {
      if (seen.has(option.t)) return false;
      seen.add(option.t);
      return true;
    });
  });
}

const financialPartnerMatches = [
  {
    t: 'Darvis, Nutter & Associates',
    b: 'Wealth strategies · implementation partner for tax, legal, accounting, and entity-structure review.',
    url: '/partners',
  },
  {
    t: 'AskFrost',
    b: 'Implementation support for strategy organization, resource guidance, and follow-through.',
    url: '/partners',
  },
];

export function NetlifyAssessmentShell({ mode, title, eyebrow, subtitle, disclaimer, sections, questions, onExit }: Props) {
  const location = useLocation();
  const editDraft = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const resultId = params.get('editResultId');
    if (!resultId || typeof window === 'undefined') return null;
    try {
      const raw = window.sessionStorage.getItem('rprx-edit-assessment');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { id?: string; mode?: Mode; answers?: AnswerMap; completedAt?: string };
      if (parsed.id !== resultId || parsed.mode !== mode || !parsed.answers) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [location.search, mode]);
  const [answers, setAnswers] = useState<AnswerMap>(() => editDraft?.answers ?? {});
  const [submitted, setSubmitted] = useState(false);
  const [editingResultId] = useState<string | null>(() => editDraft?.id ?? null);
  const [starterPlanId, setStarterPlanId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { requireUpgrade } = useUpgradeGate();
  const { saveResult, addStarterPlan } = useNetlifyAssessmentPersistence();

  const visible = useMemo(() => visibleQuestions(questions, answers), [questions, answers]);
  const progress = useMemo(() => calculateProgress(questions, answers), [questions, answers]);
  const matches = useMemo(() => {
    return mode === 'financial' ? getFinancialMatches(answers) : getPhysicalMatches(answers);
  }, [answers, mode]);
  const freeResultCount = mode === 'financial' ? matches.length : 3;
  const resultPartition = useMemo(
    () => partitionResults<FinancialTheme | PhysicalQuestionMatch>(matches as readonly (FinancialTheme | PhysicalQuestionMatch)[], freeResultCount),
    [matches, freeResultCount],
  );
  const progressPercent = progress.total ? Math.round((progress.answered / progress.total) * 100) : 0;
  const resultMatches = matches as (FinancialTheme | PhysicalQuestionMatch)[];
  const totalStrategies = mode === 'financial' ? tacticCount(resultMatches) : 0;
  const partnerMatches = mode === 'financial' ? financialPartnerMatches : physicalPartnerMatches(resultMatches);
  const otherAssessmentPath = mode === 'financial' ? '/health-assessment' : '/assessment';
  const otherAssessmentLabel = mode === 'financial' ? 'Take the Health Assessment' : 'Take the Wealth Assessment';
  const starterPlanLabel = mode === 'financial' ? 'Wealth Plan' : 'Wellness Plan';
  const buildStarterLabel = mode === 'financial' ? 'Build My Wealth Starter Plan' : 'Build My Wellness Starter Plan';
  const viewStarterLabel = mode === 'financial' ? 'View My Wealth Plan' : 'View My Wellness Plan';
  const addStarterLabel = mode === 'financial' ? 'Add to My Wealth Plan' : 'Add to My Wellness Plan';

  const setAnswer = (id: string, value: 'yes' | 'no') => {
    setAnswers((current) => pruneHiddenAnswers(questions, { ...current, [id]: value }));
  };

  const jumpToFirstIncomplete = () => {
    const first = document.querySelector<HTMLElement>('[data-incomplete="true"]');
    if (!first) return;

    const stickyOffset = window.matchMedia('(max-width: 640px)').matches ? 230 : 190;
    const targetTop = Math.max(0, first.getBoundingClientRect().top + window.scrollY - stickyOffset);
    window.scrollTo({ top: targetTop, behavior: 'smooth' });
    first.classList.add('ring-2', 'ring-amber-300', 'bg-amber-50');
    window.setTimeout(() => first.classList.remove('ring-2', 'ring-amber-300', 'bg-amber-50'), 1200);
  };

  const handleSubmit = async () => {
    const partition = partitionResults<FinancialTheme | PhysicalQuestionMatch>(matches as readonly (FinancialTheme | PhysicalQuestionMatch)[], freeResultCount);
    setSubmitted(true);
    saveResult.mutate({
      resultId: editingResultId,
      mode,
      answers,
      matches: matches as (FinancialTheme | PhysicalQuestionMatch)[],
      partition,
    });
  };

  useEffect(() => {
    if (submitted) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [submitted]);

  const handleStarterPlan = async () => {
    if (starterPlanId) {
      navigate(`/plans/${starterPlanId}`);
      return;
    }
    const saved = await addStarterPlan.mutateAsync({ mode, matches: resultPartition.free, lockedMatches: resultPartition.locked });
    setStarterPlanId(saved.id);
    navigate(`/plans/${saved.id}`);
  };


  if (submitted) {
    const freeCount = resultPartition.free.length;
    const lockedCount = resultPartition.locked.length;
    const headline = matches.length
      ? mode === 'financial'
        ? `${matches.length} strategy areas fit your situation.`
        : `You asked for help in ${matches.length} areas.`
      : 'No priority areas were triggered from this answer pattern.';
    const subline = matches.length
      ? mode === 'financial'
        ? `${totalStrategies || financialAssessmentMeta.strategyCount} strategies are open below — free. Membership unlocks the implementation guides, documents, calculators, and AI Advisor.`
        : `Your first ${Math.min(3, freeCount)} areas are open below — free. Membership unlocks the remaining ${lockedCount} areas plus implementation resources and partner paths.`
      : 'If something important is missing, go back and update any answers before sharing this snapshot.';

    return (
      <div className="min-h-screen bg-[#f6f3ec] text-[#193247]">
        <section className="bg-[#193247] text-white">
          <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
            <Button variant="ghost" onClick={() => setSubmitted(false)} className="mb-6 text-white/80 hover:bg-white/10 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to assessment
            </Button>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-[#9fc6b1]">{eyebrow} · Results</p>
            <h1 className="max-w-4xl font-serif text-4xl font-semibold tracking-tight md:text-6xl">{headline}</h1>
            <p className="mt-4 max-w-3xl text-lg text-white/75">{subline}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-3xl font-bold text-white">{matches.length}</p>
                <p className="text-sm text-white/70">Matched {resultNoun(mode)}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-3xl font-bold text-white">{mode === 'financial' ? freeCount : Math.min(3, freeCount)}</p>
                <p className="text-sm text-white/70">Open in the free report</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-3xl font-bold text-white">{mode === 'financial' ? totalStrategies || financialAssessmentMeta.strategyCount : lockedCount}</p>
                <p className="text-sm text-white/70">{mode === 'financial' ? 'Strategies surfaced' : 'Member areas remaining'}</p>
              </div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button disabled={addStarterPlan.isPending || !resultPartition.free.length} onClick={handleStarterPlan} className="bg-[#2e7d5c] hover:bg-[#25684c]">
                <FileText className="mr-2 h-4 w-4" /> {starterPlanId ? viewStarterLabel : addStarterPlan.isPending ? 'Building…' : buildStarterLabel}
              </Button>
              <Button variant="outline" onClick={() => requireUpgrade({ requiredTier: 'partner' })} className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Sparkles className="mr-2 h-4 w-4" /> Become a member
              </Button>
              <Button variant="ghost" onClick={() => navigate(otherAssessmentPath)} className="text-white/80 hover:bg-white/10 hover:text-white">
                {otherAssessmentLabel}
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
          <div className="mb-6 rounded-2xl border border-[#c6d9cc] bg-[#e9f4ed] p-4 text-sm font-semibold text-[#25684c]">
            {mode === 'financial'
              ? 'Every strategy area this assessment matched to you is visible in the free report. Membership is for implementation — guides, documents, calculators, the AI Advisor, and the complete resource library.'
              : `Your first ${Math.min(3, freeCount)} matched areas are open free. The remaining matched areas stay visible as your member roadmap.`}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#2a5d8f]">Free report</p>
                <h2 className="mt-1 font-serif text-3xl font-semibold text-[#193247]">
                  {mode === 'financial' ? 'Your matched wealth strategy areas' : 'Your first open wellness areas'}
                </h2>
              </div>
              {resultPartition.free.map((match, index) => (
                <Card key={match.id} className="overflow-hidden border-[#d9cfbd] bg-white shadow-sm">
                  <CardContent className="p-0">
                    <div className="border-b border-[#eadfce] bg-[#fbf8f1] px-6 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full bg-[#2e7d5c]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#2e7d5c]">
                          {matchCategory(match)}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#496271]">Open · free</span>
                      </div>
                      <h3 className="mt-3 font-serif text-2xl font-semibold text-[#193247]">{index + 1}. {matchTitle(match)}</h3>
                    </div>
                    <div className="p-6">
                      <p className="text-[#496271]">{match.blurb}</p>
                      <p className="mt-4 text-sm font-medium text-[#2a5d8f]">{reasonLabel(match)}</p>
                      {'tactics' in match && match.tactics?.length ? (
                        <div className="mt-5 rounded-2xl border border-[#eadfce] bg-[#f8f5ee] p-4">
                          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2a5d8f]">Strategy preview</p>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-[#496271]">
                            {match.tactics.slice(0, 5).map((tactic) => <li key={tactic}>{tactic}</li>)}
                          </ul>
                        </div>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-[#eadfce] bg-[#f8f5ee] p-4 text-sm text-[#496271]">
                          <p className="font-semibold text-[#193247]">Your next step</p>
                          <p className="mt-1">Capture what you are experiencing, what you have tried, and which qualified support path may be appropriate.</p>
                        </div>
                      )}
                      <Button disabled={addStarterPlan.isPending || !resultPartition.free.length} onClick={handleStarterPlan} className="mt-5 bg-[#2e7d5c] hover:bg-[#25684c]">
                        {starterPlanId ? viewStarterLabel : addStarterPlan.isPending ? 'Building…' : addStarterLabel}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!matches.length ? (
                <Card className="border-[#d9cfbd] bg-white shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-serif text-2xl font-semibold">Nothing matched yet</h3>
                    <p className="mt-2 text-[#496271]">Use the back button to adjust your answers if you expected to see a specific RPRx area.</p>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <aside className="space-y-5">
              <Card className="border-[#d9cfbd] bg-white shadow-sm">
                <CardContent className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2e7d5c]">Your next step — implement it</p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold text-[#193247]">Turn this result into your RPRx plan</h3>
                  <p className="mt-2 text-sm text-[#496271]">The free result tells you what surfaced. The {starterPlanLabel} gives you a focused workspace for the first moves.</p>
                  <Button disabled={addStarterPlan.isPending || !resultPartition.free.length} onClick={handleStarterPlan} className="mt-5 w-full bg-[#2e7d5c] hover:bg-[#25684c]">
                    <FileText className="mr-2 h-4 w-4" /> {starterPlanId ? viewStarterLabel : buildStarterLabel}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-[#d9cfbd] bg-[#193247] text-white shadow-sm">
                <CardContent className="p-6">
                  <Library className="mb-4 h-8 w-8 text-[#f3cf6b]" />
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#9fc6b1]">Member path</p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold">Become an RPRx member</h3>
                  <p className="mt-2 text-sm text-white/75">Unlock implementation guides, documents, calculators, resource libraries, AI Advisor support, and the full wealth + health roadmap.</p>
                  <ul className="mt-4 space-y-2 text-sm text-white/80">
                    <li>→ Full implementation library</li>
                    <li>→ Documents, calculators, and guide paths</li>
                    <li>→ AI Advisor and updated strategy resources</li>
                  </ul>
                  <Button onClick={() => requireUpgrade({ requiredTier: 'partner' })} className="mt-5 w-full bg-white text-[#193247] hover:bg-white/90">
                    Become a member
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-[#d9cfbd] bg-white shadow-sm">
                <CardContent className="p-6">
                  <UserRound className="mb-4 h-8 w-8 text-[#2a5d8f]" />
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a5d8f]">Resource partner path</p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold text-[#193247]">Get help from the right partner</h3>
                  <p className="mt-2 text-sm text-[#496271]">RPRx can route you toward resource partners based on the areas your answers surfaced.</p>
                  <div className="mt-4 space-y-3">
                    {partnerMatches.slice(0, 3).map((partner) => (
                      <div key={partner.t} className="rounded-2xl border border-[#eadfce] bg-[#f8f5ee] p-3">
                        <p className="font-semibold text-[#193247]">{partner.t}</p>
                        <p className="mt-1 text-sm text-[#496271]">{partner.b}</p>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" onClick={() => navigate('/partners')} className="mt-5 w-full border-[#2a5d8f] text-[#2a5d8f] hover:bg-[#2a5d8f]/10">
                    View partner introductions
                  </Button>
                </CardContent>
              </Card>

              {lockedCount ? (
                <div className="space-y-3">
                  <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#2a5d8f]">Member roadmap</p>
                  {resultPartition.locked.map((match) => (
                    <div key={match.id} className="rounded-2xl border border-[#d9cfbd] bg-white/75 p-4 opacity-90">
                      <div className="flex items-center gap-3">
                        <Lock className="h-4 w-4 text-[#2a5d8f]" />
                        <div>
                          <h4 className="font-semibold text-[#193247]">{matchTitle(match)}</h4>
                          <p className="text-sm text-[#496271]">{matchCategory(match)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <Card className="border-[#d9cfbd] bg-white shadow-sm">
                <CardContent className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a5d8f]">Complete the RPRx picture</p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold text-[#193247]">Add the other side of your wellness plan</h3>
                  <p className="mt-2 text-sm text-[#496271]">RPRx is built around both wealth and health. Take the other assessment to complete your profile.</p>
                  <Button variant="outline" onClick={() => navigate(otherAssessmentPath)} className="mt-5 w-full border-[#2a5d8f] text-[#2a5d8f] hover:bg-[#2a5d8f]/10">
                    {otherAssessmentLabel}
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>

          <p className="mt-8 rounded-2xl border border-[#d9cfbd] bg-white/70 p-4 text-sm text-[#496271]">{disclaimer}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ec] pb-28 text-[#193247] md:pb-24">
      <div className="sticky top-0 z-[60] border-b border-[#d9cfbd] bg-[#f6f3ec]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" onClick={onExit} className="shrink-0 text-[#2a5d8f] hover:text-[#193247]">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-lg font-semibold text-[#193247]">RPRx</p>
            <p className="hidden truncate text-xs font-semibold uppercase tracking-[0.18em] text-[#496271] sm:block">Without changing lifestyle</p>
          </div>
          <div className="rounded-full border border-[#d9cfbd] bg-white px-4 py-2 text-sm font-semibold text-[#496271]">
            {progress.answered}/{progress.total} answered
          </div>
        </div>
      </div>

      <div className="sticky top-[65px] z-50 border-b border-[#d9cfbd] bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[820px] px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm font-semibold">
            <span className="truncate text-[#193247]">{title}</span>
            <span className="shrink-0 text-[#496271]">{progressPercent}% complete</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#eadfce]">
            <div className="h-full rounded-full bg-[#2e7d5c] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((section) => {
              const sectionQuestions = visible.filter((q) => q.section === section.id);
              const answerIds = sectionQuestions.flatMap((q) => q.type === 'matrix' ? visibleMatrixItems(q, answers).map((i) => i.id) : [q.id]);
              const done = answerIds.filter((id) => answers[id]).length;
              const complete = done === answerIds.length && answerIds.length > 0;
              return (
                <a key={section.id} href={`#${section.id}`} className={cn('flex whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition', complete ? 'border-[#2e7d5c] bg-[#2e7d5c]/10 text-[#25684c]' : 'border-[#d9cfbd] bg-white text-[#496271] hover:border-[#2a5d8f] hover:text-[#2a5d8f]')}>
                  <span className={cn('mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-40', complete && 'opacity-100')} />
                  {section.label} · {done}/{answerIds.length}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-[820px] px-4 py-6 md:py-9">
        <section className="rounded-[2rem] border border-[#d9cfbd] bg-white p-6 shadow-sm md:p-10">
          {editingResultId ? (
            <div className="mb-4 rounded-2xl border border-[#2e7d5c]/20 bg-[#2e7d5c]/10 p-4 text-sm font-medium text-[#193247]">
              Editing a saved RPRx assessment result. Update any answers, then save again to refresh the matches shown in My Assessments.
            </div>
          ) : null}
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-[#2e7d5c]">{eyebrow}</p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-[#496271]">{subtitle}</p>
        </section>

        <div className="mt-6 space-y-6">
          {sections.map((section) => {
            const sectionQuestions = visible.filter((q) => q.section === section.id);
            if (!sectionQuestions.length) return null;
            return (
              <section key={section.id} id={section.id} className="scroll-mt-[210px] overflow-hidden rounded-[1.5rem] border border-[#d9cfbd] bg-white/90 shadow-sm">
                <div className="flex items-start justify-between gap-4 border-b border-[#eadfce] bg-[#fbf8f1] px-5 py-4 md:px-7">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a5d8f]">Section</p>
                    <h2 className="font-serif text-3xl font-semibold">{section.label}</h2>
                    {section.blurb ? <p className="mt-1 text-[#496271]">{section.blurb}</p> : null}
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-[#496271]">{sectionQuestions.length} items</p>
                </div>
                <div className="px-5 py-2 md:px-7">
                  {sectionQuestions.map((question) => {
                    if (question.type === 'matrix') {
                      return (
                        <div key={question.id} className="border-b border-[#eadfce] py-4 last:border-b-0">
                          <h3 className="font-semibold">{question.text}</h3>
                          {question.help ? <p className="mt-1 text-sm text-[#496271]">{question.help}</p> : null}
                          <div className="mt-2">
                            {visibleMatrixItems(question, answers).map((item) => (
                              <QuestionRow key={item.id} id={item.id} text={item.label} value={answers[item.id]} onChange={setAnswer} />
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return <QuestionRow key={question.id} id={question.id} text={question.text} help={question.help} value={answers[question.id]} onChange={setAnswer} subtle={question.sub} />;
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <p className="mt-8 rounded-2xl border border-[#d9cfbd] bg-white/70 p-4 text-sm text-[#496271]">{disclaimer}</p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-[#d9cfbd] bg-white/95 shadow-[0_-12px_30px_rgba(25,50,71,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-[820px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-[#193247]">
              {progress.complete
                ? `All ${progress.total} answered. ${matches.length} ${mode === 'financial' ? 'strategy areas' : 'areas where you asked for help'} ready.`
                : `${progress.left} ${progress.left === 1 ? 'question' : 'questions'} left`}
            </p>
            <p className="text-sm text-[#496271]">
              {progress.complete ? 'Your personalized RPRx results are ready.' : 'Answer the visible questions above, or jump to the next blank item.'}
            </p>
          </div>
          <div className="flex gap-3">
            {!progress.complete ? <Button variant="outline" onClick={jumpToFirstIncomplete}>Show me what’s left</Button> : null}
            <Button disabled={!progress.complete || saveResult.isPending} onClick={handleSubmit} className="bg-[#2e7d5c] hover:bg-[#25684c]">
              <Sparkles className="mr-2 h-4 w-4" /> {saveResult.isPending ? 'Saving…' : editingResultId ? 'Update results' : mode === 'financial' ? 'See my strategies' : 'See my areas'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionRow({ id, text, help, value, subtle, onChange }: { id: string; text: string; help?: string; value?: 'yes' | 'no'; subtle?: boolean; onChange: (id: string, value: 'yes' | 'no') => void }) {
  return (
    <div data-incomplete={value ? 'false' : 'true'} className={cn('scroll-mt-[210px] border-b border-[#eadfce] py-4 transition last:border-b-0', subtle && 'ml-3 border-l-2 border-b-[#eadfce] border-l-[#d7e7f8] pl-4')}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-5">
        <div className="flex-1">
          <p className="text-[15.5px] font-medium leading-relaxed text-[#193247]">{text}</p>
          {help ? <p className="mt-1 text-sm leading-relaxed text-[#496271]">{help}</p> : null}
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-full border border-[#d9cfbd] bg-[#f6f3ec]">
          {yesNo.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant="ghost"
              className={cn(
                'h-10 rounded-none border-0 px-5 font-semibold text-[#496271] hover:bg-[#d7e7f8] hover:text-[#2a5d8f]',
                value === option.value && option.value === 'yes' ? 'bg-[#2e7d5c] text-white hover:bg-[#25684c] hover:text-white' : '',
                value === option.value && option.value === 'no' ? 'bg-[#2a5d8f] text-white hover:bg-[#234f78] hover:text-white' : '',
              )}
              onClick={() => onChange(id, option.value)}
            >
              {value === option.value ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
