import { useState } from "react";
import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QuoteWithDetails } from "@shared/schema";

const updateFinancialsSchema = z.object({
  discountPercentage: z.string().optional(),
  discountAmount: z.string().optional(),
  taxRate: z.string().optional(),
  taxAmount: z.string().optional(),
  isManualTax: z.boolean().optional(),
});

type UpdateFinancialsForm = z.infer<typeof updateFinancialsSchema>;

interface QuoteFinancialsDialogProps {
  quote: QuoteWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuoteFinancialsDialog({ quote, open, onOpenChange }: QuoteFinancialsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isManualTax, setIsManualTax] = useState(quote.isManualTax || false);

  const form = useForm<UpdateFinancialsForm>({
    resolver: zodResolver(updateFinancialsSchema),
    defaultValues: {
      discountPercentage: quote.discountPercentage?.toString() || "0",
      discountAmount: quote.discountAmount?.toString() || "0",
      taxRate: quote.taxRate?.toString() || "10.60",
      taxAmount: quote.taxAmount?.toString() || "0",
      isManualTax: quote.isManualTax || false,
    },
  });

  // Reset form and state when dialog opens or quote changes
  React.useEffect(() => {
    if (open) {
      setIsManualTax(quote.isManualTax || false);
      form.reset({
        discountPercentage: quote.discountPercentage?.toString() || "0",
        discountAmount: quote.discountAmount?.toString() || "0",
        taxRate: quote.taxRate?.toString() || "10.60",
        taxAmount: quote.taxAmount?.toString() || "0",
        isManualTax: quote.isManualTax || false,
      });
    }
  }, [open, quote, form]);

  const updateFinancialsMutation = useMutation({
    mutationFn: async (data: UpdateFinancialsForm) => {
      return await apiRequest("PATCH", `/api/quotes/${quote.id}/financials`, data);
    },
    onSuccess: (updatedQuote) => {
      toast({
        title: "Quote Updated",
        description: "Quote financials have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: [`/api/quotes/${quote.id}`] });
      // Update the local quote object to reflect changes immediately
      queryClient.setQueryData([`/api/quotes/${quote.id}`], updatedQuote);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quote financials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateFinancialsForm) => {
    updateFinancialsMutation.mutate({
      ...data,
      isManualTax,
    });
  };

  // Handle manual tax toggle change
  const handleManualTaxToggle = async (checked: boolean) => {
    setIsManualTax(checked);
    
    // Create a separate mutation for real-time updates that doesn't close the dialog
    try {
      const updatedQuote = await apiRequest("PATCH", `/api/quotes/${quote.id}/financials`, {
        ...form.getValues(),
        isManualTax: checked,
      });
      
      // Update the cache immediately
      queryClient.setQueryData([`/api/quotes/${quote.id}`], updatedQuote);
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      
      // Show updated totals without closing dialog
      toast({
        title: "Tax Mode Updated",
        description: "Tax calculations have been refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tax settings",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num || 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quote Financials</DialogTitle>
          <DialogDescription>
            Manage discounts and tax settings for this quote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Totals Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Current Totals</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(quote.subtotal || "0")}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="text-red-600">-{formatCurrency(quote.discountAmount || "0")}</span>
              </div>
              <div className="flex justify-between">
                <span>Discounted Subtotal:</span>
                <span>{formatCurrency(quote.discountedSubtotal || "0")}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatCurrency(quote.taxAmount || "0")}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{formatCurrency(quote.total || "0")}</span>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Discount Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-gray-700">Quote Discount</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discountPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Percentage (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="text-xs text-gray-500">
                  If both are specified, percentage discount takes precedence
                </div>
              </div>

              <Separator />

              {/* Tax Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm text-gray-700">Tax Settings</h4>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="manual-tax"
                      checked={isManualTax}
                      onCheckedChange={handleManualTaxToggle}
                    />
                    <Label htmlFor="manual-tax" className="text-sm">Manual Tax Entry</Label>
                  </div>
                </div>

                {isManualTax ? (
                  <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="10.60"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateFinancialsMutation.isPending}
                >
                  {updateFinancialsMutation.isPending ? "Updating..." : "Update Financials"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}