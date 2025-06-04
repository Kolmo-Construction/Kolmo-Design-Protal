import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface QuoteData {
  id: number;
  projectType: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  projectTitle: string;
  projectDescription: string;
  projectLocation?: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  estimatedStartDate?: string;
  estimatedCompletionDate?: string;
  validUntil: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface QuoteDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: QuoteData | null;
}

export default function QuoteDetailsDialog({ open, onOpenChange, quote }: QuoteDetailsDialogProps) {
  if (!quote) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "viewed": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "declined": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Quote #{quote.quoteNumber}</DialogTitle>
            <Badge className={getStatusColor(quote.status)}>
              {quote.status.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-sm">{quote.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm">{quote.customerEmail}</p>
              </div>
              {quote.customerPhone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm">{quote.customerPhone}</p>
                </div>
              )}
              {quote.customerAddress && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-sm">{quote.customerAddress}</p>
                </div>
              )}
            </div>
          </div>

          {/* Project Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Project Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Project Type</label>
                <p className="text-sm">{quote.projectType}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Project Title</label>
                <p className="text-sm">{quote.projectTitle}</p>
              </div>
              {quote.projectLocation && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-sm">{quote.projectLocation}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm whitespace-pre-wrap">{quote.projectDescription}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quote.estimatedStartDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Start</label>
                  <p className="text-sm">{format(new Date(quote.estimatedStartDate), "MMM dd, yyyy")}</p>
                </div>
              )}
              {quote.estimatedCompletionDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Completion</label>
                  <p className="text-sm">{format(new Date(quote.estimatedCompletionDate), "MMM dd, yyyy")}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Valid Until</label>
                <p className="text-sm">{format(new Date(quote.validUntil), "MMM dd, yyyy")}</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Pricing</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Subtotal:</span>
                <span className="text-sm font-medium">${parseFloat(quote.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Tax:</span>
                <span className="text-sm font-medium">${parseFloat(quote.taxAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total:</span>
                <span className="font-semibold text-lg">${parseFloat(quote.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Quote Metadata */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Quote Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm">{format(new Date(quote.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm">{format(new Date(quote.updatedAt), "MMM dd, yyyy 'at' h:mm a")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}