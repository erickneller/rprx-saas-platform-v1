import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePlan, type CreatePlanInput } from '@/hooks/usePlans';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from '@/hooks/use-toast';
import type { AnswerMap, FinancialTheme, PhysicalQuestionMatch, ResultPartition } from '@/lib/rprx-assessments';

export type NetlifyMode = 'financial' | 'physical';
export type AssessmentStarterPlanMatch = {
  id: string;
  title?: string;
  name?: string;
  topic?: string;
  text?: string;
  category?: string;
  group?: string;
  horseman?: string;
  section?: string;
  blurb?: string;
  tactics?: string[];
  matchedReasons?: string[];
  hot?: boolean;
};
type NetlifyMatch = FinancialTheme | PhysicalQuestionMatch | AssessmentStarterPlanMatch;

type SaveResultInput = {
  resultId?: string | null;
  mode: NetlifyMode;
  answers: AnswerMap;
  matches: NetlifyMatch[];
  partition: ResultPartition<NetlifyMatch>;
};

type AddPlanInput = {
  mode: NetlifyMode;
  match: NetlifyMatch;
};

export type AddStarterPlanInput = {
  mode: NetlifyMode;
  matches: NetlifyMatch[];
  lockedMatches?: NetlifyMatch[];
};

function matchTitle(match: NetlifyMatch | { title?: string; name?: string; topic?: string; text?: string }) {
  if ('name' in match && match.name) return match.name;
  if ('title' in match && match.title) return match.title;
  return ('topic' in match ? match.topic : undefined) || ('text' in match ? match.text : undefined) || 'RPRx priority';
}

function matchCategory(match: NetlifyMatch) {
  const m = match as AssessmentStarterPlanMatch;
  return m.horseman || m.group || m.category || m.section || 'Health';
}

function planLabels(mode: NetlifyMode) {
  return mode === 'financial'
    ? { kind: 'wealth' as const, title: 'My RPRx Wealth Starter Plan', short: 'Wealth Plan', assessment: 'Wealth Assessment', resource: 'wealth resources', professional: 'CPA, EA, attorney, insurance advisor, or financial professional' }
    : { kind: 'wellness' as const, title: 'My RPRx Wellness Starter Plan', short: 'Wellness Plan', assessment: 'Health Assessment', resource: 'wellness resources', professional: 'qualified healthcare, wellness, or mental-health professional' };
}

function planInputForMatch({ mode, match }: AddPlanInput): CreatePlanInput {
  const title = matchTitle(match);
  const isFinancial = mode === 'financial' && 'tactics' in match;
  const steps = isFinancial
    ? match.tactics.slice(0, 5).map((tactic) => ({
        title: tactic,
        instruction: `Review this RPRx strategy area with the right professional advisor before acting: ${tactic}`,
        time_estimate: '15–30 minutes to prepare',
        done_definition: 'You understand whether this applies to your situation and have captured the next action.',
      }))
    : [
        {
          title: `Clarify your ${title} goal`,
          instruction: 'Write down what support you want, what you have already tried, and whether professional care is already involved.',
          time_estimate: '10 minutes',
          done_definition: 'You have a short summary you can share with a provider or RPRx resource partner.',
        },
        {
          title: 'Pick the safest next step',
          instruction: 'Use the RPRx resource path to choose a qualified professional, education resource, or habit-based first step.',
          time_estimate: '15 minutes',
          done_definition: 'A next appointment, resource, or habit step is selected.',
        },
      ];

  return {
    title,
    strategy_id: `netlify-${mode}-${match.id}`,
    strategy_name: title,
    content: {
      plan_schema: 'v1',
      summary: match.blurb || `RPRx ${mode} assessment match for ${title}.`,
      steps,
      horseman: [matchCategory(match)],
      disclaimer: mode === 'financial'
        ? 'Educational only. Review tax, legal, insurance, and financial strategies with qualified professionals.'
        : 'Educational wellness guidance only. This is not medical advice, diagnosis, or treatment.',
      before_you_start: [
        'Confirm the facts that made this assessment item relevant.',
        'Gather any documents, policy details, or notes needed for a productive professional conversation.',
      ],
      risks_and_mistakes_to_avoid: [
        'Do not implement strategy ideas without checking professional fit and compliance.',
        'Do not treat an educational wellness match as medical diagnosis or treatment.',
      ],
    },
    notes: `Added from the RPRx ${mode} assessment.`,
  };
}


