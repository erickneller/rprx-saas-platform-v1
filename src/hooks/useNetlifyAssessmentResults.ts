import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface NetlifyAssessmentResultRecord {
  id: string;
  user_id: string;
  assessment_type: 'financial' | 'physical';
  answers: Record<string, unknown>;
  matches: Array<{ id: string; title: string; category?: string; blurb?: string; hot?: boolean }>;
  free_matches: Array<{ id: string; title: string; category?: string; blurb?: string; hot?: boolean }>;
  locked_matches: Array<{ id: string; title: string; category?: string; blurb?: string; hot?: boolean }>;
  top_match_id: string | null;
  top_match_name: string | null;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export function useNetlifyAssessmentResults() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['netlifyAssessmentResults', user?.id],
    queryFn: async (): Promise<NetlifyAssessmentResultRecord[]> => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('rprx_netlify_assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        // The preview can ship before the migration is applied in every environment.
        // Keep My Assessments usable instead of crashing the page.
        if (String(error.message || '').includes('rprx_netlify_assessment_results')) return [];
        throw error;
      }

      return (data || []) as NetlifyAssessmentResultRecord[];
    },
    enabled: !!user,
  });
}
