import { Project, Message, ProgressUpdate, Selection } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, AlertCircle, MessageSquare, Image } from "lucide-react";

interface DashboardStatsProps {
  projects: Project[];
  messages: Message[];
  updates: ProgressUpdate[];
  selections: Selection[];
  isLoading?: boolean;
}

export default function DashboardStats({ 
  projects, 
  messages, 
  updates, 
  selections,
  isLoading = false 
}: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-pulse">
        {[1, 2, 3, 4].map((item) => (
          <Card key={item}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-slate-200"></div>
                <div className="ml-4 w-full">
                  <div className="h-4 w-1/2 bg-slate-200 rounded mb-2"></div>
                  <div className="h-6 w-1/4 bg-slate-200 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Count active projects
  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  
  // Count pending selections/approvals
  const pendingApprovals = selections.filter(s => s.status === "pending").length;
  
  // Count unread messages
  const unreadMessages = messages.filter(m => !m.isRead).length;
  
  // Count recent updates (in the last 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const recentUpdates = updates.filter(update => {
    const updateDate = new Date(update.createdAt);
    return updateDate >= lastWeek;
  }).length;

  const stats = [
    {
      title: "Active Projects",
      value: activeProjects,
      icon: <Building2 className="h-6 w-6" />,
      color: "bg-primary-100 text-primary-600"
    },
    {
      title: "Pending Approvals",
      value: pendingApprovals,
      icon: <AlertCircle className="h-6 w-6" />,
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      title: "Unread Messages",
      value: unreadMessages,
      icon: <MessageSquare className="h-6 w-6" />,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Recent Updates",
      value: recentUpdates,
      icon: <Image className="h-6 w-6" />,
      color: "bg-green-100 text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
