import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Use query helpers from queryClient
import { apiRequest, getQueryFn } from "@/lib/queryClient";
// Import Task, InsertTask, and NEW TaskDependency types
import { Task, InsertTask, TaskDependency } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, PlusCircle, ClipboardList, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
// Import the Gantt library and its CSS
import { Gantt, Task as GanttTask } from "wx-react-gantt";
import "wx-react-gantt/dist/gantt.css";

// Define ViewMode constants
const ViewMode = { Day: "Day", Week: "Week", Month: "Month" };

// Define payload types for mutations
type UpdateTaskDatePayload = { taskId: number; startDate: Date; dueDate: Date; };
type UpdateTaskProgressPayload = { taskId: number; progress: number; }; // New payload type
type CreateDependencyPayload = { predecessorId: number; successorId: number; type?: string }; // New payload type

interface ProjectTasksTabProps {
  projectId: number;
}

// Helper to format tasks for the Gantt library
// NOW includes progress and dependencies
const formatTasksForGantt = (tasks: Task[], dependencies: TaskDependency[] = []): GanttTask[] => {
  // Create a map for quick lookup of dependencies for each task (successor)
  const successorDependenciesMap = new Map<number, number[]>();
  dependencies.forEach(dep => {
      const successors = successorDependenciesMap.get(dep.successorId) ?? [];
      successors.push(dep.predecessorId);
      successorDependenciesMap.set(dep.successorId, successors);
  });

  return tasks.map(task => {
    // Use the progress field from the task data
    const progress = task.progress ?? 0; // Use actual progress, default to 0

    const type: "task" | "milestone" | "project" = "task"; // Default type

    // --- Date Handling ---
    let startDate: Date;
    let endDate: Date;
    if (task.startDate) { startDate = new Date(task.startDate); }
    else { startDate = new Date(); } // Fallback (consider logging warnings)

    if (task.dueDate) { endDate = new Date(task.dueDate); }
    else { endDate = new Date(startDate.getTime() + 86400000); } // Fallback to 1 day duration
    if (endDate < startDate) { endDate = new Date(startDate.getTime() + 86400000); } // Adjust if end < start
    // --- End Date Handling ---

    // Get dependencies for this task (where this task is the successor)
    const taskDependencies = successorDependenciesMap.get(task.id)?.map(String) ?? []; // Convert IDs to strings

    return {
      id: task.id.toString(),
      start: startDate,
      end: endDate,
      text: task.title,
      progress: progress, // Use the actual progress value
      type: type,
      dependencies: taskDependencies, // Add formatted dependencies
      // _original: task, // Optional: Keep original data reference
    };
  }).filter(gt => !isNaN(gt.start.getTime()) && !isNaN(gt.end.getTime())); // Ensure valid dates
};


