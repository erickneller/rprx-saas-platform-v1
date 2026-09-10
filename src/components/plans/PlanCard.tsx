import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, FileText, Star } from 'lucide-react';
import { useUpdatePlan, type SavedPlan } from '@/hooks/usePlans';
import { toast } from 'sonner';

interface PlanCardProps {
  plan: SavedPlan;
  totalPlans?: number;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function PlanCard({ plan, totalPlans = 0, selectionMode, isSelected, onToggleSelect }: PlanCardProps) {
  const navigate = useNavigate();
  const updatePlan = useUpdatePlan();
  const content = plan.content;
  const planLabel = content.plan_label || (content.plan_kind === 'wellness' ? 'Wellness Plan' : content.plan_kind === 'wealth' ? 'Wealth Plan' : null);
  
  const completedSteps = content.completedSteps?.length || 0;
  const totalSteps = content.steps?.length || 0;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const statusColors = {
    not_started: 'bg-muted text-muted-foreground',
    in_progress: 'bg-primary/10 text-primary',
    completed: 'bg-green-500/10 text-green-600',
  };

  const statusLabels = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  // Don't allow removing focus if this is the only plan
  const canToggleFocus = !(plan.is_focus && totalPlans <= 1);

  const handleSetFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canToggleFocus) {
      toast.info('You need at least one focus plan');
      return;
    }
    updatePlan.mutate(
      { id: plan.id, is_focus: !plan.is_focus },
      {
        onSuccess: () => {
          toast.success(plan.is_focus ? 'Focus removed' : 'Set as current focus');
        },
      }
    );
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${isSelected ? 'border-success ring-1 ring-success' : ''} ${plan.is_focus ? 'border-primary ring-1 ring-primary' : ''}`}
      onClick={() => selectionMode && onToggleSelect ? onToggleSelect(plan.id) : navigate(`/plans/${plan.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          {selectionMode && (
            <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect?.(plan.id)}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{plan.title}</CardTitle>
            <CardDescription className="truncate">{plan.strategy_name}</CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            {!selectionMode && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${plan.is_focus ? 'text-primary' : 'text-muted-foreground hover:text-primary'} ${!canToggleFocus ? 'opacity-60 cursor-default' : ''}`}
                onClick={handleSetFocus}
                title={!canToggleFocus ? 'This is your only plan — it must stay focused' : plan.is_focus ? 'Remove focus' : 'Set as focus'}
              >
                <Star className={`h-4 w-4 ${plan.is_focus ? 'fill-primary' : ''}`} />
              </Button>
            )}
            <Badge className={statusColors[plan.status]} variant="secondary">
              {statusLabels[plan.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {totalSteps > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{completedSteps}/{totalSteps} steps</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {planLabel && (
              <Badge variant="secondary" className="text-xs">
                {planLabel}
              </Badge>
            )}
            {plan.strategy_id && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>{plan.strategy_id}</span>
              </div>
            )}
            {content.horseman && content.horseman.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {content.horseman.join(', ')}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Updated {new Date(plan.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
