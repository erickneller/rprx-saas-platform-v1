import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export function NetlifyAssessmentShell({ mode, title, eyebrow, subtitle, disclaimer, sections, questions, onExit }: Props) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedPlanIds, setSavedPlanIds] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { saveResult, addPlan } = useNetlifyAssessmentPersistence();

  const visible = useMemo(() => visibleQuestions(questions, answers), [questions, answers]);
  const progress = useMemo(() => calculateProgress(questions, answers), [questions, answers]);
  const matches = useMemo(() => {
    return mode === 'financial' ? getFinancialMatches(answers) : getPhysicalMatches(answers);
  }, [answers, mode]);
  const resultPartition = useMemo(() => partitionResults(matches, 3), [matches]);

  const setAnswer = (id: string, value: 'yes' | 'no') => {
    setAnswers((current) => pruneHiddenAnswers(questions, { ...current, [id]: value }));
  };

  const jumpToFirstIncomplete = () => {
    const first = document.querySelector('[data-incomplete="true"]');
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = async () => {
    const partition = partitionResults(matches, 3);
    setSubmitted(true);
    saveResult.mutate({ mode, answers, matches, partition });
  };

  const handleAddPlan = async (match: FinancialTheme | PhysicalQuestionMatch) => {
    const existingPlanId = savedPlanIds[match.id];
    if (existingPlanId) {
      navigate(`/plans/${existingPlanId}`);
      return;
    }

    const saved = await addPlan.mutateAsync({ mode, match });
    setSavedPlanIds((current) => ({ ...current, [match.id]: saved.id }));
    navigate(`/plans/${saved.id}`);
    return saved;
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
              <Button onClick={() => navigate('/plans')} className="bg-[#2e7d5c] hover:bg-[#25684c]">
                View my plans
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
                        {'horseman' in match ? match.horseman || match.group : match.section}
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
                    <Button disabled={addPlan.isPending} onClick={() => handleAddPlan(match)} className="mt-5 bg-[#2e7d5c] hover:bg-[#25684c]">
                      {savedPlanIds[match.id] ? 'View my plan' : addPlan.isPending ? 'Saving…' : 'Add to my plan'}
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
                      <p className="text-sm text-[#496271]">{'horseman' in match ? match.horseman || match.group : match.section}</p>
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
    <div className="min-h-screen bg-[#f6f3ec] text-[#193247]">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={onExit} className="text-[#2a5d8f] hover:text-[#193247]">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="rounded-full border border-[#d9cfbd] bg-white px-4 py-2 text-sm font-semibold text-[#496271]">
            {progress.answered} answered
          </div>
        </div>

        <section className="rounded-[2rem] border border-[#d9cfbd] bg-white p-6 shadow-sm md:p-10">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-[#2e7d5c]">{eyebrow}</p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-[#496271]">{subtitle}</p>
          <div className="mt-7 h-3 overflow-hidden rounded-full bg-[#eadfce]">
            <div className="h-full rounded-full bg-[#2e7d5c] transition-all" style={{ width: `${progress.total ? (progress.answered / progress.total) * 100 : 0}%` }} />
          </div>
        </section>

        <div className="sticky top-0 z-10 my-6 -mx-4 overflow-x-auto border-y border-[#d9cfbd] bg-[#f6f3ec]/95 px-4 py-3 backdrop-blur">
          <div className="flex gap-2">
            {sections.map((section) => {
              const sectionQuestions = visible.filter((q) => q.section === section.id);
              const answerIds = sectionQuestions.flatMap((q) => q.type === 'matrix' ? visibleMatrixItems(q, answers).map((i) => i.id) : [q.id]);
              const done = answerIds.filter((id) => answers[id]).length;
              return (
                <a key={section.id} href={`#${section.id}`} className={cn('whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold', done === answerIds.length && answerIds.length ? 'border-[#2e7d5c] bg-[#2e7d5c] text-white' : 'border-[#d9cfbd] bg-white text-[#496271]')}>
                  {section.label} · {done}/{answerIds.length}
                </a>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {sections.map((section) => {
            const sectionQuestions = visible.filter((q) => q.section === section.id);
            if (!sectionQuestions.length) return null;
            return (
              <section key={section.id} id={section.id} className="rounded-[1.5rem] border border-[#d9cfbd] bg-white/90 p-5 shadow-sm md:p-7">
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2a5d8f]">Section</p>
                  <h2 className="font-serif text-3xl font-semibold">{section.label}</h2>
                  {section.blurb ? <p className="mt-1 text-[#496271]">{section.blurb}</p> : null}
                </div>
                <div className="space-y-4">
                  {sectionQuestions.map((question) => {
                    if (question.type === 'matrix') {
                      return (
                        <div key={question.id} className="rounded-2xl border border-[#eadfce] p-4">
                          <h3 className="font-semibold">{question.text}</h3>
                          {question.help ? <p className="mt-1 text-sm text-[#496271]">{question.help}</p> : null}
                          <div className="mt-4 space-y-3">
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

        <div className="mt-8 rounded-[1.5rem] border border-[#d9cfbd] bg-white p-5 shadow-sm md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <p className="font-semibold text-[#193247]">
              {progress.complete ? `${matches.length} ${mode === 'financial' ? 'strategy areas' : 'wellness topics'} ready.` : `${progress.left} remaining visible questions to complete this snapshot.`}
            </p>
            <p className="mt-1 text-sm text-[#496271]">{disclaimer}</p>
          </div>
          <div className="mt-4 flex gap-3 md:mt-0">
            {!progress.complete ? <Button variant="outline" onClick={jumpToFirstIncomplete}>Find next question</Button> : null}
            <Button disabled={!progress.complete || saveResult.isPending} onClick={handleSubmit} className="bg-[#2e7d5c] hover:bg-[#25684c]">
              <Sparkles className="mr-2 h-4 w-4" /> {saveResult.isPending ? 'Saving…' : 'See my matches'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionRow({ id, text, help, value, subtle, onChange }: { id: string; text: string; help?: string; value?: 'yes' | 'no'; subtle?: boolean; onChange: (id: string, value: 'yes' | 'no') => void }) {
  return (
    <div data-incomplete={value ? 'false' : 'true'} className={cn('rounded-2xl border p-4 transition', subtle ? 'border-[#eadfce] bg-[#f8f5ee]' : 'border-[#eadfce] bg-white')}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-medium text-[#193247]">{text}</p>
          {help ? <p className="mt-1 text-sm text-[#496271]">{help}</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          {yesNo.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={value === option.value ? 'default' : 'outline'}
              className={cn(value === option.value && option.value === 'yes' ? 'bg-[#2e7d5c] hover:bg-[#25684c]' : '', value === option.value && option.value === 'no' ? 'bg-[#2a5d8f] hover:bg-[#234f78]' : '')}
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