export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch tasks for the project
  const tasksQueryKey = ['projects', projectId, 'tasks']; // Use array key
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: errorTasks,
    isError: isErrorTasks,
  } = useQuery<Task[]>({
    queryKey: tasksQueryKey,
    queryFn: getQueryFn(`/api/projects/${projectId}/tasks`),
    enabled: !!projectId,
  });

  // --- NEW: Fetch Task Dependencies ---
  const dependenciesQueryKey = ['projects', projectId, 'tasks', 'dependencies'];
  const {
      data: dependencies = [],
      isLoading: isLoadingDeps,
      error: errorDeps,
      isError: isErrorDeps,
  } = useQuery<TaskDependency[]>({
      queryKey: dependenciesQueryKey,
      queryFn: getQueryFn(`/api/projects/${projectId}/tasks/dependencies`),
      enabled: !!projectId && !isLoadingTasks, // Fetch after tasks are loaded
  });

  // Memoize the formatted tasks for the Gantt chart (now includes dependencies)
  const formattedGanttTasks = useMemo(() => formatTasksForGantt(tasks, dependencies), [tasks, dependencies]);

  // Loading state considers both tasks and dependencies
  const isLoading = isLoadingTasks || isLoadingDeps;
  const isError = isErrorTasks || isErrorDeps;
  const error = errorTasks || errorDeps;

  // --- Mutations ---

  // Create Task Mutation (CORRECTED)
  const createTaskMutation = useMutation({
    mutationFn: (newTaskData: InsertTask) => {
        // Include the project ID explicitly rather than stripping it out
        // since the server route expects it in the body
        const updatedData = { 
          ...newTaskData,
          projectId: projectId // Make sure projectId is set correctly
        };

        // --- CORRECTION: Call apiRequest with METHOD first, then URL, then DATA ---
        return apiRequest(
            'POST', // Method
            `/api/projects/${projectId}/tasks`, // URL
            updatedData // Data payload with correct projectId
        );
        // --- END CORRECTION ---
    },
    onSuccess: (newTask) => { // Assuming API returns the created task object
      toast({ title: "Success", description: "Task created successfully." });
      queryClient.invalidateQueries({ queryKey: tasksQueryKey }); // Invalidate instead of manual update
      setIsCreateDialogOpen(false);
    },
    onError: (err: Error) => {
       toast({ title: "Error Creating Task", description: err.message, variant: "destructive" });
    },
  });

  // Delete Task Mutation
   const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => {
        // --- CORRECTION: Call apiRequest with METHOD first, then URL ---
        return apiRequest(
            'DELETE', // Method
            `/api/projects/${projectId}/tasks/${taskId}` // URL
        );
        // --- END CORRECTION ---
    },
    onSuccess: (_, taskId) => {
      toast({ title: "Success", description: `Task #${taskId} deleted.` });
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
      queryClient.invalidateQueries({ queryKey: dependenciesQueryKey }); // Dependencies might change
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: (err: Error, taskId) => {
      console.error(`Error deleting task ${taskId}:`, err);
      toast({ title: "Error Deleting Task", description: err.message, variant: "destructive" });
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
  });

  // Update Task Dates Mutation
  const updateTaskDateMutation = useMutation({
      mutationFn: ({ taskId, startDate, dueDate }: UpdateTaskDatePayload) => {
          const updateData: Partial<InsertTask> = { startDate, dueDate };
          // --- CORRECTION: Call apiRequest with METHOD first, then URL, then DATA ---
          return apiRequest(
                'PUT', // Method
                `/api/projects/${projectId}/tasks/${taskId}`, // URL
                updateData // Data
          );
          // --- END CORRECTION ---
      },
      onSuccess: (updatedTask: Task) => {
          toast({ title: "Task Updated", description: `Dates updated for task "${updatedTask.title}".` });
          queryClient.setQueryData<Task[]>(tasksQueryKey, (oldTasks = []) =>
              oldTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
          );
      },
      onError: (err: Error, variables) => {
          console.error(`Error updating dates for task ${variables.taskId}:`, err);
          toast({ title: "Error Updating Task Dates", description: err.message, variant: "destructive" });
          queryClient.invalidateQueries({ queryKey: tasksQueryKey }); // Revert on error
      },
  });

  // --- NEW: Mutation for Updating Task Progress ---
   const updateTaskProgressMutation = useMutation({
      mutationFn: ({ taskId, progress }: UpdateTaskProgressPayload) => {
          const updateData: Partial<InsertTask> = { progress };
          // --- CORRECTION: Call apiRequest with METHOD first, then URL, then DATA ---
          return apiRequest(
                'PUT', // Method
                `/api/projects/${projectId}/tasks/${taskId}`, // URL
                updateData // Data
          );
          // --- END CORRECTION ---
      },
      onSuccess: (updatedTask: Task) => {
          toast({ title: "Task Updated", description: `Progress updated for task "${updatedTask.title}".` });
          // Update cache optimistically
          queryClient.setQueryData<Task[]>(tasksQueryKey, (oldTasks = []) =>
              oldTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
          );
      },
      onError: (err: Error, variables) => {
          console.error(`Error updating progress for task ${variables.taskId}:`, err);
          toast({ title: "Error Updating Task Progress", description: err.message, variant: "destructive" });
          queryClient.invalidateQueries({ queryKey: tasksQueryKey }); // Revert on error
      },
  });

  // --- NEW: Mutations for Task Dependencies ---
    const createDependencyMutation = useMutation({
        mutationFn: ({ predecessorId, successorId, type = "FS" }: CreateDependencyPayload) => {
            console.log(`Create dependency from ${predecessorId} to ${successorId}`);
            // POST /api/projects/:projectId/tasks/:taskId/dependencies
            // where :taskId is the successorId
            // --- CORRECTION: Call apiRequest with METHOD first, then URL, then DATA ---
            return apiRequest(
                'POST', // Method
                `/api/projects/${projectId}/tasks/${successorId}/dependencies`, // URL
                { predecessorId, type } // Data (Backend expects predecessorId in body)
            );
            // --- END CORRECTION ---
        },
        onSuccess: () => {
            toast({ title: "Dependency Added", description: "Task dependency created." });
            queryClient.invalidateQueries({ queryKey: dependenciesQueryKey });
            // Optionally invalidate tasksQueryKey if dependencies affect task display/logic
        },
        onError: (err: Error) => {
            console.error("Error creating dependency:", err);
            toast({ title: "Error Creating Dependency", description: err.message, variant: "destructive" });
        },
    });

    const deleteDependencyMutation = useMutation({
        mutationFn: (dependencyId: number) => {
            console.log(`Delete dependency ID ${dependencyId}`);
            // DELETE /api/projects/:projectId/tasks/dependencies/:dependencyId
            // --- CORRECTION: Call apiRequest with METHOD first, then URL ---
            return apiRequest(
                'DELETE', // Method
                `/api/projects/${projectId}/tasks/dependencies/${dependencyId}` // URL
            );
            // --- END CORRECTION ---
        },
        onSuccess: () => {
            toast({ title: "Dependency Removed", description: "Task dependency deleted." });
            queryClient.invalidateQueries({ queryKey: dependenciesQueryKey });
            // Optionally invalidate tasksQueryKey
        },
        onError: (err: Error) => {
            console.error("Error deleting dependency:", err);
            toast({ title: "Error Deleting Dependency", description: err.message, variant: "destructive" });
        },
    });

  // --- Handlers ---
  const handleAddTaskClick = () => setIsCreateDialogOpen(true);

  const handleTaskClick = useCallback((ganttTask: GanttTask) => {
    console.log("Gantt Task Clicked:", ganttTask);
    const originalTask = tasks.find(t => t.id.toString() === ganttTask.id);
    if (originalTask) {
      setTaskToEdit(originalTask);
      setIsEditDialogOpen(true);
    } else {
      toast({ title: "Error", description: "Could not find task details.", variant: "destructive" });
    }
  }, [tasks]);

  const handleDeleteTrigger = useCallback((task: Task) => {
      setTaskToDelete(task);
      setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
      if (taskToDelete) { deleteTaskMutation.mutate(taskToDelete.id); }
  }, [taskToDelete, deleteTaskMutation]);

  const handleDateChange = useCallback((ganttTask: GanttTask, newStartDate: Date, newEndDate: Date) => {
      console.log(`Gantt Date Change: Task ID ${ganttTask.id}, Start: ${newStartDate}, End: ${newEndDate}`);
      const taskId = parseInt(ganttTask.id);
      if (isNaN(taskId) || newEndDate < newStartDate) {
          toast({ title: "Invalid Dates", description: "Invalid task ID or end date before start date.", variant: "warning" });
          queryClient.invalidateQueries({ queryKey: tasksQueryKey }); // Revert visually
          return;
      }
      updateTaskDateMutation.mutate({ taskId, startDate: newStartDate, dueDate: newEndDate });
  }, [updateTaskDateMutation, queryClient, tasksQueryKey]);

   // --- NEW: Handler for Gantt Progress Changes ---
   const handleProgressChange = useCallback((ganttTask: GanttTask, progress: number) => {
        console.log(`Gantt Progress Change: Task ID ${ganttTask.id}, Progress: ${progress}`);
        const taskId = parseInt(ganttTask.id);
        if (isNaN(taskId)) {
            toast({ title: "Error", description: "Invalid task ID encountered.", variant: "destructive" });
            return;
        }
        // Ensure progress is within bounds
        const validProgress = Math.max(0, Math.min(100, Math.round(progress)));

        updateTaskProgressMutation.mutate({ taskId, progress: validProgress });
   }, [updateTaskProgressMutation]);

    // --- NEW: Placeholder Handlers for Dependency Linking/Unlinking ---
    // NOTE: The `wx-react-gantt` library might not expose specific events for dependency
    // manipulation via dragging. These are placeholders assuming such events exist
    // or could be triggered by other UI elements.
    const handleDependencyLink = useCallback((fromTaskIdStr: string, toTaskIdStr: string) => {
        console.log(`Attempting Link: from task ${fromTaskIdStr} to ${toTaskIdStr}`);
        const predecessorId = parseInt(fromTaskIdStr);
        const successorId = parseInt(toTaskIdStr);
        if (!isNaN(predecessorId) && !isNaN(successorId)) {
             // Basic check to prevent self-linking (if needed)
            if (predecessorId === successorId) {
                toast({ title: "Invalid Link", description: "Cannot link a task to itself.", variant: "warning" });
                return;
            }
            createDependencyMutation.mutate({ predecessorId, successorId });
        } else {
             toast({ title: "Error", description: "Invalid task IDs for dependency.", variant: "destructive" });
        }
    }, [createDependencyMutation]);

    // This handler would likely be called from a different UI element
    // or event, as the Gantt chart might not directly provide the dependency ID on unlink.
    const handleDependencyUnlink = useCallback((dependencyId: number) => {
         console.log(`Attempting Unlink: dependency ID ${dependencyId}`);
         deleteDependencyMutation.mutate(dependencyId);
    }, [deleteDependencyMutation]);

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) {
      return ( // Skeleton
         <div className="space-y-4 p-4">
             <Skeleton className="h-8 w-1/4" />
             <Skeleton className="h-[500px] w-full" />
         </div>
       );
    }

    if (isError) {
      return ( // Error Alert
          <Alert variant="destructive" className="m-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error Loading Data</AlertTitle>
             <AlertDescription>
                {error instanceof Error ? error.message : "Could not load tasks or dependencies."}
             </AlertDescription>
           </Alert>
       );
    }

     // Display message if tasks exist but have date issues preventing display
     const displayableTasks = formattedGanttTasks.length > 0;
     if (!displayableTasks && tasks.length > 0) {
         return ( // Warning Alert for missing dates
             <Alert variant="warning" className="m-4">
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Tasks Cannot Be Displayed</AlertTitle>
                 <AlertDescription>
                    Some tasks are missing start or due dates required for the schedule view. Please edit the tasks to add dates.
                 </AlertDescription>
             </Alert>
          );
     }

     if (tasks.length === 0) {
        return ( // Empty state
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg mt-4">
                 <div className="rounded-full bg-muted p-4 mb-4"><ClipboardList className="h-8 w-8 text-muted-foreground" /></div>
                 <h3 className="text-lg font-semibold mb-1">No Tasks Created Yet</h3>
                 <p className="text-muted-foreground mb-4">Add the first task for this project's schedule.</p>
                 <Button size="sm" onClick={handleAddTaskClick} className="gap-1"><PlusCircle className="h-4 w-4" />Add First Task</Button>
             </div>
         );
    }

    // --- Render Gantt Chart ---
    const isMutating = updateTaskDateMutation.isPending || updateTaskProgressMutation.isPending || createDependencyMutation.isPending || deleteDependencyMutation.isPending;
    return (
        <div className="h-[600px] w-full overflow-auto border rounded-md bg-background relative">
            {isMutating && (
                 <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
                     <Loader2 className="h-6 w-6 animate-spin text-primary" />
                     <span className="ml-2">Saving changes...</span>
                 </div>
            )}
            {/* Render Gantt only when tasks are formatted and ready */}
            {formattedGanttTasks.length > 0 && (
              <Gantt
                  tasks={formattedGanttTasks}
                  viewMode={ViewMode.Week} // Default view mode
                  onClick={handleTaskClick} // Handle task bar clicks -> Edit Dialog
                  onDateChange={handleDateChange} // Handle dragging/resizing task dates
                  onProgressChange={handleProgressChange} // Handle progress handle dragging
                  onRelationChange={handleDependencyLink} // Use the library's prop for creating links
                  // Assuming there's no direct 'unlink' event from the chart itself
                  // Unlinking might need a separate UI element (e.g., in EditTaskDialog)
                  // listCellWidth={"180px"} // Adjust if needed
                  columnWidth={65}
                  rowHeight={40}
                  ganttHeight={580} // Adjust height as needed
                  locale="en-US"
                  readonly={isMutating} // Make Gantt read-only during mutations
              />
            )}
            {/* Dependency Note moved or removed if onRelationChange works */}
             <div className="p-2 text-xs text-muted-foreground border-t">
                 Note: Edit tasks by clicking on them. Change dates by dragging or resizing bars. Change progress using the handle inside bars. Link tasks by dragging from one task circle to another.
             </div>
        </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Tasks & Schedule</CardTitle>
          <CardDescription>Visualize tasks, update dates (drag/resize) and progress (drag handle).</CardDescription>
        </div>
        <Button size="sm" onClick={handleAddTaskClick} className="gap-1" disabled={isLoading}>
           <PlusCircle className="h-4 w-4" /> Add Task
        </Button>
      </CardHeader>
      <CardContent>
         {renderContent()}
      </CardContent>

      {/* Render Dialogs */}
      <CreateTaskDialog
        isOpen={isCreateDialogOpen}
        setIsOpen={setIsCreateDialogOpen}
        projectId={projectId}
        onSubmit={(values) => createTaskMutation.mutate(values)}
        isPending={createTaskMutation.isPending}
      />
       <EditTaskDialog
         isOpen={isEditDialogOpen}
         setIsOpen={setIsEditDialogOpen}
         taskToEdit={taskToEdit}
         projectId={projectId}
         onDeleteRequest={handleDeleteTrigger}
         // You might add handlers here to trigger dependency deletion if needed from Edit dialog
       />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the task <span className="font-medium">"{taskToDelete?.title}"</span> and any associated dependencies.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setTaskToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirmDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteTaskMutation.isPending}
                    >
                         {deleteTaskMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Yes, delete task
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </Card>
  );
}