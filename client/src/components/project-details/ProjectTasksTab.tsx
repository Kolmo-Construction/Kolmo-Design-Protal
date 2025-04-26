import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task, InsertTask } from "@shared/schema"; // Import Task and InsertTask types
import { getQueryFn, apiRequest } from "@/lib/queryClient"; // Import query helpers
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For error state
import { Loader2, PlusCircle, ClipboardList, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast"; // Assuming useToast is set up
import { CreateTaskDialog } from "./CreateTaskDialog"; // Import the dialog component we'll create next

// Import the Gantt library and its CSS
import { Gantt, Task as GanttTask } from "wx-react-gantt"; // Alias Task to avoid conflict
import "wx-react-gantt/dist/gantt.css";

interface ProjectTasksTabProps {
  projectId: number;
}

// Helper to format tasks for the Gantt library
const formatTasksForGantt = (tasks: Task[]): GanttTask[] => {
  return tasks.map(task => {
    // Determine progress based on status
    let progress = 0;
    if (task.status === 'done') {
      progress = 100;
    } else if (task.status === 'in_progress') {
      // You might want more granular progress later, e.g., based on actualHours/estimatedHours
      progress = 50; // Example: In progress is 50%
    }

    // Basic task type
    const type: "task" | "milestone" | "project" = "task"; // Can enhance later

    return {
      id: task.id.toString(), // Gantt library usually expects string IDs
      start: task.startDate ? new Date(task.startDate) : new Date(), // Handle null dates - maybe set to project start?
      end: task.dueDate ? new Date(task.dueDate) : new Date( (task.startDate ? new Date(task.startDate) : new Date()).getTime() + 86400000 * 2), // Handle null - default to 2 days after start?
      text: task.title, // Use 'text' for wx-react-gantt task name display
      progress: progress,
      type: type,
      // dependencies: task.dependencies?.map(dep => dep.predecessorId.toString()) || [], // Map dependencies if fetched
      // Add other relevant fields supported by the library if needed
    };
  });
};


export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch tasks for the project
  const tasksQueryKey = [`/api/projects/${projectId}/tasks`];
  const {
    data: tasks = [],
    isLoading,
    error,
    isError,
  } = useQuery<Task[]>({
    queryKey: tasksQueryKey,
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: projectId > 0,
  });

  // Memoize the formatted tasks for the Gantt chart
  const formattedGanttTasks = useMemo(() => formatTasksForGantt(tasks), [tasks]);

  // Mutation hook for creating a task
  const createTaskMutation = useMutation({
    mutationFn: (newTaskData: InsertTask) => {
      // The API expects projectId in the body, but it's already part of the URL path.
      // The route handler adds it, so we don't necessarily need it here,
      // but ensure the backend doesn't require it redundantly in the body.
      // Let's assume the API takes the task data without projectId in the body.
      const { projectId: _projectId, ...restData } = newTaskData; // Remove projectId if present
      return apiRequest('POST', `/api/projects/${projectId}/tasks`, restData);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Task created successfully." });
      // Invalidate the tasks query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
      setIsCreateDialogOpen(false); // Close dialog on success
    },
    onError: (err) => {
      console.error("Error creating task:", err);
      toast({
        title: "Error Creating Task",
        description: err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  // --- Render Logic ---

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4 p-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-[500px] w-full" /> {/* Placeholder for Gantt chart */}
        </div>
      );
    }

    if (isError || error) {
      return (
         <Alert variant="destructive" className="m-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Loading Tasks</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "An unknown error occurred."}
            </AlertDescription>
          </Alert>
      );
    }

     if (tasks.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <ClipboardList className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No tasks have been created for this project yet.</p>
                 <Button size="sm" onClick={() => setIsCreateDialogOpen(true)} className="mt-4 gap-1">
                   <PlusCircle className="h-4 w-4" />
                   Add First Task
                </Button>
            </div>
        );
     }

    // --- Render Gantt Chart ---
    return (
        <div className="h-[600px] w-full overflow-auto border rounded-md"> {/* Ensure container has height */}
            <Gantt
                tasks={formattedGanttTasks}
                viewMode="Week" // Default view mode (Day, Week, Month)
                // Add other necessary props and event handlers here:
                // onClick={(task) => console.log("Task clicked:", task)}
                // onTasksChange={(tasks) => console.log("Tasks changed:", tasks)} // For drag/drop updates
                // listCellWidth={isMobile ? "155px" : ""}
                // ganttHeight={500} // Example height
            />
        </div>
    );
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Tasks & Schedule</CardTitle>
          <CardDescription>Manage and visualize project tasks and dependencies.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setIsCreateDialogOpen(true)} className="gap-1">
           <PlusCircle className="h-4 w-4" />
           Add Task
        </Button>
      </CardHeader>
      <CardContent>
         {renderContent()}
      </CardContent>

      {/* Render the Create Task Dialog */}
      <CreateTaskDialog
        isOpen={isCreateDialogOpen}
        setIsOpen={setIsCreateDialogOpen}
        projectId={projectId}
        onSubmit={(values) => {
          // Pass the validated form values to the mutation
          createTaskMutation.mutate(values);
        }}
        isPending={createTaskMutation.isPending}
      />

       {/* TODO: Add Edit Task Dialog similarly */}

    </Card>
  );
}