export function planInputForStarterPlan({ mode, matches, lockedMatches = [] }: AddStarterPlanInput): CreatePlanInput {
  const labels = planLabels(mode);
  const topMatches = matches.slice(0, 3);
  const first = topMatches[0];
  const lockedRoadmap = lockedMatches.map(matchTitle).slice(0, 12);
  const steps = topMatches.map((match, index) => {
    const title = matchTitle(match);
    const category = matchCategory(match);
    const tactics = 'tactics' in match ? match.tactics.slice(0, 2) : [];
    const firstTactic = tactics[0] || `Review why ${title} surfaced as an RPRx priority.`;

    return {
      title: `Priority ${index + 1}: ${title}`,
      instruction: mode === 'financial'
        ? `Start with this wealth area: ${category}. ${firstTactic} Capture the facts you need before making a tax, legal, insurance, or wealth decision.`
        : `Start with this wellness area: ${category}. Write down what you are experiencing, what you have already tried, what patterns you notice, and what qualified support may be appropriate.`,
      time_estimate: mode === 'financial' ? '15–30 minutes to organize facts' : '10–20 minutes to observe and summarize',
      done_definition: mode === 'financial'
        ? 'You know the next wealth question to review with the right professional or RPRx resource.'
        : 'You have a safe, plain-English summary of this wellness priority and a next question/resource path.',
    };
  });

  return {
    title: labels.title,
    strategy_id: `rprx-${mode}-starter-plan`,
    strategy_name: first ? `${labels.short}: ${matchTitle(first)}` : labels.title,
    content: {
      plan_schema: 'v1',
      source_assessment_type: mode,
      plan_kind: labels.kind,
      plan_label: labels.short,
      summary: first
        ? `Your free RPRx ${labels.short} organizes the first ${topMatches.length} open priorities from your ${labels.assessment}, beginning with ${matchTitle(first)}.`
        : `Your free RPRx ${labels.short} organizes the top priorities from your ${labels.assessment}.`,
      steps,
      horseman: topMatches.map(matchCategory),
      locked_roadmap: lockedRoadmap,
      observation_prompts: mode === 'physical'
        ? ['What are you noticing day to day?', 'What have you already tried?', 'When does this get better or worse?', 'What would you like to ask a qualified professional?']
        : ['Which facts or documents affect this wealth area?', 'Which professional should review this before action?', 'What is the next safe implementation question?'],
      professional_questions: topMatches.map((match) => mode === 'financial'
        ? `What should I ask my advisor before acting on ${matchTitle(match)}?`
        : `What should I discuss with a qualified professional about ${matchTitle(match)}?`),
      expected_result: {
        impact_range: mode === 'financial' ? 'A clearer first wealth implementation path before upgrading' : 'A clearer first wellness support path before upgrading',
        first_win_timeline: 'Today',
        confidence_note: lockedRoadmap.length
          ? `Free users can review this ${labels.short}. Membership unlocks the remaining roadmap, ${labels.resource}, calculators, AI Advisor, and partner support.`
          : `Free users can review this ${labels.short}. Membership unlocks deeper ${labels.resource}, calculators, AI Advisor, and partner support.`,
      },
      before_you_start: mode === 'financial'
        ? ['Review the top wealth priorities from your assessment before making changes.', 'Gather account details, policies, tax documents, debt notes, or education-cost information that may affect the right next step.']
        : ['Review the first open wellness priorities from your assessment before making changes.', 'Write down symptoms, patterns, habits, screenings, current support, and questions that may help a qualified professional understand your situation.'],
      risks_and_mistakes_to_avoid: mode === 'financial'
        ? ['Do not treat an educational plan as individualized tax, legal, financial, or insurance advice.', 'Do not implement wealth strategies before confirming fit, compliance, costs, and timing with qualified professionals.']
        : ['Do not treat an educational wellness plan as medical advice, diagnosis, or treatment.', 'Do not delay urgent care or replace professional guidance with an app-generated plan.', 'Do not jump to advanced changes before confirming what is safe for your situation.'],
      advisor_packet: [`Bring this ${labels.short} to a ${labels.professional} when appropriate.`],
      disclaimer: mode === 'financial'
        ? 'Educational only. Review tax, legal, insurance, and wealth strategies with qualified professionals.'
        : 'Educational wellness guidance only. This is not medical advice, diagnosis, or treatment.',
    },
    notes: `Built from the RPRx ${labels.assessment} as a free ${labels.short}.`,
  };
}

