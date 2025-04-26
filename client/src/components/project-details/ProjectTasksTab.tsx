import { useQuery } from "@tanstack/react-query";
import { Task } from "@shared/schema"; // Assuming Task type is exported from schema
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
// TODO: Import your chosen Gantt library component, e.g.:
// import { Gantt } from "wx-react-gantt";
// import "wx-react-gantt/dist/index.css"; // Import its CSS

interface ProjectTasksTabProps {
  projectId: number;
}

export function ProjectTasksTab({ projectId }: ProjectTasksTabProps) {
  const {
    data: tasks = [],
    isLoading,
    error,
  } = useQuery<Task[]>({ // Replace 'Task[]' with the actual type expected by your Gantt library if needed
    // Use a specific query key including projectId
    queryKey: [`/api/projects/${projectId}/tasks`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: projectId > 0,
  });

  // TODO: Format tasks data for the Gantt library
  // const ganttTasks = tasks.map(task => ({
  //   id: task.id.toString(),
  //   start: task.startDate ? new Date(task.startDate) : new Date(), // Adjust as needed
  //   end: task.dueDate ? new Date(task.dueDate) : new Date(),       // Adjust as needed
  //   text: task.title,
  //   progress: (task.status === 'done' ? 100 : 0), // Simple progress example
  //   // ... other fields required by the Gantt library
  // }));

  // TODO: Implement create/edit task dialogs/modals
  const handleAddTask = () => {
    console.log("Open Add Task Dialog");
    // Example: openDialog(<CreateTaskDialog projectId={projectId} />);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Project Tasks & Schedule</CardTitle>
          <CardDescription>Manage and visualize project tasks and dependencies.</CardDescription>
        </div>
        <Button size="sm" onClick={handleAddTask} className="gap-1">
           <PlusCircle className="h-4 w-4" />
           Add Task
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="text-red-600 text-center py-4">
            Error loading tasks: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        )}
        {!isLoading && !error && (
          <div className="h-[600px] w-full"> {/* Set height for Gantt chart */}
             {/* TODO: Render the Gantt chart component */}
             {/* Example placeholder using SVAR Gantt */}
             {/* <Gantt
                 tasks={ganttTasks}
                 // Add other required props like viewMode, onTaskClick, etc.
             /> */}
             <p className="text-center text-slate-500 p-8 border border-dashed rounded-md">
                 Gantt Chart Placeholder - Install and configure a library like SVAR React Gantt (`wx-react-gantt`) here.
                 <br /> Found {tasks.length} tasks.
             </p>
             {/* TODO: Add components for Task Lists / Details / Editing below or beside the chart */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}