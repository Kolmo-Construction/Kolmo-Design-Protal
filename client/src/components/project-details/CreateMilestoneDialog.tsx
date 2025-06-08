import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertMilestoneSchema } from "@shared/schema";
import { z } from "zod";
import { CalendarIcon, Loader2, Plus } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface CreateMilestoneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
}

const createMilestoneFormSchema = insertMilestoneSchema.extend({
  plannedDate: z.union([z.string().datetime(), z.date()]),
});

type CreateMilestoneFormValues = z.infer<typeof createMilestoneFormSchema>;

export function CreateMilestoneDialog({
  isOpen,
  onOpenChange,
  projectId,
}: CreateMilestoneDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateMilestoneFormValues>({
    resolver: zodResolver(createMilestoneFormSchema),
    defaultValues: {
      projectId,
      title: "",
      description: "",
      status: "pending",
      isBillable: false,
      billingPercentage: 0,
      category: "delivery",
      orderIndex: 0,
    },
  });

  const createMilestone = useMutation({
    mutationFn: async (data: CreateMilestoneFormValues) => {
      return apiRequest('POST', `/api/projects/${projectId}/milestones`, data);
    },
    onSuccess: () => {
      toast({
        title: "Milestone Created",
        description: "The milestone has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/milestones`] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create milestone",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CreateMilestoneFormValues) => {
    createMilestone.mutate(data);
  };

  const isBillable = form.watch("isBillable");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Project Milestone</DialogTitle>
          <DialogDescription>
            Create a new milestone for this project. Billable milestones can trigger payment requests when completed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Milestone title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what needs to be completed for this milestone"
                        rows={3}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="delivery">Delivery</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="approval">Approval</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Planned Date */}
              <FormField
                control={form.control}
                name="plannedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Date*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(new Date(field.value))
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billable Toggle */}
              <FormField
                control={form.control}
                name="isBillable"
                render={({ field }) => (
                  <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Billable Milestone
                      </FormLabel>
                      <FormDescription>
                        Enable billing for this milestone to trigger payment requests when completed
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Billing Percentage - only show if billable */}
              {isBillable && (
                <FormField
                  control={form.control}
                  name="billingPercentage"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Billing Percentage*</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Percentage of total project budget to bill when this milestone is completed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMilestone.isPending}>
                {createMilestone.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Plus className="mr-2 h-4 w-4" />
                Create Milestone
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}