function compactMatch(match: NetlifyMatch) {
  return {
    id: match.id,
    title: matchTitle(match),
    category: matchCategory(match),
    blurb: match.blurb ?? '',
    hot: 'hot' in match ? Boolean(match.hot) : false,
    tactics: 'tactics' in match ? match.tactics.slice(0, 10) : undefined,
    matchedReasons: match.matchedReasons ?? [],
  };
}

export function useNetlifyAssessmentPersistence() {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const queryClient = useQueryClient();
  const createPlan = useCreatePlan();

  const saveResult = useMutation({
    mutationFn: async ({ resultId, mode, answers, matches, partition }: SaveResultInput) => {
      if (!user) return { previewOnly: true };
      const first = matches[0];
      const payload = {
        assessment_type: mode,
        answers,
        matches: matches.map(compactMatch),
        free_matches: partition.free.map(compactMatch),
        locked_matches: partition.locked.map(compactMatch),
        top_match_id: first?.id ?? null,
        top_match_name: first ? matchTitle(first) : null,
      };

      if (resultId) {
        const { data, error } = await (supabase as any)
          .from('rprx_netlify_assessment_results')
          .update(payload)
          .eq('id', resultId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      const { data, error } = await (supabase as any)
        .from('rprx_netlify_assessment_results')
        .insert({
          user_id: user.id,
          ...payload,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['netlifyAssessmentResults'] });
      queryClient.invalidateQueries({ queryKey: ['healthAssessments'] });
      queryClient.invalidateQueries({ queryKey: ['assessmentHistory'] });
      if (data?.previewOnly) return;
      supabase.functions.invoke('ghl-sync', {
        body: {
          source: 'netlify-assessment-result',
          assessmentResultId: data.id,
          changedKeys: ['latest_netlify_assessment'],
        },
      }).catch((err) => {
        console.warn('Netlify assessment GHL sync skipped/failed:', err);
      });
      toast({ title: 'Assessment result saved' });
    },
    onError: () => {
      toast({
        title: 'Result not saved yet',
        description: 'The preview results are still visible, but the new Supabase table/migration may need to be applied.',
        variant: 'destructive',
      });
    },
  });

  const addPlan = useMutation({
    mutationFn: async (input: AddPlanInput) => createPlan.mutateAsync(planInputForMatch(input)),
    onSuccess: () => {
      toast({ title: 'Added to your plan' });
    },
    onError: () => {
      toast({ title: 'Could not add plan', description: 'Please try again after confirming you are signed in.', variant: 'destructive' });
    },
  });

  const addStarterPlan = useMutation({
    mutationFn: async (input: AddStarterPlanInput) => {
      if (user && tier === 'free') {
        const { data: existing } = await supabase
          .from('saved_plans')
          .select('id')
          .eq('user_id', user.id)
          .eq('strategy_id', `rprx-${input.mode}-starter-plan`)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (existing?.id) return existing;
      }

      return createPlan.mutateAsync(planInputForStarterPlan(input));
    },
    onSuccess: () => {
      toast({ title: 'Starter plan built' });
    },
    onError: () => {
      toast({ title: 'Could not build starter plan', description: 'Please try again after confirming you are signed in.', variant: 'destructive' });
    },
  });

  return {
    saveResult,
    addPlan,
    addStarterPlan,
  };
}
