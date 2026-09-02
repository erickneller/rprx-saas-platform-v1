import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AssessmentWizard } from '@/components/assessment/AssessmentWizard';
import { Loader2 } from 'lucide-react';
import { NetlifyAssessmentShell } from '@/components/rprx-assessments/NetlifyAssessmentShell';
import { financialAssessmentMeta, financialQuestions, financialSections } from '@/lib/rprx-assessments';

const Assessment = () => {
  const { user, loading } = useAuth();
  const { id: editAssessmentId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const engine = searchParams.get('engine');
  const useNetlifyEngine = engine !== 'legacy' && engine !== 'lovable';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (useNetlifyEngine) {
    return (
      <NetlifyAssessmentShell
        mode="financial"
        title={financialAssessmentMeta.label}
        eyebrow={financialAssessmentMeta.eyebrow}
        subtitle="A lightweight yes/no assessment that starts with a short set of questions, then shows follow-ups only when relevant: family, income, deductions, buying and selling, debt, insurance, and how you prefer to work with RPRx. No detailed account balances required."
        disclaimer={financialAssessmentMeta.disclaimer}
        sections={financialSections}
        questions={financialQuestions}
        onExit={() => navigate('/dashboard')}
      />
    );
  }

  return <AssessmentWizard editAssessmentId={editAssessmentId} />;
};

export default Assessment;
