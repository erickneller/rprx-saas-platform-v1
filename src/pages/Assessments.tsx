import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { AssessmentHistory } from '@/components/dashboard/AssessmentHistory';
import { HealthAssessmentHistory } from '@/components/dashboard/HealthAssessmentHistory';
import { NetlifyAssessmentHistory } from '@/components/dashboard/NetlifyAssessmentHistory';
import { StartAssessmentCTA } from '@/components/dashboard/StartAssessmentCTA';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useNetlifyAssessmentResults } from '@/hooks/useNetlifyAssessmentResults';
import { useHealthAssessments } from '@/hooks/useHealthAssessmentHistory';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, HeartPulse, Loader2, RefreshCw } from 'lucide-react';

export default function Assessments() {
  const { data: assessments = [], isLoading } = useAssessmentHistory();
  const { data: rprxResults = [], isLoading: isLoadingRprxResults } = useNetlifyAssessmentResults();
  const { data: healthAssessments = [], isLoading: isLoadingHealthAssessments } = useHealthAssessments();
  const hasRprxResults = rprxResults.length > 0;
  const hasAnyAssessment = hasRprxResults || assessments.length > 0 || healthAssessments.length > 0;
  const showLegacyFallbackSections = !hasRprxResults;
  const isPageLoading = isLoading || isLoadingRprxResults || isLoadingHealthAssessments;

  return (
    <AuthenticatedLayout title="My Assessments">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {isPageLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">My Assessments</h1>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Review your saved Wealth and Health results, continue to your starter plans, or retake an assessment when your situation changes.
              </p>
            </section>

            <StartAssessmentCTA isFirstTime={!hasAnyAssessment} hasSavedResults={hasAnyAssessment} />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Saved RPRx Assessment Results</h2>
              <NetlifyAssessmentHistory />
            </section>

            {showLegacyFallbackSections ? (
              <>
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">Wealth Assessments</h2>
                  <AssessmentHistory />
                </section>
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-foreground">Health Assessment</h2>
                  <HealthAssessmentHistory />
                </section>
              </>
            ) : null}

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Retake Assessments</h2>
              <Card>
                <CardContent className="grid gap-3 p-5 sm:grid-cols-2">
                  <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
                    <Link to="/assessment">
                      <Activity className="h-5 w-5 text-primary" />
                      <span className="text-left">
                        <span className="block font-semibold">Retake Wealth Assessment</span>
                        <span className="block text-xs text-muted-foreground">Update your Four Horsemen wealth picture.</span>
                      </span>
                      <RefreshCw className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto justify-start gap-3 p-4">
                    <Link to="/health-assessment">
                      <HeartPulse className="h-5 w-5 text-primary" />
                      <span className="text-left">
                        <span className="block font-semibold">Retake Health Assessment</span>
                        <span className="block text-xs text-muted-foreground">Refresh your wellness priorities and roadmap.</span>
                      </span>
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
