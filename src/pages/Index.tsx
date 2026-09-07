import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useFirstLoginFlow, useCompanyFirstLoginFlow } from '@/hooks/useFirstLoginFlow';
import { resolveFinalOnboardingPath } from '@/lib/onboardingRoute';
import RprxSaasHome from '@/components/landing/RprxSaasHome';

const Index = () => {
  const { user, loading } = useAuth();
  const { profile, isLoading: profileLoading, isProfileComplete } = useProfile();
  const { data: assessments, isLoading: assessmentsLoading } = useAssessmentHistory();
  const { globalPath, globalRaw, isLoading: presetLoading } = useFirstLoginFlow();
  const { companyOverrideEnabled, companyOverridePath, isLoading: companyPresetLoading } = useCompanyFirstLoginFlow(profile?.company_id);

  if (loading || (user && (profileLoading || !profile || assessmentsLoading || presetLoading || companyPresetLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <RprxSaasHome />;
  }

  // Phone capture is always required for OAuth users
  if (!profile?.phone?.trim()) {
    return <Navigate to="/complete-phone" replace />;
  }

  const hasAssessments = (assessments || []).some(a => a.completed_at);
  const isCompanyUser = !!profile.company_id;
  const { path: finalRedirectPath, reason } = resolveFinalOnboardingPath({
    onboardingCompleted: profile.onboarding_completed,
    isProfileComplete,
    hasAssessments,
    companyOverrideEnabled,
    companyOverridePath,
    globalPath,
  });

  console.debug('[onboarding-route]', {
    source: 'index',
    user: user.id,
    isCompanyUser,
    companyOverrideEnabled,
    companyOverridePath,
    globalRaw,
    globalNormalized: globalPath,
    reason,
    finalRedirectPath,
  });
  return <Navigate to={finalRedirectPath} replace />;
};

export default Index;
