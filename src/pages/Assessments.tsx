import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { AssessmentHistory } from '@/components/dashboard/AssessmentHistory';
import { HealthAssessmentHistory } from '@/components/dashboard/HealthAssessmentHistory';
import { NetlifyAssessmentHistory } from '@/components/dashboard/NetlifyAssessmentHistory';
import { StartAssessmentCTA } from '@/components/dashboard/StartAssessmentCTA';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { Loader2 } from 'lucide-react';

export default function Assessments() {
  const { data: assessments = [], isLoading } = useAssessmentHistory();

  return (
    <AuthenticatedLayout title="My Assessments">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <StartAssessmentCTA isFirstTime={assessments.length === 0} />
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Imported Netlify Assessment Engine</h2>
              <NetlifyAssessmentHistory />
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Financial Assessments</h2>
              <AssessmentHistory />
            </section>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Health Assessment</h2>
              <HealthAssessmentHistory />
            </section>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
