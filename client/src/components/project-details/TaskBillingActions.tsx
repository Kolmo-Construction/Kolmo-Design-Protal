import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle2, ArrowRight } from "lucide-react";
import type { Task } from "@shared/schema";

interface TaskBillingActionsProps {
  task: Task;
  onConvertToMilestone: (taskId: number) => void;
  onCompleteAndBill: (taskId: number) => void;
  isConverting?: boolean;
  isBilling?: boolean;
}

export function TaskBillingActions({
  task,
  onConvertToMilestone,
  onCompleteAndBill,
  isConverting = false,
  isBilling = false
}: TaskBillingActionsProps) {
  // Only show for billable tasks
  if (!task.isBillable) return null;

  const canConvert = task.isBillable && !task.milestoneId;
  const canBill = task.isBillable && task.milestoneId && task.status !== 'completed';
  const isCompleted = task.status === 'completed';

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
      {/* Billing Info Badge */}
      <Badge variant="secondary" className="gap-1">
        <DollarSign className="h-3 w-3" />
        {task.billingType === 'fixed' 
          ? `$${task.billableAmount}` 
          : `${task.billingPercentage}% of project`
        }
      </Badge>

      {/* Status and Actions */}
      <div className="flex items-center gap-2 text-sm">
        {canConvert && (
          <>
            <span className="text-slate-600">Billable Task</span>
            <ArrowRight className="h-3 w-3 text-slate-400" />
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConvertToMilestone(task.id)}
              disabled={isConverting}
              className="gap-1 h-7 text-xs"
            >
              <DollarSign className="h-3 w-3" />
              {isConverting ? "Converting..." : "Convert to Milestone"}
            </Button>
          </>
        )}

        {canBill && (
          <>
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Milestone Ready
            </Badge>
            <Button
              size="sm"
              onClick={() => onCompleteAndBill(task.id)}
              disabled={isBilling}
              className="gap-1 h-7 text-xs"
            >
              <CheckCircle2 className="h-3 w-3" />
              {isBilling ? "Billing..." : "Complete & Bill"}
            </Button>
          </>
        )}

        {isCompleted && (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed & Billed
          </Badge>
        )}
      </div>
    </div>
  );
}