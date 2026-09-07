import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Home, RotateCcw, Pencil, FileDown } from 'lucide-react';
import { HorsemenRadarChart } from './HorsemenRadarChart';
import { PrimaryHorsemanCard } from './PrimaryHorsemanCard';
import { CashFlowIndicator } from './CashFlowIndicator';
import { DiagnosticFeedback } from './DiagnosticFeedback';
import { SuggestedPromptCard } from './SuggestedPromptCard';
import { MembershipImplementationBridge } from './MembershipImplementationBridge';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useAssessmentById } from '@/hooks/useAssessmentHistory';
import { useProfile } from '@/hooks/useProfile';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { calculateCashFlowFromNumbers } from '@/lib/cashFlowCalculator';
import { exportResultsPdf } from '@/lib/resultsPdfExport';
import type { HorsemanScores, HorsemanType } from '@/lib/scoringEngine';
import type { CashFlowStatus } from '@/lib/cashFlowCalculator';
import type { UserAssessment } from '@/lib/assessmentTypes';

export function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: assessment, isLoading, error } = useAssessmentById(id);
  const { profile } = useProfile();
  const { enabled: personalizedStrategyVisible } = useFeatureFlag('personalized_strategy_visible');

  // Derive live cash flow status from profile, falling back to stored assessment value
  const cashFlowStatus = useMemo<CashFlowStatus | null>(() => {
    if (
      profile &&
      profile.monthly_income != null &&
      profile.monthly_debt_payments != null &&
      profile.monthly_housing != null &&
      profile.monthly_insurance != null &&
      profile.monthly_living_expenses != null
    ) {
      return calculateCashFlowFromNumbers(
        profile.monthly_income,
        profile.monthly_debt_payments,
        profile.monthly_housing,
        profile.monthly_insurance,
        profile.monthly_living_expenses
      ).status;
    }
    return assessment?.cash_flow_status as CashFlowStatus | null;
  }, [profile, assessment]);

  if (isLoading) {
    return (
        <AuthenticatedLayout breadcrumbs={[{ label: "My Assessments", href: "/assessments" }, { label: "Results" }]}>
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error || !assessment) {
    return (
      <AuthenticatedLayout breadcrumbs={[{ label: "My Assessments", href: "/assessments" }, { label: "Results" }]}>
        <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Assessment not found.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  const scores: HorsemanScores = {
    interest: assessment.interest_score,
    taxes: assessment.taxes_score,
    insurance: assessment.insurance_score,
    education: assessment.education_score,
  };

  const primaryHorseman = assessment.primary_horseman as HorsemanType;

  const handleSavePdf = () => {
    exportResultsPdf({
      scores,
      primaryHorseman,
      cashFlowStatus,
      assessmentDate: assessment.created_at,
    });
  };

  return (
    <AuthenticatedLayout breadcrumbs={[{ label: "My Assessments", href: "/assessments" }, { label: "Results" }]}>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Intro */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Your Assessment Results
          </h2>
          <p className="text-muted-foreground mt-1">
            Here's what we found about your financial pressure points
          </p>
        </div>

        {/* Radar Chart */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
            The Four Horsemen Of Financial Apocalypse
          </h3>
          <HorsemenRadarChart scores={scores} primaryHorseman={primaryHorseman} />
        </section>

        {/* Primary Horseman & Cash Flow */}
        <section className="grid md:grid-cols-2 gap-4">
          <PrimaryHorsemanCard primaryHorseman={primaryHorseman} />
          {cashFlowStatus && <CashFlowIndicator status={cashFlowStatus} />}
        </section>

        {/* Understanding Your Results */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Understanding Your Results
          </h3>
          <DiagnosticFeedback primaryHorseman={primaryHorseman} />
        </section>

        {/* Implementation bridge */}
        <section>
          <MembershipImplementationBridge primaryHorseman={primaryHorseman} />
        </section>

        {/* Generate My Next Strategy — single CTA */}
        {personalizedStrategyVisible && (
          <section>
            <SuggestedPromptCard
              assessment={assessment as unknown as UserAssessment}
            />
          </section>
        )}

        {/* Action Buttons */}
        <section className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate(`/assessment/edit/${assessment.id}`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit My Answers
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSavePdf}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Save as PDF
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
          <Button
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => navigate('/assessment')}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Take New Assessment
          </Button>
        </section>
      </div>
    </AuthenticatedLayout>
  );
}
