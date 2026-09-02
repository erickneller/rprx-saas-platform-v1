import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAssessmentStore } from '@/store/healthAssessmentStore';
import { WelcomeScreen } from '@/components/health-assessment/WelcomeScreen';
import { ProgressBar } from '@/components/health-assessment/ProgressBar';
import { Step1BasicProfile } from '@/components/health-assessment/Step1BasicProfile';
import { Step2HealthHabits } from '@/components/health-assessment/Step2HealthHabits';
import { Step3Screenings } from '@/components/health-assessment/Step3Screenings';
import { Step4Goals } from '@/components/health-assessment/Step4Goals';
import { Step5Contact } from '@/components/health-assessment/Step5Contact';
import { PhysicalSnapshotReport } from '@/components/health-assessment/PhysicalSnapshotReport';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useAuth } from '@/hooks/useAuth';
import { useHealthAssessments } from '@/hooks/useHealthAssessmentHistory';
import { NetlifyAssessmentShell } from '@/components/rprx-assessments/NetlifyAssessmentShell';
import { physicalAssessmentMeta, physicalQuestions, physicalSections } from '@/lib/rprx-assessments';

const isEmbedded = () => {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('embed');
};

const HealthAssessment = () => {
  const currentStep = useAssessmentStore((state) => state.currentStep);
  const hydrateFromRecord = useAssessmentStore((s) => s.hydrateFromRecord);
  const reset = useAssessmentStore((s) => s.reset);
  const rootRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const engine = searchParams.get('engine');
  const useNetlifyEngine = engine !== 'legacy' && engine !== 'lovable';
  const mode = searchParams.get('mode'); // 'view' | 'edit' | null (new)
  const { data: healthAssessments = [] } = useHealthAssessments();
  const saved = healthAssessments[0];

  // Hydrate / reset store based on URL mode
  useEffect(() => {
    if (mode === 'view' && saved) {
      hydrateFromRecord(saved as any, { viewOnly: true, startStep: 6 });
    } else if (mode === 'edit' && saved) {
      hydrateFromRecord(saved as any, { viewOnly: false, startStep: 1 });
    } else if (!mode) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, saved?.id]);


  // Toggle embed mode class on <html>
  useEffect(() => {
    if (!isEmbedded()) return;
    document.documentElement.classList.add('embed');
    return () => document.documentElement.classList.remove('embed');
  }, []);

  // Report height to parent window when embedded
  useEffect(() => {
    if (!isEmbedded() || !rootRef.current) return;
    const el = rootRef.current;
    let lastHeight = 0;
    let rafId = 0;

    const postHeight = () => {
      rafId = 0;
      const height = Math.ceil(el.getBoundingClientRect().height);
      if (height && height !== lastHeight) {
        lastHeight = height;
        try {
          window.parent.postMessage({ type: 'rprx:height', height }, '*');
        } catch {
          /* noop */
        }
      }
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(postHeight);
    };

    // Initial measurement after layout settles
    schedule();
    const t = setTimeout(schedule, 100);

    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    window.addEventListener('load', schedule);

    return () => {
      ro.disconnect();
      window.removeEventListener('load', schedule);
      clearTimeout(t);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Force a fresh measurement on every step change
  useEffect(() => {
    if (!isEmbedded() || !rootRef.current) return;
    const el = rootRef.current;
    requestAnimationFrame(() => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      try {
        window.parent.postMessage({ type: 'rprx:height', height }, '*');
      } catch {
        /* noop */
      }
    });
  }, [currentStep]);

  const { user } = useAuth();
  const embedded = isEmbedded();

  if (useNetlifyEngine) {
    const netlifyContent = (
      <NetlifyAssessmentShell
        mode="physical"
        title={physicalAssessmentMeta.label}
        eyebrow={physicalAssessmentMeta.eyebrow}
        subtitle="A lightweight yes/no wellness snapshot that starts with a short set of questions, then shows follow-ups only when relevant: mind and mood, body and movement, conditions, prevention and recovery, and preferred support path. No detailed medical records required."
        disclaimer={physicalAssessmentMeta.disclaimer}
        sections={physicalSections}
        questions={physicalQuestions}
        onExit={() => window.history.back()}
      />
    );

    if (!embedded && user) {
      return <AuthenticatedLayout title="Health Assessment">{netlifyContent}</AuthenticatedLayout>;
    }

    return netlifyContent;
  }

  const content = (
    <div ref={rootRef}>
      {currentStep === 0 && <WelcomeScreen />}
      {currentStep > 0 && currentStep < 6 && (
        <div>
          <ProgressBar currentStep={currentStep} totalSteps={5} />
          {currentStep === 1 && <Step1BasicProfile />}
          {currentStep === 2 && <Step2HealthHabits />}
          {currentStep === 3 && <Step3Screenings />}
          {currentStep === 4 && <Step4Goals />}
          {currentStep === 5 && <Step5Contact />}
        </div>
      )}
      {currentStep === 6 && <PhysicalSnapshotReport />}
    </div>
  );

  if (!embedded && user) {
    return <AuthenticatedLayout title="Health Assessment">{content}</AuthenticatedLayout>;
  }

  return content;
};

export default HealthAssessment;
