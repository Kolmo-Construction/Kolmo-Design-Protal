import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Project, ProjectWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { CalendarIcon, Users, UserCircle, DollarSign, MapPin, Clock } from "lucide-react";

interface ProjectCardProps {
  project: Project & {
    projectManager?: { id: number; firstName: string; lastName: string } | null;
    clients?: { id: number; firstName: string; lastName: string }[];
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-accent-600";
      case "in_progress":
        return "bg-primary-600";
      case "on_hold":
        return "bg-yellow-500";
      case "completed":
        return "bg-green-600";
      default:
        return "bg-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planning":
        return "Planning";
      case "in_progress":
        return "In Progress";
      case "on_hold":
        return "On Hold";
      case "completed":
        return "Completed";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Format dates
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "Not set";
    return format(new Date(dateString), "MMM d, yyyy");
  };

  return (
    <div className="dashboard-card bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md">
      {/* Header with Status and Budget */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("text-xs font-medium", getStatusColor(project.status).replace('bg-', 'text-').replace('500', '700'), getStatusColor(project.status).replace('bg-', 'bg-').replace('500', '100'))}>
            {getStatusLabel(project.status)}
          </Badge>
          {project.totalBudget && (
            <div className="flex items-center text-sm font-semibold text-primary-700">
              <DollarSign className="h-4 w-4 mr-1" />
              {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0 
              }).format(Number(project.totalBudget))}
            </div>
          )}
        </div>
      </div>

      {/* Project Image */}
      <div className="h-32 bg-slate-200 relative">
        <img 
          src={project.imageUrl || 
            `https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`} 
          alt={project.name} 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="p-4">
        {/* Project Title */}
        <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2">{project.name}</h3>
        
        {/* Location */}
        <div className="flex items-start text-sm text-slate-600 mb-3">
          <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-1">{project.address}, {project.city}, {project.state}</span>
        </div>

        {/* Key Personnel */}
        <div className="space-y-2 mb-4">
          {/* Clients */}
          {project.clients && project.clients.length > 0 && (
            <div className="flex items-center text-sm">
              <div className="w-16 text-slate-500 flex-shrink-0">Client:</div>
              <div className="flex-1 font-medium text-slate-700">
                {project.clients.length === 1 ? (
                  `${project.clients[0].firstName} ${project.clients[0].lastName}`
                ) : (
                  `${project.clients[0].firstName} ${project.clients[0].lastName} +${project.clients.length - 1}`
                )}
              </div>
            </div>
          )}
          
          {/* Project Manager */}
          {project.projectManager && (
            <div className="flex items-center text-sm">
              <div className="w-16 text-slate-500 flex-shrink-0">PM:</div>
              <div className="flex-1 font-medium text-slate-700">
                {project.projectManager.firstName} {project.projectManager.lastName}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Started: {formatDate(project.startDate)}
            </div>
            <div>
              Due: {formatDate(project.estimatedCompletionDate)}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                project.status === "on_hold" ? "bg-yellow-500" : 
                project.status === "completed" ? "bg-green-600" : "bg-primary-600"
              )} 
              style={{ width: `${project.progress || 0}%` }}
            ></div>
          </div>
          <div className="text-xs text-slate-600 text-center">
            {project.progress || 0}% Complete
          </div>
        </div>
        
        <Link href={`/projects/${project.id}`}>
          <Button variant="default" className="w-full">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
}
