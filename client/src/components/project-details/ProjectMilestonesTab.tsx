import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CalendarIcon, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Plus, 
  Target,
  Loader2,
  CreditCard,
  Flag
} from 'lucide-react';
import { CreateMilestoneDialog } from './CreateMilestoneDialog';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Milestone {
  id: number;
  projectId: number;
  title: string;
  description: string | null;
  plannedDate: string;
  actualDate: string | null;
  status: string;
  isBillable: boolean;
  billingPercentage: string | null;
  category: string;
  orderIndex: number;
  completedById: number | null;
  completedAt: string | null;
  invoiceId: number | null;
  billedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectMilestonesTabProps {
  projectId: number;
  totalBudget: number;
}

export function ProjectMilestonesTab({ projectId, totalBudget }: ProjectMilestonesTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: [`/api/projects/${projectId}/milestones`],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const completeMilestone = useMutation({
    mutationFn: async (milestoneId: number) => {
      return apiRequest('PATCH', `/api/projects/${projectId}/milestones/${milestoneId}/complete`);
    },
    onSuccess: () => {
      toast({
        title: "Milestone Completed",
        description: "Milestone has been marked as completed.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/milestones`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete milestone",
        variant: "destructive",
      });
    },
  });

  const triggerBilling = useMutation({
    mutationFn: async (milestoneId: number) => {
      return apiRequest('POST', `/api/projects/${projectId}/milestones/${milestoneId}/bill`);
    },
    onSuccess: () => {
      toast({
        title: "Payment Request Sent",
        description: "Invoice has been generated and sent to the customer.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/milestones`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (milestone: Milestone) => {
    if (milestone.status === 'completed') {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
    }
    if (milestone.status === 'in_progress') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
    }
    if (milestone.status === 'delayed') {
      return <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />Delayed</Badge>;
    }
    return <Badge variant="outline"><Target className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'billing': return <DollarSign className="h-4 w-4" />;
      case 'approval': return <CheckCircle className="h-4 w-4" />;
      case 'inspection': return <Flag className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getBillingAmount = (milestone: Milestone) => {
    if (!milestone.isBillable || !milestone.billingPercentage) return 0;
    return (totalBudget * parseFloat(milestone.billingPercentage)) / 100;
  };

  const sortedMilestones = milestones.sort((a, b) => {
    // Sort by order index first, then by planned date
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    return new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime();
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Project Milestones</h3>
          <p className="text-sm text-muted-foreground">
            Track delivery and billing milestones for this project
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Milestone
        </Button>
      </div>

      {/* Milestones List */}
      {sortedMilestones.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No milestones yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create milestones to track project progress and billing
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create First Milestone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedMilestones.map((milestone) => {
            const billingAmount = getBillingAmount(milestone);
            const isCompleted = milestone.status === 'completed';
            const canComplete = milestone.status !== 'completed';
            const canBill = milestone.isBillable && isCompleted && !milestone.billedAt;

            return (
              <Card key={milestone.id} className={cn(
                "transition-colors",
                isCompleted && "bg-green-50 border-green-200"
              )}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {getCategoryIcon(milestone.category)}
                      </div>
                      <div>
                        <CardTitle className="text-base mb-1">{milestone.title}</CardTitle>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {formatDate(new Date(milestone.plannedDate))}
                          </div>
                          {milestone.isBillable && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${billingAmount.toFixed(2)} ({milestone.billingPercentage}%)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {milestone.isBillable && (
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          <CreditCard className="h-3 w-3 mr-1" />
                          Billable
                        </Badge>
                      )}
                      {getStatusBadge(milestone)}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Category: {milestone.category.charAt(0).toUpperCase() + milestone.category.slice(1)}
                      {milestone.completedAt && (
                        <span className="ml-4">
                          Completed: {formatDate(new Date(milestone.completedAt))}
                        </span>
                      )}
                      {milestone.billedAt && (
                        <span className="ml-4">
                          Billed: {formatDate(new Date(milestone.billedAt))}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {canComplete && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completeMilestone.mutate(milestone.id)}
                          disabled={completeMilestone.isPending}
                        >
                          {completeMilestone.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          Mark Complete
                        </Button>
                      )}
                      
                      {canBill && (
                        <Button
                          size="sm"
                          onClick={() => triggerBilling.mutate(milestone.id)}
                          disabled={triggerBilling.isPending}
                        >
                          {triggerBilling.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CreditCard className="h-3 w-3 mr-1" />
                          )}
                          Request Payment
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Milestone Dialog */}
      <CreateMilestoneDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        projectId={projectId}
      />
    </div>
  );
}