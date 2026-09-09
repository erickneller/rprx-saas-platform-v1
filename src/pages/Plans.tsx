import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlans, useDeletePlan, useUpdatePlan } from '@/hooks/usePlans';
import { PlanCard } from '@/components/plans/PlanCard';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Loader2, FileText, Trash2, CheckSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';

function useDeletePlans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('saved_plans')
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Plans deleted');
    },
    onError: () => {
      toast.error('Failed to delete plans');
    },
  });
}

export default function Plans() {
  const navigate = useNavigate();
  const { data: plans = [], isLoading } = usePlans();
  const deletePlans = useDeletePlans();
  const updatePlan = useUpdatePlan();
  const { tier } = useSubscription();
  const isFreeUser = tier === 'free';

  // Auto-enforce: if only one plan exists, it must be the focus plan
  useEffect(() => {
    if (plans.length === 1 && !plans[0].is_focus) {
      updatePlan.mutate({ id: plans[0].id, is_focus: true });
    }
  }, [plans]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [horsemanFilter, setHorsemanFilter] = useState<string>('all');

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = plan.title.toLowerCase().includes(query);
      const matchesStrategy = plan.strategy_name.toLowerCase().includes(query);
      const matchesId = plan.strategy_id?.toLowerCase().includes(query);
      if (!matchesTitle && !matchesStrategy && !matchesId) return false;
    }
    if (statusFilter !== 'all' && plan.status !== statusFilter) return false;
    if (horsemanFilter !== 'all') {
      const horsemen = plan.content.horseman || [];
      if (!horsemen.some(h => h.toLowerCase() === horsemanFilter.toLowerCase())) return false;
    }
    return true;
  });

  const allHorsemen = [...new Set(
    plans.flatMap(p => p.content.horseman || [])
  )].sort();

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPlans.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPlans.map(p => p.id)));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const confirmDelete = () => {
    const ids = Array.from(selectedIds);
    deletePlans.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setSelectionMode(false);
        setDeleteDialogOpen(false);
      },
      onSettled: () => {
        setDeleteDialogOpen(false);
      },
    });
  };

  return (
    <AuthenticatedLayout title="My Plans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Free tier banner */}
        {isFreeUser && plans.length > 0 && (
          <div className="mb-4 px-4 py-2 rounded-md bg-muted text-sm text-muted-foreground flex items-center justify-between">
            <span>Free starter plan: review this plan first.</span>
            <span className="text-xs opacity-70">Membership unlocks unlimited implementation paths.</span>
          </div>
        )}
        {/* Subtitle + selection controls */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {plans.length} saved plan{plans.length !== 1 ? 's' : ''}
          </p>
          {plans.length > 0 && (
            <div className="flex items-center gap-2">
              {selectionMode && (
                <>
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      checked={selectedIds.size === filteredPlans.length && filteredPlans.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">All</span>
                  </div>
                  {selectedIds.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={deletePlans.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete ({selectedIds.size})
                    </Button>
                  )}
                </>
              )}
              <Button
                variant={selectionMode ? 'secondary' : 'outline'}
                size="sm"
                onClick={selectionMode ? exitSelectionMode : () => setSelectionMode(true)}
              >
                <CheckSquare className="h-3.5 w-3.5 mr-1" />
                {selectionMode ? 'Cancel' : 'Select'}
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          {allHorsemen.length > 0 && (
            <Select value={horsemanFilter} onValueChange={setHorsemanFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by horseman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Horsemen</SelectItem>
                {allHorsemen.map(horseman => (
                  <SelectItem key={horseman} value={horseman.toLowerCase()}>
                    {horseman}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Plans List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPlans.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                totalPlans={plans.length}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(plan.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        ) : plans.length > 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No plans match your filters</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No saved plans yet</h3>
            <p className="text-muted-foreground mb-6">
              Complete the free assessment first, then build one RPRx starter plan from your top matches.
            </p>
            <Button onClick={() => navigate('/assessment')} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              Start Free Assessment
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size === 1 ? 'Plan' : `${selectedIds.size} Plans`}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedIds.size === 1 ? 'this plan' : `these ${selectedIds.size} plans`}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlans.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  );
}
