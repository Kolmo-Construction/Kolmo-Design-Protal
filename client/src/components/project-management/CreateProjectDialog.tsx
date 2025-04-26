import React from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Project,
  User,
  insertProjectSchema
} from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ProjectFormFields } from "./ProjectFormFields";

// Define schema matching the backend expectations, maybe import from shared/validation?
const projectFormSchema = insertProjectSchema
  .extend({
    // Keep date/budget overrides consistent with ProjectFormFields
     startDate: z.union([z.date(), z.string()]).optional().nullable(),
     estimatedCompletionDate: z.union([z.date(), z.string()]).optional().nullable(),
     // Note: actualCompletionDate likely not needed for create
     totalBudget: z.union([
      z.string().min(1, "Budget is required").refine(
        (val) => !isNaN(parseFloat(val.replace(/[^0-9.]/g, ''))) && parseFloat(val.replace(/[^0-9.]/g, '')) > 0,
        { message: "Budget must be a positive number" }
      ),
      z.number().min(1, "Budget must be a positive number")
    ]),
     projectManagerId: z.union([
      z.number().positive("Project manager ID must be positive"),
      z.string().transform((val) => val === "" || val === "none" ? undefined : parseInt(val, 10)).refine(val => val === undefined || !isNaN(val), { message: "Invalid number" }),
      z.undefined()
    ]).optional(),
    description: z.string().optional().or(z.literal('')),
    imageUrl: z.string().optional().or(z.literal('')),
    // progress and actualCompletionDate removed as they are not typical for creation
    clientIds: z.array(z.number()).optional(),
  })
  .omit({ progress: true, actualCompletionDate: true }); // Omit fields not needed for creation

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectManagers: User[];
  isLoadingManagers: boolean;
}

export function CreateProjectDialog({
  isOpen,
  onOpenChange,
  projectManagers,
  isLoadingManagers,
}: CreateProjectDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      status: "planning",
      totalBudget: "", // Keep as string initially
      projectManagerId: undefined,
      imageUrl: "",
      startDate: undefined,
      estimatedCompletionDate: undefined,
      clientIds: [],
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      // Format data before sending
       const formattedValues = {
        ...data,
        totalBudget: parseFloat(String(data.totalBudget).replace(/[^0-9.]/g, '')),
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        estimatedCompletionDate: data.estimatedCompletionDate ? new Date(data.estimatedCompletionDate).toISOString() : undefined,
        projectManagerId: data.projectManagerId ? Number(data.projectManagerId) : undefined,
        clientIds: data.clientIds || [],
      };
      console.log("Submitting Create Project:", formattedValues);
      const res = await apiRequest("POST", "/api/projects", formattedValues);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onOpenChange(false); // Close dialog
      form.reset(); // Reset form
      toast({
        title: "Project created",
        description: "New project has been successfully created.",
      });
    },
    onError: (error: Error) => {
      console.error("Create project error:", error);
      toast({
        title: "Failed to create project",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ProjectFormValues) => {
     // Double-check budget parsing just before mutation call
     const budgetValue = parseFloat(String(values.totalBudget).replace(/[^0-9.]/g, ''));
     if (isNaN(budgetValue) || budgetValue <= 0) {
        form.setError("totalBudget", { type: "manual", message: "Invalid budget amount." });
        return;
     }
    createProjectMutation.mutate(values);
  };

   // Reset form when dialog closes
   React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new construction or renovation project to the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <ProjectFormFields
              form={form}
              projectManagers={projectManagers}
              isLoadingManagers={isLoadingManagers}
              disabled={createProjectMutation.isPending}
              isEditMode={false} // Pass false for create mode
            />
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createProjectMutation.isPending}
              >
                {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}