import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface StructuredPlanStep {
  title: string;
  instruction: string;
  time_estimate: string;
  done_definition: string;
}

export interface ExpectedResult {
  impact_range: string;
  first_win_timeline: string;
  confidence_note: string;
}

export interface PlanContent {
  /** Steps may be legacy string[] or new structured StructuredPlanStep[]. */
  steps: Array<string | StructuredPlanStep>;
  summary?: string;
  horseman?: string[];
  savings?: string;
  complexity?: number;
  requirements?: string;
  taxReference?: string;
  disclaimer?: string;
  completedSteps?: number[];
  estimated_impact?: { low: number; high: number; source: string };
  /** Assessment-derived starter-plan metadata. Internal source ids may remain financial/physical; labels are customer-facing. */
  source_assessment_type?: 'financial' | 'physical';
  plan_label?: string;
  plan_kind?: 'wealth' | 'wellness' | 'strategy';
  locked_roadmap?: string[];
  professional_questions?: string[];
  observation_prompts?: string[];
  /** Structured-plan v1 fields (optional, backward-compatible). */
  plan_schema?: 'v1';
  expected_result?: ExpectedResult;
  before_you_start?: string[];
  risks_and_mistakes_to_avoid?: string[];
  advisor_packet?: string[];
}

export interface SavedPlan {
  id: string;
  user_id: string;
  title: string;
  strategy_id: string | null;
  strategy_name: string;
  content: PlanContent;
  status: 'not_started' | 'in_progress' | 'completed';
  notes: string | null;
  is_focus: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanInput {
  title: string;
  strategy_id?: string;
  strategy_name: string;
  content: PlanContent;
  notes?: string;
}

export interface UpdatePlanInput {
  id: string;
  title?: string;
  status?: 'not_started' | 'in_progress' | 'completed';
  notes?: string | null;
  content?: PlanContent;
  is_focus?: boolean;
}

function parsePlanContent(json: Json): PlanContent {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    const obj = json as Record<string, unknown>;
    const rawSteps = Array.isArray(obj.steps) ? obj.steps : [];
    const steps: Array<string | StructuredPlanStep> = rawSteps.map((s) => {
      if (typeof s === 'string') return s;
      if (s && typeof s === 'object') {
        const o = s as Record<string, unknown>;
        if (typeof o.title === 'string' && typeof o.instruction === 'string') {
          return {
            title: String(o.title),
            instruction: String(o.instruction),
            time_estimate: String(o.time_estimate ?? ''),
            done_definition: String(o.done_definition ?? ''),
          };
        }
        return String(o.text ?? o.step ?? JSON.stringify(o));
      }
      return String(s);
    });
    const expected = obj.expected_result;
    return {
      steps,
      summary: typeof obj.summary === 'string' ? obj.summary : undefined,
      horseman: Array.isArray(obj.horseman) ? obj.horseman.map(h => String(h)) : undefined,
      savings: typeof obj.savings === 'string' ? obj.savings : undefined,
      complexity: typeof obj.complexity === 'number' ? obj.complexity : undefined,
      requirements: typeof obj.requirements === 'string' ? obj.requirements : undefined,
      taxReference: typeof obj.taxReference === 'string' ? obj.taxReference : undefined,
      disclaimer: typeof obj.disclaimer === 'string' ? obj.disclaimer : undefined,
      completedSteps: Array.isArray(obj.completedSteps) ? obj.completedSteps.map(Number) : undefined,
      estimated_impact: typeof obj.estimated_impact === 'object' && obj.estimated_impact !== null
        ? obj.estimated_impact as { low: number; high: number; source: string }
        : undefined,
      source_assessment_type: obj.source_assessment_type === 'financial' || obj.source_assessment_type === 'physical'
        ? obj.source_assessment_type
        : undefined,
      plan_label: typeof obj.plan_label === 'string' ? obj.plan_label : undefined,
      plan_kind: obj.plan_kind === 'wealth' || obj.plan_kind === 'wellness' || obj.plan_kind === 'strategy'
        ? obj.plan_kind
        : undefined,
      locked_roadmap: Array.isArray(obj.locked_roadmap) ? obj.locked_roadmap.map(String) : undefined,
      professional_questions: Array.isArray(obj.professional_questions) ? obj.professional_questions.map(String) : undefined,
      observation_prompts: Array.isArray(obj.observation_prompts) ? obj.observation_prompts.map(String) : undefined,
      plan_schema: obj.plan_schema === 'v1' ? 'v1' : undefined,
      expected_result: expected && typeof expected === 'object' && !Array.isArray(expected)
        ? {
            impact_range: String((expected as any).impact_range ?? ''),
            first_win_timeline: String((expected as any).first_win_timeline ?? ''),
            confidence_note: String((expected as any).confidence_note ?? ''),
          }
        : undefined,
      before_you_start: Array.isArray(obj.before_you_start) ? obj.before_you_start.map(String) : undefined,
      risks_and_mistakes_to_avoid: Array.isArray(obj.risks_and_mistakes_to_avoid) ? obj.risks_and_mistakes_to_avoid.map(String) : undefined,
      advisor_packet: Array.isArray(obj.advisor_packet) ? obj.advisor_packet.map(String) : undefined,
    };
  }
  return { steps: [] };
}

function toSavedPlan(row: {
  id: string;
  user_id: string;
  title: string;
  strategy_id: string | null;
  strategy_name: string;
  content: Json;
  status: 'not_started' | 'in_progress' | 'completed';
  notes: string | null;
  is_focus: boolean;
  created_at: string;
  updated_at: string;
}): SavedPlan {
  return {
    ...row,
    content: parsePlanContent(row.content),
  };
}

export function usePlans() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plans', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('saved_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(toSavedPlan);
    },
    enabled: !!user,
  });
}

export function usePlan(planId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plan', planId],
    queryFn: async () => {
      if (!planId || !user) return null;
      
      const { data, error } = await supabase
        .from('saved_plans')
        .select('*')
        .eq('id', planId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return toSavedPlan(data);
    },
    enabled: !!planId && !!user,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePlanInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('saved_plans')
        .insert({
          user_id: user.id,
          title: input.title,
          strategy_id: input.strategy_id || null,
          strategy_name: input.strategy_name,
          content: input.content as unknown as Json,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return toSavedPlan(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePlanInput) => {
      const { id, content, ...rest } = input;
      
      const updateData: Record<string, unknown> = { ...rest };
      if (content !== undefined) {
        updateData.content = content as unknown as Json;
      }
      
      const { data, error } = await supabase
        .from('saved_plans')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toSavedPlan(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan', data.id] });
    },
  });
}

export function useFocusPlan() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plans', user?.id, 'focus'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('saved_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_focus', true)
        .maybeSingle();
      if (error) throw error;
      return data ? toSavedPlan(data) : null;
    },
    enabled: !!user,
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from('saved_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
