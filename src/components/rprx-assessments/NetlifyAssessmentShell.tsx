import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AnswerMap, AssessmentQuestion, AssessmentSection, FinancialTheme, PhysicalQuestionMatch } from '@/lib/rprx-assessments';
import {
  calculateProgress,
  getFinancialMatches,
  getPhysicalMatches,
  partitionResults,
  pruneHiddenAnswers,
  visibleMatrixItems,
  visibleQuestions,
} from '@/lib/rprx-assessments';
import { cn } from '@/lib/utils';
import { useNetlifyAssessmentPersistence } from '@/hooks/useNetlifyAssessmentPersistence';

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

  const setAnswer = (id: string, value: 'yes' | 'no') => {
    setAnswers((current) => pruneHiddenAnswers(questions, { ...current, [id]: value }));
  };

  const jumpToFirstIncomplete = () => {
    const first = document.querySelector('[data-incomplete="true"]');
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    first?.classList.add('ring-2', 'ring-amber-300', 'bg-amber-50');
    window.setTimeout(() => first?.classList.remove('ring-2', 'ring-amber-300', 'bg-amber-50'), 1200);
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
    const saved = await addStarterPlan.mutateAsync({ mode, matches: resultPartition.free });
    setStarterPlanId(saved.id);
    navigate(`/plans/${saved.id}`);
  };


  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f6f3ec] text-[#193247]">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
          <Button variant="ghost" onClick={() => setSubmitted(false)} className="mb-6 text-[#2a5d8f] hover:text-[#193247]">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to assessment
          </Button>

          <div className="rounded-[2rem] border border-[#d9cfbd] bg-white/90 p-6 shadow-sm md:p-10">
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-[#2e7d5c]">{eyebrow} · Results</p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">Your matched RPRx areas</h1>
            <p className="mt-4 max-w-3xl text-lg text-[#496271]">
              {matches.length
                ? `Your answers surfaced ${matches.length} relevant ${mode === 'financial' ? 'strategy areas' : 'wellness topics'}. The first three are unlocked in the free report; the rest become your member/library path.`
                : 'No priority areas were triggered from this answer pattern. If something important is missing, go back and update any answers before sharing this snapshot.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button disabled={addStarterPlan.isPending || !resultPartition.free.length} onClick={handleStarterPlan} className="bg-[#2e7d5c] hover:bg-[#25684c]">
                {starterPlanId ? 'View My Starter Plan' : addStarterPlan.isPending ? 'Building…' : 'Build My Starter Plan'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/assessments')} className="border-[#2a5d8f] text-[#2a5d8f] hover:bg-[#2a5d8f]/10">
                Return to My Assessments
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <div className="space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#2a5d8f]">Free report</h2>
              {resultPartition.free.map((match) => (
                <Card key={match.id} className="overflow-hidden border-[#d9cfbd] bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[#2e7d5c]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#2e7d5c]">
                        {matchCategory(match)}
                      </span>
                      {'hot' in match && match.hot ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Hot match</span> : null}
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-[#193247]">{'name' in match ? match.name : match.topic}</h3>
                    <p className="mt-2 text-[#496271]">{match.blurb}</p>
                    <p className="mt-4 text-sm font-medium text-[#2a5d8f]">{reasonLabel(match)}</p>
                    {'tactics' in match && match.tactics?.length ? (
                      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[#496271]">
                        {match.tactics.slice(0, 3).map((tactic) => <li key={tactic}>{tactic}</li>)}
                      </ul>
                    ) : null}
                    <Button disabled={addStarterPlan.isPending || !resultPartition.free.length} onClick={handleStarterPlan} className="mt-5 bg-[#2e7d5c] hover:bg-[#25684c]">
                      {starterPlanId ? 'View My Starter Plan' : addStarterPlan.isPending ? 'Building…' : 'Build My Starter Plan'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#2a5d8f]">Member/library path</h2>
              <Card className="border-[#d9cfbd] bg-[#193247] text-white shadow-sm">
                <CardContent className="p-6">
                  <Lock className="mb-4 h-8 w-8 text-[#f3cf6b]" />
                  <h3 className="font-serif text-2xl font-semibold">Unlock the full RPRx library</h3>
                  <p className="mt-2 text-white/75">
                    Members can unlock the full library path, save priorities to a plan, and get routed to the right next step based on these results.
                  </p>
                </CardContent>
              </Card>
              {resultPartition.locked.map((match) => (
                <div key={match.id} className="rounded-2xl border border-[#d9cfbd] bg-white/70 p-5 opacity-80">
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-[#2a5d8f]" />
                    <div>
                      <h4 className="font-semibold text-[#193247]">{'name' in match ? match.name : match.topic}</h4>
                      <p className="text-sm text-[#496271]">{matchCategory(match)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
