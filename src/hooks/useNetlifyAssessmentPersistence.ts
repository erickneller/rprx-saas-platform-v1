import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePlan, type CreatePlanInput } from '@/hooks/usePlans';
import { toast } from '@/hooks/use-toast';
import type { AnswerMap, FinancialTheme, PhysicalQuestionMatch, ResultPartition } from '@/lib/rprx-assessments';

type NetlifyMode = 'financial' | 'physical';
type NetlifyMatch = FinancialTheme | PhysicalQuestionMatch;

type SaveResultInput = {
  mode: NetlifyMode;
  answers: AnswerMap;
  matches: NetlifyMatch[];
  partition: ResultPartition<NetlifyMatch>;
};

type AddPlanInput = {
  mode: NetlifyMode;
  match: NetlifyMatch;
};

function matchTitle(match: NetlifyMatch) {
  return 'name' in match ? match.name : match.topic || match.text;
}

function matchCategory(match: NetlifyMatch) {
  if ('horseman' in match) return match.horseman || match.group || match.category || 'Financial';
  return match.section || 'Physical';
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
    notes: `Added from Netlify-style ${mode} assessment preview.`,
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
  const queryClient = useQueryClient();
  const createPlan = useCreatePlan();

  const saveResult = useMutation({
    mutationFn: async ({ mode, answers, matches, partition }: SaveResultInput) => {
      if (!user) return { previewOnly: true };
      const first = matches[0];

      const { data, error } = await (supabase as any)
        .from('rprx_netlify_assessment_results')
        .insert({
          user_id: user.id,
          assessment_type: mode,
          answers,
          matches: matches.map(compactMatch),
          free_matches: partition.free.map(compactMatch),
          locked_matches: partition.locked.map(compactMatch),
          top_match_id: first?.id ?? null,
          top_match_name: first ? matchTitle(first) : null,
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

  return {
    saveResult,
    addPlan,
  };
}
