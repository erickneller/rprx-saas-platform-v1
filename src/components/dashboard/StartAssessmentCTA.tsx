import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ClipboardCheck } from 'lucide-react';

interface StartAssessmentCTAProps {
  isFirstTime?: boolean;
  hasSavedResults?: boolean;
}

export function StartAssessmentCTA({ isFirstTime = true, hasSavedResults = false }: StartAssessmentCTAProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">
            {isFirstTime
              ? 'Welcome! Take Your First Assessment'
              : hasSavedResults
                ? 'Continue From Your Assessment Results'
                : 'Ready for a New Wealth Assessment?'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          {isFirstTime
            ? 'Discover which of the Four Horsemen—Interest, Taxes, Insurance, or Education costs—is creating the most pressure on your wealth picture. This 3-5 minute assessment will provide personalized insights.'
            : hasSavedResults
              ? 'Review your saved results below, build or open your starter plan, or retake an assessment when your situation changes.'
              : 'Track how your wealth pressures change over time. Taking regular assessments helps you understand your progress and identify areas that need attention.'}
        </p>
        <Button onClick={() => navigate('/assessment')} className="w-full sm:w-auto bg-accent hover:bg-accent/90">
          {hasSavedResults ? 'Retake Wealth Assessment' : 'Start Wealth Assessment'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
