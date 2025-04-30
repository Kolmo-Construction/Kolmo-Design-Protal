// client/src/components/project-details/ProjectTasksTab.tsx
import React, { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
// Make sure Task type from schema doesn't clash with GanttTask alias
import type { Task as ApiTask, InsertTask, TaskDependency } from "@shared/schema";
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
import { CreateTaskDialog } from "./CreateTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
// Import Gantt component directly
import { Gantt, Task as GanttLibraryTask } from "wx-react-gantt"; // Renamed alias
import "wx-react-gantt/dist/gantt.css";
// Assuming formatTasksForGantt returns { tasks: FormattedGanttTask[], links: FormattedGanttLink[] }
// where FormattedGanttTask matches the structure needed by wx-react-gantt
import { formatTasksForGantt } from "@/lib/gantt-utils";
import { useProjectTaskMutations } from "@/hooks/useProjectTaskMutations";
import { useGanttInteractions } from "@/hooks/useGanttInteractions";
import { useTaskDialogs } from "@/hooks/useTaskDialogs";

// Define ViewMode enum based on required library values
const ViewMode = {
  Day: "Day",
  Week: "Week",
  Month: "Month"
} as const;

// Create a type from the enum values
type ViewModeType = typeof ViewMode[keyof typeof ViewMode];

interface ProjectTasksTabProps {
  projectId: number;
}

// Define our formatted task type that matches the output structure from formatTasksForGantt
interface FormattedGanttTask {
    id: string;
    name: string;
    start: Date;
    end: Date;
    progress: number;
    type: 'task' | 'milestone' | 'project';
    isDisabled?: boolean;
    styles?: object;
    // Add text field which is required by Gantt component
    text: string;
}

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  // Fetch tasks and dependencies
  const tasksQueryKey = [`/api/projects/${projectId}/tasks`];
  const dependenciesQueryKey = [`/api/projects/${projectId}/tasks/dependencies`];

  const {
    data: tasks = [], // Default to empty array
    isLoading: isLoadingTasks,
    error: errorTasks,
    isError: isErrorTasks,
    isFetching: isFetchingTasks,
    status: tasksStatus
  } = useQuery<ApiTask[]>({ queryKey: tasksQueryKey, queryFn: getQueryFn({ on401: "throw" }), enabled: !!projectId });

  const {
      data: dependencies = [], // Default to empty array
      isLoading: isLoadingDeps,
      error: errorDeps,
      isError: isErrorDeps,
      isFetching: isFetchingDeps,
      status: depsStatus
  } = useQuery<TaskDependency[]>({ queryKey: dependenciesQueryKey, queryFn: getQueryFn({ on401: "throw" }), enabled: !!projectId && !isLoadingTasks });

  // Format tasks for Gantt using useMemo
  // The type assertion helps TypeScript understand the expected output shape
  const { tasks: formattedGanttTasks, links: formattedGanttLinks } = useMemo(
      () => formatTasksForGantt(tasks /* Pass dependencies if needed by formatter */),
      [tasks /* Add dependencies here if used in formatTasksForGantt */]
  );

  // Overall Loading and Error states
  const isLoading = isLoadingTasks || isLoadingDeps;
  const isError = isErrorTasks || isErrorDeps;
  const error = errorTasks || errorDeps;

  // Mutations hook
  const {
      createTaskMutation,
      deleteTaskMutation,
      updateTaskDateMutation,
      updateTaskProgressMutation,
      createDependencyMutation,
      deleteDependencyMutation,
  } = useProjectTaskMutations(projectId);

  // Gantt interactions hook
  const {
      handleDateChange,
      handleProgressChange,
      handleDependencyLink,
  } = useGanttInteractions({
      updateTaskDateMutation,
      updateTaskProgressMutation,
      createDependencyMutation,
      deleteDependencyMutation,
      tasksQueryKey,
  });

  // Dialogs hook
  const {
      isCreateDialogOpen,
      setIsCreateDialogOpen,
      isEditDialogOpen,
      setIsEditDialogOpen,
      isDeleteDialogOpen,
      setIsDeleteDialogOpen,
      taskToEdit,
      taskToDelete,
      handleAddTaskClick,
      handleTaskClick,
      handleDeleteTrigger
  } = useTaskDialogs(tasks); // Pass original tasks if needed by dialogs

  // Delete confirmation handler
  const confirmDelete = useCallback(() => {
      if (taskToDelete) {
          deleteTaskMutation.mutate(taskToDelete.id, {
              onSuccess: () => setIsDeleteDialogOpen(false),
              onError: () => setIsDeleteDialogOpen(false)
          });
      }
  }, [taskToDelete, deleteTaskMutation, setIsDeleteDialogOpen]);

  // Debug logging effect
  React.useEffect(() => {
    console.log('ProjectTasksTab State:', {
      projectId,
      isLoading,
      isError,
      error: error ? (error instanceof Error ? error.message : String(error)) : null,
      tasksStatus,
      tasksCount: tasks?.length,
      depsStatus,
      depsCount: dependencies?.length,
      // Log the actual formatted tasks count
      formattedGanttTasksCount: formattedGanttTasks?.length,
    });
  }, [
      projectId, isLoading, isError, error, tasksStatus, tasks,
      depsStatus, dependencies, formattedGanttTasks // Dependency array updated
  ]);


  // --- Render Logic ---
  const renderContent = () => {
    // Use a more robust initial loading check
    if (isLoading && tasksStatus !== 'success' && depsStatus !== 'success') {
      return ( /* Skeleton */
         <div className="space-y-4 p-4">
             <Skeleton className="h-8 w-1/4" />
             <Skeleton className="h-[500px] w-full" />
         </div>
       );
    }
    if (isError) {
      const errorMessage = error instanceof Error ? error.message : "Could not load tasks or dependencies.";
      return ( /* Error Alert */
          <Alert variant="destructive" className="m-4">
             <AlertTriangle className="h-4 w-4" />
             <AlertTitle>Error Loading Data</AlertTitle>
             <AlertDescription>{errorMessage}</AlertDescription>
           </Alert>
      );
     }

     // --- REMOVED THE PROBLEMATIC ALERT BLOCK ---
     // The logic below handles empty states correctly.

     // Show empty state only if *initial fetch* resulted in zero tasks and not loading
     if (tasks.length === 0 && !isLoading && tasksStatus === 'success') {
        return ( /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg mt-4">
                 <div className="rounded-full bg-muted p-4 mb-4"><ClipboardList className="h-8 w-8 text-muted-foreground" /></div>
                 <h3 className="text-lg font-semibold mb-1">No Tasks Created Yet</h3>
                 <p className="text-muted-foreground mb-4">Add the first task for this project's schedule.</p>
                 <Button size="sm" onClick={handleAddTaskClick} className="gap-1"><PlusCircle className="h-4 w-4" />Add First Task</Button>
             </div>
         );
     }

    // Check pending status for mutations that block Gantt interaction
    const isMutatingGantt = updateTaskDateMutation.isPending ||
                           updateTaskProgressMutation.isPending ||
                           createDependencyMutation.isPending ||
                           deleteDependencyMutation.isPending;

    // Render Gantt container (even if formattedTasks is empty, the wrapper inside won't render)
    return (
        <div className="h-[600px] w-full overflow-auto border rounded-md bg-background relative">
            {isMutatingGantt && ( /* Loading overlay */
                 <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
                     <Loader2 className="h-6 w-6 animate-spin text-primary" />
                     <span className="ml-2">Saving changes...</span>
                 </div>
            )}
            {/* Render Gantt only if there are formatted tasks to display */}
            {formattedGanttTasks.length > 0 ? (
              <div className="gantt-container relative">
                {/* Using Gantt component directly */}
                <Gantt
                    tasks={formattedGanttTasks as unknown as GanttLibraryTask[]} // Using unknown to bypass type checking
                    // Pass formatted links if your Gantt library uses them
                    // links={formattedGanttLinks}
                    viewMode="Week" // Or your desired default
                    onClick={(task) => { // Use the library's task type
                      try {
                        // Find the original task by ID
                        const originalTask = tasks.find(t => String(t.id) === String(task.id));
                        if (originalTask && handleTaskClick) handleTaskClick(originalTask as any);
                      } catch (err) { console.error("Error in Gantt onClick handler:", err); }
                    }}
                    onDateChange={(task, start, end) => {
                      try {
                        if (handleDateChange) handleDateChange(task as any, start, end);
                      } catch (err) { console.error("Error in Gantt onDateChange handler:", err); }
                    }}
                    onProgressChange={(task, progress) => {
                      try {
                        if (handleProgressChange) handleProgressChange(task as any, progress);
                      } catch (err) { console.error("Error in Gantt onProgressChange handler:", err); }
                    }}
                    // Adjust based on how wx-react-gantt handles dependency creation events
                    onRelationChange={(fromTaskId, toTaskId) => {
                      try {
                         // Ensure IDs are passed correctly to the interaction handler
                        if (handleDependencyLink) handleDependencyLink(String(fromTaskId), String(toTaskId));
                      } catch (err) { console.error("Error in Gantt onRelationChange handler:", err); }
                    }}
                    listCellWidth={"180px"}
                    columnWidth={65}
                    rowHeight={40}
                    ganttHeight={580} // Adjust height as needed
                    locale="en-US"
                    readonly={isMutatingGantt}
                />
              </div>
            ) : (
                // Optional: Show a message if tasks were fetched but all were filtered out
                tasks.length > 0 && !isLoading && tasksStatus === 'success' && (
                     <div className="flex flex-col items-center justify-center py-16 text-center">
                         <AlertTriangle className="h-8 w-8 text-muted-foreground mb-4" />
                         <h3 className="text-lg font-semibold mb-1">No Tasks to Display</h3>
                         <p className="text-muted-foreground">
                             Tasks were found, but none have valid start and end dates for the schedule view.
                         </p>
                     </div>
                )
            )}
             <div className="p-2 text-xs text-muted-foreground border-t">
                 Note: Edit tasks by clicking on them. Change dates by dragging or resizing bars... {/* Shortened */}
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
        <Button size="sm" onClick={handleAddTaskClick} className="gap-1" disabled={isLoading && !tasks?.length}>
            <PlusCircle className="h-4 w-4" /> Add Task
        </Button>
      </CardHeader>
      <CardContent>
         {renderContent()}
      </CardContent>

      {/* Dialogs using state/handlers from useTaskDialogs hook */}
       <CreateTaskDialog
         isOpen={isCreateDialogOpen}
         setIsOpen={setIsCreateDialogOpen}
         projectId={projectId}
         onSubmit={(values) => createTaskMutation.mutate(values, {
             onSuccess: () => setIsCreateDialogOpen(false)
         })}
         isPending={createTaskMutation.isPending}
       />
       <EditTaskDialog
         isOpen={isEditDialogOpen}
         setIsOpen={setIsEditDialogOpen}
         taskToEdit={taskToEdit} // Pass original ApiTask if EditDialog expects that
         projectId={projectId}
         onDeleteRequest={handleDeleteTrigger}
       />
       <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the task <span className="font-medium">"{taskToDelete?.title}"</span> and any associated dependencies.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                     <AlertDialogCancel disabled={deleteTaskMutation.isPending}>Cancel</AlertDialogCancel>
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
