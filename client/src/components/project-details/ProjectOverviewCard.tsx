import { Project } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Calendar,
  User,
  Users,
  CreditCard,
  Clock,
  Home,
  FileText,
  Phone,
  Mail,
  Building2
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

interface ProjectOverviewCardProps {
  project: Project & {
    projectManager?: { id: number; firstName: string; lastName: string; email?: string; phone?: string } | null;
    clients?: { id: number; firstName: string; lastName: string; email?: string; phone?: string }[];
  };
}

// REMOVED: Local formatDate helper function

export function ProjectOverviewCard({ project }: ProjectOverviewCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-accent-100 text-accent-800 border-accent-200";
      case "in_progress": return "bg-primary-100 text-primary-800 border-primary-200";
      case "on_hold": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "planning": return "Planning";
      case "in_progress": return "In Progress";
      case "on_hold": return "On Hold";
      case "completed": return "Completed";
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Project Information Card */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary-600" />
              Project Information
            </CardTitle>
            <Badge className={cn("border", getStatusColor(project.status))}>
              {getStatusLabel(project.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location & Basic Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-900">{project.address}</p>
                <p className="text-sm text-slate-600">{project.city}, {project.state} {project.zipCode}</p>
              </div>
            </div>
            
            {project.description && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-slate-900 mb-1">Description</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Timeline & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-600" />
                Timeline
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Start Date:</span>
                  <span className="font-medium">{formatDate(project.startDate)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Target Completion:</span>
                  <span className="font-medium">{formatDate(project.estimatedCompletionDate)}</span>
                </div>
                {project.actualCompletionDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Actual Completion:</span>
                    <span className="font-medium text-green-600">{formatDate(project.actualCompletionDate)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary-600" />
                Budget & Progress
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Budget:</span>
                  <span className="font-bold text-lg text-primary-700">
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0 
                    }).format(Number(project.totalBudget || 0))}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Progress:</span>
                    <span className="font-medium">{project.progress || 0}% Complete</span>
                  </div>
                  <Progress value={project.progress || 0} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team & Contacts Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" />
            Project Team
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Manager */}
          {project.projectManager ? (
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-accent-600" />
                Project Manager
              </h4>
              <div className="bg-accent-50 rounded-lg p-3 border border-accent-100">
                <p className="font-medium text-slate-900">
                  {project.projectManager.firstName} {project.projectManager.lastName}
                </p>
                {project.projectManager.email && (
                  <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                    <Mail className="h-3 w-3" />
                    <span>{project.projectManager.email}</span>
                  </div>
                )}
                {project.projectManager.phone && (
                  <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                    <Phone className="h-3 w-3" />
                    <span>{project.projectManager.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h4 className="font-medium text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                Project Manager
              </h4>
              <p className="text-sm text-slate-500 italic">Not assigned</p>
            </div>
          )}

          {/* Clients */}
          <div className="space-y-2">
            <h4 className="font-medium text-slate-900 flex items-center gap-2">
              <Home className="h-4 w-4 text-primary-600" />
              Client{project.clients && project.clients.length > 1 ? 's' : ''}
            </h4>
            {project.clients && project.clients.length > 0 ? (
              <div className="space-y-2">
                {project.clients.map((client, index) => (
                  <div key={client.id} className="bg-primary-50 rounded-lg p-3 border border-primary-100">
                    <p className="font-medium text-slate-900">
                      {client.firstName} {client.lastName}
                    </p>
                    {client.email && (
                      <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                        <Mail className="h-3 w-3" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                        <Phone className="h-3 w-3" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No clients assigned</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}