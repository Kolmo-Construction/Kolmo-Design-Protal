import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Selection } from "@shared/schema";

interface ApprovalItemProps {
  approval: Selection;
  onReview?: (id: number) => void;
}

export default function ApprovalItem({ approval, onReview }: ApprovalItemProps) {
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case "selected":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Selected
          </span>
        );
      case "approved":
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Approved
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <tr>
      <td className={cn(
        "px-6 py-4 whitespace-nowrap text-sm font-medium",
        approval.status === "pending" ? "text-yellow-600" : "text-slate-800"
      )}>
        {approval.title}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
        {approval.category.charAt(0).toUpperCase() + approval.category.slice(1)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
        {approval.selectionDeadline ? formatDate(approval.selectionDeadline) : 'No deadline'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
        {getStatusBadge(approval.status)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <Button
          variant="link"
          className="text-primary-600 hover:text-primary-900"
          onClick={() => onReview && onReview(approval.id)}
        >
          Review
        </Button>
      </td>
    </tr>
  );
}
