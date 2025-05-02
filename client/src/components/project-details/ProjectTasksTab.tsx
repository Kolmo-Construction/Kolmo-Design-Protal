// client/src/components/project-details/ProjectTasksTab.tsx
import React, { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { Task as ApiTask, InsertTask, TaskDependency, User } from "@shared/schema";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, PlusCircle, ClipboardList, AlertTriangle, Trash2, Eye } from "lucide-react";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";

// --- NEW LIBRARY IMPORTS ---
import { Gantt, Task, EventOption, StylingOption, ViewMode, DisplayOption } from 'gantt-task-react';
import "gantt-task-react/dist/index.css"; // Import the CSS for the new library
// --- END NEW LIBRARY IMPORTS ---

// Import the updated utility function
import { formatTasksForGanttReact } from "@/lib/gantt-utils"; // Use the function adapted for gantt-task-react

// Hooks
import { useProjectTaskMutations } from "@/hooks/useProjectTaskMutations";
import { useTaskDialogs } from "@/hooks/useTaskDialogs";

interface ProjectTasksTabProps {
  projectId: number;
  user?: User; // Make user optional since it's passed from parent
}

// Type alias for the new library's Task type for clarity
type GanttReactTask = Task;

export function ProjectTasksTab({ projectId, user }: ProjectTasksTabProps) {
  // Fetch tasks and dependencies (remains the same)
  const tasksQueryKey = [`/api/projects/${projectId}/tasks`];
  const dependenciesQueryKey = [`/api/projects/${projectId}/tasks/dependencies`]; // Keep if needed for formatting

  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: errorTasks,
    isError: isErrorTasks,
    status: tasksStatus
  } = useQuery<ApiTask[]>({ queryKey: tasksQueryKey, queryFn: getQueryFn({ on401: "throw" }), enabled: !!projectId });

  // Fetch dependencies if your formatter uses them (formatTasksForGanttReact currently uses parentId)
  const {
      data: dependencies = [], // Or however dependencies are fetched/structured
      isLoading: isLoadingDeps,
      error: errorDeps,
      isError: isErrorDeps,
      status: depsStatus
  } = useQuery<TaskDependency[]>({ queryKey: dependenciesQueryKey, queryFn: getQueryFn({ on401: "throw" }), enabled: !!projectId && !isLoadingTasks });


  // --- Format tasks using the NEW utility function ---
  const formattedGanttTasks: GanttReactTask[] = useMemo(
      () => formatTasksForGanttReact(tasks), // Call the correct formatter
      [tasks] // Dependencies might be needed if formatter changes: [tasks, dependencies]
  );
  // --- END FORMATTING ---


  // Overall Loading and Error states (remains the same)
  const isLoading = isLoadingTasks || isLoadingDeps;
  const isError = isErrorTasks || isErrorDeps;
  const error = errorTasks || errorDeps;

  // Mutations hook
  const {
      createTaskMutation,
      deleteTaskMutation,
      updateTaskDateMutation,
      updateTaskProgressMutation,
      // Dependency mutations might be needed if library supports link creation via UI
      // createDependencyMutation,
      // deleteDependencyMutation,
  } = useProjectTaskMutations(projectId);

  // Dialogs hook (remains the same)
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
      handleTaskClick, // Used by handleDblClick below
      handleDeleteTrigger // Used by handleTaskDelete below
  } = useTaskDialogs(tasks);

  // Delete confirmation handler (remains the same)
  const confirmDelete = useCallback(() => {
      if (taskToDelete) {
          deleteTaskMutation.mutate(taskToDelete.id, {
              onSuccess: () => setIsDeleteDialogOpen(false),
              onError: () => setIsDeleteDialogOpen(false)
          });
      }
  }, [taskToDelete, deleteTaskMutation, setIsDeleteDialogOpen]);

  // --- Interaction Handlers for gantt-task-react ---

  /**
   * Handles date changes from dragging/resizing bars.
   * IMPORTANT: This library might trigger this continuously during drag.
   * Check the library's documentation if you only want to trigger on drag end.
   * We also check if dates actually changed before mutating.
   */
  const handleTaskChange = useCallback((task: GanttReactTask) => {
    console.log("[gantt-task-react] onDateChange:", task);
    const originalTask = tasks.find(t => String(t.id) === task.id);

    // Check if dates actually changed to avoid unnecessary mutations during drag
    const startDateChanged = originalTask?.startDate !== task.start.toISOString().split('T')[0]; // Compare YYYY-MM-DD part
    const dueDateChanged = originalTask?.dueDate !== task.end.toISOString().split('T')[0]; // Compare YYYY-MM-DD part

    if (originalTask && (startDateChanged || dueDateChanged)) {
        console.log(`[gantt-task-react] Dates changed for task ${task.id}. Mutating.`);
        updateTaskDateMutation.mutate({
            taskId: parseInt(task.id, 10), // Convert ID back to number if API expects number
            startDate: task.start.toISOString(),
            dueDate: task.end.toISOString(),
        });
    } else {
        // console.log(`[gantt-task-react] Dates did not change for task ${task.id}. Skipping mutation.`);
    }
  }, [tasks, updateTaskDateMutation]); // Include dependencies

  /**
   * Handles task deletion triggered by the library's UI (if available).
   */
  const handleTaskDelete = useCallback((task: GanttReactTask) => {
     console.log("[gantt-task-react] onDelete:", task);
     // Find original task to show name in dialog and trigger confirmation
     const originalTask = tasks.find(t => String(t.id) === task.id);
     if (originalTask) {
         handleDeleteTrigger(originalTask); // Use existing dialog trigger
     } else {
         console.warn(`Could not find original task with ID ${task.id} for deletion.`);
     }
  }, [tasks, handleDeleteTrigger]); // Include dependencies

  /**
   * Handles progress changes from dragging the progress handle.
   */
  const handleProgressChange = useCallback((task: GanttReactTask) => {
    console.log("[gantt-task-react] onProgressChange:", task);
    const originalTask = tasks.find(t => String(t.id) === task.id);
    // Optional: Check if progress actually changed
    if (originalTask && originalTask.progress !== task.progress) {
         updateTaskProgressMutation.mutate({
             taskId: parseInt(task.id, 10), // Convert ID back to number if API expects number
             progress: task.progress,
             // Include other fields if your mutation requires them (like status)
             // status: task.progress === 100 ? 'COMPLETED' : (task.progress > 0 ? 'IN_PROGRESS' : 'PENDING') // Example status update
         });
    }
  }, [tasks, updateTaskProgressMutation]); // Include dependencies

  /**
   * Handles double-clicking on a task bar or list item. Opens Edit Dialog.
   */
  const handleDblClick = useCallback((task: GanttReactTask) => {
    console.log("[gantt-task-react] onDoubleClick:", task);
    const originalTask = tasks.find(t => String(t.id) === task.id);
    if (originalTask && handleTaskClick) { // handleTaskClick opens the Edit Dialog
        handleTaskClick(originalTask);
    } else {
         console.warn(`Could not find original task with ID ${task.id} for double click.`);
    }
  }, [tasks, handleTaskClick]); // Include dependencies

  /**
   * Handles single-clicking on a task bar or list item. (Optional action)
   */
  const handleClick = useCallback((task: GanttReactTask) => {
    console.log("[gantt-task-react] onClick:", task.id);
    // Implement single-click behavior if needed (e.g., highlighting, showing details)
    // Currently does nothing.
  }, []); // No dependencies needed if it does nothing

  /**
   * Handles task selection change. (Optional action)
   */
  const handleSelect = useCallback((task: GanttReactTask, isSelected: boolean) => {
    console.log(`[gantt-task-react] onSelect: ${task.name} ${isSelected ? 'selected' : 'unselected'}`);
    // Implement selection behavior if needed (e.g., managing selected task state)
  }, []); // No dependencies needed if it does nothing

  /**
   * Handles clicking the expander icon for project tasks. (Optional action)
   */
  const handleExpanderClick = useCallback((task: GanttReactTask) => {
    console.log("[gantt-task-react] onExpanderClick:", task);
    // Implement expand/collapse logic if using 'project' type tasks with children
    // This usually involves managing local state to update the 'hideChildren' property
    // and potentially re-rendering or passing updated tasks to the Gantt component.
  }, []); // Dependencies would include state setter if managing expansion

  // --- End Interaction Handlers ---


  // Debug logging effect (optional)
  React.useEffect(() => {
    console.log('ProjectTasksTab State (gantt-task-react):', {
      projectId, isLoading, isError, error: error ? (error instanceof Error ? error.message : String(error)) : null,
      tasksStatus, tasksCount: tasks?.length, formattedGanttTasksCount: formattedGanttTasks?.length,
    });
  }, [ projectId, isLoading, isError, error, tasksStatus, tasks, formattedGanttTasks ]);


  // --- Render Logic ---
  const renderContent = () => {
    // Initial loading check
    if (isLoading && tasksStatus !== 'success') {
      return ( /* Skeleton */
         <div className="space-y-4 p-4">
             <Skeleton className="h-8 w-1/4" />
             <Skeleton className="h-[500px] w-full" />
         </div>
       );
    }
    // API error check
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

     // Empty state if initial fetch resulted in zero tasks
     if (tasks.length === 0 && !isLoading && tasksStatus === 'success') {
        return ( /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-lg mt-4">
                 <div className="rounded-full bg-muted p-4 mb-4"><ClipboardList className="h-8 w-8 text-muted-foreground" /></div>
                 <h3 className="text-lg font-semibold mb-1">No Tasks Created Yet</h3>
                 <p className="text-muted-foreground mb-4">Add the first task for this project's schedule.</p>
                 {!isClient && (
                   <Button size="sm" onClick={handleAddTaskClick} className="gap-1">
                     <PlusCircle className="h-4 w-4" />Add First Task
                   </Button>
                 )}
             </div>
         );
     }

    // Check pending status for mutations
    const isMutating = createTaskMutation.isPending || deleteTaskMutation.isPending || updateTaskDateMutation.isPending || updateTaskProgressMutation.isPending;

    // If client view, render a more beautiful timeline visualization
    if (isClient && tasks.length > 0) {
      // Sort tasks by start date
      const sortedTasks = [...tasks].sort((a, b) => {
        if (a.startDate && b.startDate) {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }
        if (a.startDate) return -1;
        if (b.startDate) return 1;
        return a.id - b.id;
      });

      // Find project timeframe
      const today = new Date();
      let projectStart = today;
      let projectEnd = today;
      
      sortedTasks.forEach(task => {
        if (task.startDate) {
          const taskStartDate = new Date(task.startDate);
          if (taskStartDate < projectStart) {
            projectStart = taskStartDate;
          }
        }
        
        if (task.dueDate) {
          const taskDueDate = new Date(task.dueDate);
          if (taskDueDate > projectEnd) {
            projectEnd = taskDueDate;
          }
        }
      });
      
      // Calculate completed tasks
      const completedTasks = sortedTasks.filter(task => task.status === 'done').length;
      const totalTasks = sortedTasks.length;
      const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
      
      // Calculate time progress
      const totalDuration = (projectEnd.getTime() - projectStart.getTime()) || 1;
      const elapsedDuration = (today.getTime() - projectStart.getTime());
      const timeProgress = Math.min(Math.max(Math.round((elapsedDuration / totalDuration) * 100), 0), 100);
      
      return (
        <div className="w-full overflow-auto relative">
          {/* Progress Overview */}
          <div className="mb-8 p-6 border rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-slate-800 flex items-center">
              <div className="bg-blue-100 rounded-full p-1.5 mr-2">
                <Clock className="h-5 w-5 text-blue-700" />
              </div>
              Project Timeline Overview
            </h3>
            
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-3">Project Timeline</p>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="text-base font-medium">{projectStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="flex-grow mx-2 px-2">
                    <div className="h-0.5 w-full bg-slate-100 relative">
                      <div className="absolute inset-y-0 left-0 bg-blue-500" style={{ width: `${timeProgress}%` }}></div>
                      <div 
                        className="absolute h-3 w-3 bg-red-500 rounded-full -top-1" 
                        style={{ left: `${timeProgress}%`, transform: 'translateX(-50%)' }}
                      ></div>
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-1">Today</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500">End Date</p>
                    <p className="text-base font-medium">{projectEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-3">Tasks Progress</p>
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-slate-500">Completion</p>
                    <p className="text-xs font-medium">{completionPercentage}%</p>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-1">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" 
                      style={{ width: `${completionPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <p>{completedTasks} completed</p>
                    <p>{totalTasks} total tasks</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-3">Task Status Breakdown</p>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-green-500 mr-2"></div>
                      <p className="text-xs">Completed</p>
                    </div>
                    <p className="text-xs font-medium">{sortedTasks.filter(t => t.status === 'done').length}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-blue-500 mr-2"></div>
                      <p className="text-xs">In Progress</p>
                    </div>
                    <p className="text-xs font-medium">{sortedTasks.filter(t => t.status === 'in_progress').length}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-yellow-500 mr-2"></div>
                      <p className="text-xs">Todo</p>
                    </div>
                    <p className="text-xs font-medium">{sortedTasks.filter(t => t.status === 'todo').length}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-sm bg-red-500 mr-2"></div>
                      <p className="text-xs">Blocked</p>
                    </div>
                    <p className="text-xs font-medium">{sortedTasks.filter(t => t.status === 'blocked').length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Timeline */}
          <div className="p-6 border rounded-xl shadow-sm bg-white">
            <h3 className="text-xl font-semibold mb-4 text-slate-800 flex items-center">
              <div className="bg-indigo-100 rounded-full p-1.5 mr-2">
                <ClipboardList className="h-5 w-5 text-indigo-700" />
              </div>
              Project Schedule
            </h3>
            
            <div className="relative mt-8 mb-4">
              {/* Timeline bar */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
              
              {/* Timeline points */}
              <div className="space-y-10">
                {sortedTasks.map((task, index) => {
                  // Determine status color
                  let statusColor = 'bg-slate-400'; // default
                  let statusTextColor = 'text-slate-800';
                  if (task.status === 'done') {
                    statusColor = 'bg-green-500';
                    statusTextColor = 'text-green-800';
                  } else if (task.status === 'in_progress') {
                    statusColor = 'bg-blue-500';
                    statusTextColor = 'text-blue-800';
                  } else if (task.status === 'blocked') {
                    statusColor = 'bg-red-500';
                    statusTextColor = 'text-red-800';
                  } else if (task.status === 'todo') {
                    statusColor = 'bg-yellow-500';
                    statusTextColor = 'text-yellow-800';
                  }
                  
                  // Format dates
                  const startDate = task.startDate ? new Date(task.startDate) : null;
                  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

                  return (
                    <div key={task.id} className="relative pl-14">
                      {/* Timeline point */}
                      <div className={`absolute left-6 -translate-x-1/2 w-4 h-4 rounded-full ${statusColor} border-4 border-white`}></div>
                      
                      {/* Task card with animation */}
                      <div 
                        className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-medium">{task.title}</h4>
                            {task.description && (
                              <p className="text-slate-600 text-sm mt-1">{task.description}</p>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor} bg-opacity-20 ${statusTextColor}`}>
                              {task.status === 'done' ? 'Completed' : 
                               task.status === 'in_progress' ? 'In Progress' :
                               task.status === 'blocked' ? 'Blocked' : 'Planned'}
                            </span>
                            
                            {startDate && dueDate && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Footer note */}
          <div className="p-2 text-xs text-slate-500 text-center mt-4">
            This timeline view shows your project's schedule in a client-friendly format.
          </div>
        </div>
      );
    }

    // For admin/PM, render the technical Gantt chart
    return (
        <div className="h-[600px] w-full overflow-auto border rounded-md bg-background relative">
            {isMutating && ( /* Loading overlay */
                 <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
                     <Loader2 className="h-6 w-6 animate-spin text-primary" />
                     <span className="ml-2">Processing...</span>
                 </div>
            )}
            {/* Render Gantt directly only if there are formatted tasks */}
            {formattedGanttTasks.length > 0 ? (
              <div className="gantt-container relative">
                {console.log('[ProjectTasksTab] Rendering gantt-task-react with tasks:', JSON.parse(JSON.stringify(formattedGanttTasks)))}

                {/* --- Use gantt-task-react Component with Interaction Handlers --- */}
                <Gantt
                    tasks={formattedGanttTasks} // Pass formatted tasks
                    viewMode={ViewMode.Week} // Example view mode
                    // --- Event Handlers for gantt-task-react ---
                    onDateChange={handleTaskChange} // Handles drag/resize
                    onDelete={handleTaskDelete} // Handles delete action
                    onProgressChange={handleProgressChange} // Handles progress
                    onDoubleClick={handleDblClick} // Handles double click
                    onClick={handleClick} // Always allow single click
                    onSelect={handleSelect} // Always allow selection
                    onExpanderClick={handleExpanderClick} // Always allow expand/collapse

                    // --- Styling & Config Props (Examples - check docs) ---
                    listCellWidth={"150px"} // Adjust width of the task list column
                    // columnWidth={60} // Adjust width of date columns in timeline
                    // ganttHeight={580} // Optional: Set explicit height
                    // barCornerRadius={4} // Optional: Styling
                    // handleWidth={8} // Optional: Styling
                    // Other relevant props:
                    // locale="en-US" // Set locale for date formatting
                    // timeStep={3600000} // Example: Set minimum time step (1 hour)
                    // Tooltip props if needed:
                    // TooltipContent={({ task, fontSize, fontFamily }) => <div>Custom: {task.name}</div>}
                />
                {/* --- End gantt-task-react Component --- */}
              </div>
            ) : (
                // Show message if tasks were fetched but all were filtered out by formatter
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
                 Note: Using gantt-task-react library. Drag tasks to adjust dates and progress.
             </div>
        </div>
    );
  };

  // Check if user is a client
  const isClient = user?.role === 'client';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Tasks & Schedule</CardTitle>
          <CardDescription>
            {isClient 
              ? "View project tasks and schedule timeline." 
              : "Visualize tasks, update dates (drag/resize) and progress (drag handle)."}
          </CardDescription>
        </div>
        {/* Only show Add Task button for non-client users */}
        {!isClient && (
          <Button size="sm" onClick={handleAddTaskClick} className="gap-1" disabled={isLoading && !tasks?.length}>
              <PlusCircle className="h-4 w-4" /> Add Task
          </Button>
        )}
        {/* Show view-only indicator for clients */}
        {isClient && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Eye className="h-4 w-4 mr-1" /> View Only
          </div>
        )}
      </CardHeader>
      <CardContent>
         {renderContent()}
      </CardContent>

      {/* Only render dialogs for non-client users */}
      {!isClient && (
        <>
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
         taskToEdit={taskToEdit}
         projectId={projectId}
         onDeleteRequest={handleDeleteTrigger}
       />

       {/* --- Ensure AlertDialog Structure is Correct --- */}
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
       {/* --- End AlertDialog --- */}
        </>
      )}
    </Card>
  );
}
