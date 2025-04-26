import React, { useEffect } from 'react';
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
     actualCompletionDate: z.union([z.date(), z.string()]).optional().nullable(),
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
    progress: z.number().optional().default(0),
    // clientIds removed as we are not handling assignment edits here yet
  })
  .omit({ clientIds: true }); // Omit clientIds explicitly if not handled in edit

type ProjectFormValues = z.infer<typeof projectFormSchema>;


interface EditProjectDialogProps {
  project: Project | null; // Project to edit, or null if not open
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectManagers: User[];
  isLoadingManagers: boolean;
}

export function EditProjectDialog({
  project,
  isOpen,
  onOpenChange,
  projectManagers,
  isLoadingManagers,
}: EditProjectDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
     // Default values will be overwritten by useEffect when project is loaded
     defaultValues: {
        name: "", description: "", address: "", city: "", state: "",
        zipCode: "", status: "planning", totalBudget: "", progress: 0,
        projectManagerId: undefined, imageUrl: "", startDate: undefined,
        estimatedCompletionDate: undefined, actualCompletionDate: undefined,
     }
  });

   // Effect to reset form when the project prop changes (dialog opens/switches project)
   useEffect(() => {
    if (project && isOpen) {
      form.reset({
        name: project.name,
        description: project.description || "",
        address: project.address,
        city: project.city,
        state: project.state,
        zipCode: project.zipCode,
        status: project.status,
        totalBudget: project.totalBudget?.toString() || "",
        progress: project.progress || 0,
        imageUrl: project.imageUrl || "",
        startDate: project.startDate ? new Date(project.startDate) : undefined,
        estimatedCompletionDate: project.estimatedCompletionDate ? new Date(project.estimatedCompletionDate) : undefined,
        actualCompletionDate: project.actualCompletionDate ? new Date(project.actualCompletionDate) : undefined,
        projectManagerId: project.projectManagerId || undefined,
      });
    } else if (!isOpen) {
         form.reset(); // Reset when closing
     }
   }, [project, form, isOpen]);


  const editProjectMutation = useMutation({
    mutationFn: async (data: { id: number; project: ProjectFormValues }) => {
        // Format data before sending
        const formattedValues = {
            ...data.project,
            totalBudget: parseFloat(String(data.project.totalBudget).replace(/[^0-9.]/g, '')),
            startDate: data.project.startDate ? new Date(data.project.startDate).toISOString() : undefined,
            estimatedCompletionDate: data.project.estimatedCompletionDate ? new Date(data.project.estimatedCompletionDate).toISOString() : undefined,
            actualCompletionDate: data.project.actualCompletionDate ? new Date(data.project.actualCompletionDate).toISOString() : undefined,
            projectManagerId: data.project.projectManagerId ? Number(data.project.projectManagerId) : undefined,
        };
        console.log("Submitting Edit Project:", formattedValues);
      const res = await apiRequest("PUT", `/api/projects/${data.id}`, formattedValues);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      onOpenChange(false); // Close dialog
      toast({
        title: "Project updated",
        description: "Project details have been successfully updated.",
      });
    },
    onError: (error: Error) => {
       console.error("Edit project error:", error);
      toast({
        title: "Failed to update project",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: ProjectFormValues) => {
    if (!project) return;
     // Double-check budget parsing just before mutation call
     const budgetValue = parseFloat(String(values.totalBudget).replace(/[^0-9.]/g, ''));
     if (isNaN(budgetValue) || budgetValue <= 0) {
        form.setError("totalBudget", { type: "manual", message: "Invalid budget amount." });
        return;
     }
    editProjectMutation.mutate({ id: project.id, project: values });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project: {project?.name ?? 'Loading...'}</DialogTitle>
          <DialogDescription>
            Update the details of the selected project.
          </DialogDescription>
        </DialogHeader>
         {/* Only render form if project is loaded */}
         {project && (
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <ProjectFormFields
                    form={form}
                    projectManagers={projectManagers}
                    isLoadingManagers={isLoadingManagers}
                    disabled={editProjectMutation.isPending}
                    isEditMode={true} // Pass true for edit mode
                    />
                    <DialogFooter className="pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={editProjectMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={editProjectMutation.isPending}
                    >
                        {editProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Project
                    </Button>
                    </DialogFooter>
                </form>
            </Form>
         )}
      </DialogContent>
    </Dialog>
  );
}
