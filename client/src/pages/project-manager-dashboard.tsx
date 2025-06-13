import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, DollarSign, FileText, Users, AlertTriangle, CheckCircle, Building, MapPin } from 'lucide-react';
import { Link } from 'wouter';

interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  taskCompletionRate: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  openPunchItems: number;
  totalInvoiceAmount: number;
  paidAmount: number;
}

interface ProjectWithStats {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  status: string;
  totalBudget: string;
  progress: number;
  startDate: string;
  estimatedCompletionDate: string;
  stats: ProjectStats;
}

interface OverallStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  totalCompletedTasks: number;
  totalOverdueTasks: number;
  totalInvoiceAmount: number;
  totalPaidAmount: number;
  totalOpenPunchItems: number;
}

interface ProjectManagerDashboardData {
  projectManager: {
    id: number;
    name: string;
    role: string;
  };
  overallStats: OverallStats;
  assignedProjects: ProjectWithStats[];
  message: string;
}

const ProjectManagerDashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery<ProjectManagerDashboardData>({
    queryKey: ['/api/project-manager/dashboard']
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Access Denied</h3>
              <p className="text-sm text-muted-foreground">
                Only project managers can access this dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">No dashboard data available.</p>
      </div>
    );
  }

  const { projectManager, overallStats, assignedProjects } = dashboardData;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Manager Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {projectManager.name}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {dashboardData.message}
        </Badge>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {overallStats.activeProjects} active, {overallStats.completedProjects} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.totalTasks > 0 ? Math.round((overallStats.totalCompletedTasks / overallStats.totalTasks) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {overallStats.totalCompletedTasks} of {overallStats.totalTasks} tasks completed
            </p>
            {overallStats.totalOverdueTasks > 0 && (
              <p className="text-xs text-red-600 mt-1">
                {overallStats.totalOverdueTasks} overdue
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overallStats.totalPaidAmount)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(overallStats.totalInvoiceAmount)} invoiced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Punch List Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalOpenPunchItems}</div>
            <p className="text-xs text-muted-foreground">Open items requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Projects ({assignedProjects.length})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({assignedProjects.filter(p => p.status === 'in_progress').length})
          </TabsTrigger>
          <TabsTrigger value="planning">
            Planning ({assignedProjects.filter(p => p.status === 'planning').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({assignedProjects.filter(p => p.status === 'completed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ProjectGrid projects={assignedProjects} />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <ProjectGrid projects={assignedProjects.filter(p => p.status === 'in_progress')} />
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <ProjectGrid projects={assignedProjects.filter(p => p.status === 'planning')} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <ProjectGrid projects={assignedProjects.filter(p => p.status === 'completed')} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ProjectGrid = ({ projects }: { projects: ProjectWithStats[] }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      case 'planning': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
            <p className="text-muted-foreground">No projects match the selected filter.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  {project.city}, {project.state}
                </div>
              </div>
              <Badge className={getStatusColor(project.status)}>
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Project Progress</span>
                <span>{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>

            {/* Task Statistics */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Tasks
                </div>
                <div className="font-semibold">
                  {project.stats.completedTasks}/{project.stats.totalTasks}
                </div>
                {project.stats.overdueTasks > 0 && (
                  <div className="text-red-600 text-xs">
                    {project.stats.overdueTasks} overdue
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Revenue
                </div>
                <div className="font-semibold">
                  {formatCurrency(project.stats.paidAmount)}
                </div>
                <div className="text-xs text-muted-foreground">
                  of {formatCurrency(project.stats.totalInvoiceAmount)}
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="flex justify-between text-sm text-muted-foreground">
              <div className="flex items-center">
                <FileText className="h-3 w-3 mr-1" />
                {project.stats.totalInvoices} invoices
              </div>
              {project.stats.openPunchItems > 0 && (
                <div className="flex items-center text-amber-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {project.stats.openPunchItems} punch items
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button asChild variant="default" size="sm" className="flex-1">
                <Link href={`/projects/${project.id}`}>
                  View Project
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <Link href={`/projects/${project.id}/admin`}>
                  Manage
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectManagerDashboard;