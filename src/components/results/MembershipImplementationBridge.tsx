import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, LockKeyhole, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useUpgradeGate } from '@/contexts/UpgradeGateContext';
import { getHorsemanLabel, type HorsemanType } from '@/lib/scoringEngine';

interface MembershipImplementationBridgeProps {
  primaryHorseman: HorsemanType;
}

const NEXT_STEPS: Record<HorsemanType, string[]> = {
  interest: [
    'Identify which debt or interest cost is stealing the most monthly cash flow.',
    'Compare payoff, refinance, recapture, and cash-flow-control options before choosing a move.',
    'Build one focused implementation plan instead of chasing multiple debt ideas at once.',
  ],
  taxes: [
    'Review which tax strategy categories match your situation before your next filing deadline.',
    'Collect the documents and entity/household facts needed for a CPA-ready conversation.',
    'Turn your highest-fit tax opportunity into a step-by-step RPRx implementation plan.',
  ],
  insurance: [
    'Spot policies, premiums, or coverage gaps that may be draining cash flow or exposing risk.',
    'Prioritize which insurance review should happen first based on your assessment pattern.',
    'Use the RPRx library and trusted sources to compare options before making changes.',
  ],
  education: [
    'Find the scholarship, tuition, student-loan, or family education angle most relevant to you.',
    'Separate quick wins from longer-term planning opportunities so the next move is clear.',
    'Create a simple education-cost strategy that can be reviewed and updated over time.',
  ],
};

export function MembershipImplementationBridge({ primaryHorseman }: MembershipImplementationBridgeProps) {
  const navigate = useNavigate();
  const { isFree, tier } = useSubscription();
  const { requireUpgrade } = useUpgradeGate();
  const label = getHorsemanLabel(primaryHorseman);
  const steps = NEXT_STEPS[primaryHorseman];

  return (
    <Card className="overflow-hidden border-accent/50 bg-gradient-to-br from-accent/10 via-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="w-fit gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Your next RPRx move
            </Badge>
            <CardTitle className="text-xl md:text-2xl">
              You have your diagnosis. Now turn it into an implementation path.
            </CardTitle>
          </div>
          <Badge className="w-fit capitalize" variant={isFree ? 'outline' : 'default'}>
            {isFree ? 'Free preview' : `${tier} member`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm md:text-base text-muted-foreground">
          Your strongest pressure area is <span className="font-semibold text-foreground">{label}</span>. RPRx is designed to move you from “I see the problem” to “I know the next step” with matched resources, tools, and partner guidance.
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step} className="rounded-lg border bg-background/85 p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4" /> Step {index + 1}
              </div>
              <p className="text-sm text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>

        {isFree ? (
          <div className="rounded-lg border border-primary/20 bg-background/90 p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <LockKeyhole className="h-4 w-4 text-primary" /> Unlock the implementation side of RPRx
                </h3>
                <p className="text-sm text-muted-foreground">
                  Become an RPRx Member to unlock the deeper library, calculators, playbooks, trusted-source paths, and ongoing strategy updates connected to your result.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
                <Button onClick={() => requireUpgrade({ feature: 'library', requiredTier: 'partner' })} className="whitespace-nowrap">
                  Unlock Membership <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/library')} className="whitespace-nowrap">
                  Preview Library
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-success/30 bg-success/10 p-4 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground">Your membership is active — keep moving.</h3>
                <p className="text-sm text-muted-foreground">
                  Use your result to choose the next resource, plan, or trusted-source conversation instead of browsing the portal cold.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => navigate('/plans')} className="whitespace-nowrap">
                  View My Plans <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate('/library')} className="whitespace-nowrap">
                  Open Library
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
