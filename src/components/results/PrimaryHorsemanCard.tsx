import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import type { HorsemanType } from '@/lib/scoringEngine';
import { getHorsemanLabel } from '@/lib/scoringEngine';
interface PrimaryHorsemanCardProps {
  primaryHorseman: HorsemanType;
}
export function PrimaryHorsemanCard({
  primaryHorseman
}: PrimaryHorsemanCardProps) {
  return <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-lg text-primary">Primary Pressure Area</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-foreground">
          {getHorsemanLabel(primaryHorseman)}
        </p>
        <p className="text-foreground mt-1">
          This area shows the highest pressure in your wealth picture
        </p>
      </CardContent>
    </Card>;
}