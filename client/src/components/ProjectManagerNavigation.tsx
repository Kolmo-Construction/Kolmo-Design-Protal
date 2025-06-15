import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  FolderOpen, 
  Users, 
  Calendar, 
  Settings, 
  LogOut,
  Building2
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-unified';
import { apiRequest } from '@/lib/queryClient';

export function ProjectManagerNavigation() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest('/api/logout', 'POST');
      logout();
    } catch (error) {
      console.error('Logout failed:', error);
      logout(); // Force logout even if API call fails
    }
  };

  const navigationItems = [
    {
      href: '/project-manager',
      icon: Home,
      label: 'Dashboard',
      active: location === '/project-manager'
    },
    {
      href: '/project-manager/projects',
      icon: FolderOpen,
      label: 'My Projects',
      active: location.startsWith('/project-manager/projects')
    },
    {
      href: '/project-manager/clients',
      icon: Users,
      label: 'Clients',
      active: location.startsWith('/project-manager/clients')
    },
    {
      href: '/project-manager/schedule',
      icon: Calendar,
      label: 'Schedule',
      active: location.startsWith('/project-manager/schedule')
    },
    {
      href: '/project-manager/settings',
      icon: Settings,
      label: 'Settings',
      active: location.startsWith('/project-manager/settings')
    }
  ];

  return (
    <div className="flex h-screen bg-white border-r border-gray-200">
      <div className="flex flex-col w-64">
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <Building2 className="h-8 w-8 text-blue-600" />
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-gray-900">Kolmo</h2>
            <p className="text-sm text-gray-600">Project Manager</p>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    item.active 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}