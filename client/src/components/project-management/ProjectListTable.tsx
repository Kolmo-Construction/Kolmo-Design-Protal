import { Project, User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, PencilIcon } from "lucide-react";
import { format } from "date-fns"; // Assuming you might want to display dates

interface ProjectListTableProps {
  projects: Project[];
  projectManagers: User[];
  isLoading: boolean;
  onEditProject: (project: Project) => void;
}

// Helper function to get status label (can be moved to a utils file)
const getStatusLabel = (status: string | undefined | null): string => {
    if (!status) return 'Unknown';
    switch (status) {
      case "planning": return "Planning";
      case "in_progress": return "In Progress";
      case "on_hold": return "On Hold";
      case "completed": return "Completed";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
};

// Helper function to get status badge styling (can be moved to a utils file)
const getStatusBadgeClasses = (status: string | undefined | null): string => {
    if (!status) return "bg-slate-100 text-slate-800 border-slate-300";
     switch (status) {
        case "planning": return "bg-blue-100 text-blue-800 border-blue-300";
        case "in_progress": return "bg-primary/10 text-primary border-primary/30";
        case "on_hold": return "bg-yellow-100 text-yellow-800 border-yellow-300";
        case "completed": return "bg-green-100 text-green-800 border-green-300";
        default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
};


export function ProjectListTable({
  projects,
  projectManagers,
  isLoading,
  onEditProject,
}: ProjectListTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Budget</TableHead>
          <TableHead>Project Manager</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.length > 0 ? (
          projects.map((project) => {
            const manager = projectManagers?.find(
              (pm) => pm.id === project.projectManagerId
            );
            return (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  {project.city}, {project.state}
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className={getStatusBadgeClasses(project.status)}>
                        {getStatusLabel(project.status)}
                    </Badge>
                </TableCell>
                <TableCell>
                  ${Number(project.totalBudget ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  {manager
                    ? `${manager.firstName} ${manager.lastName}`
                    : project.projectManagerId
                    ? <span className="text-slate-400 italic">Loading...</span>
                    : <span className="text-slate-400">Unassigned</span>}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditProject(project)}
                    className="gap-1"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
              No projects match the current filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}