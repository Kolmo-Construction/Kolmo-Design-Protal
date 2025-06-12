import { useAuth } from '@/hooks/use-auth-unified';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  MessageSquare, 
  FileText, 
  User,
  LogOut,
  Bell
} from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface ClientNavigationProps {
  className?: string;
}

export function ClientNavigation({ className }: ClientNavigationProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();

  // Auto-redirect client users to their portal if they're on the main dashboard
  useEffect(() => {
    if (user?.role === 'client' && location === '/') {
      navigate('/client-portal');
    }
  }, [user, location, navigate]);

  if (!user || user.role !== 'client') {
    return null;
  }

  const navItems = [
    {
      href: '/client-portal',
      label: 'My Dashboard',
      icon: Building2,
      description: 'Overview of all your projects'
    },
    {
      href: '/projects',
      label: 'My Projects',
      icon: Building2,
      description: 'View project details and progress'
    },
    {
      href: '/messages',
      label: 'Messages',
      icon: MessageSquare,
      description: 'Communicate with your team'
    },
    {
      href: '/documents',
      label: 'Documents',
      icon: FileText,
      description: 'View contracts and project files'
    }
  ];

  return (
    <div className={cn("bg-white border-b border-gray-200 px-4 py-3", className)}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and User Info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">Kolmo Client Portal</h1>
              <p className="text-sm text-gray-600">Welcome, {user.firstName}</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || 
              (item.href === '/client-portal' && location === '/');
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                asChild
                className={cn(
                  "flex items-center gap-2",
                  isActive && "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
            {/* Notification badge could go here */}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Account</span>
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden mt-3 flex overflow-x-auto gap-2 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || 
            (item.href === '/client-portal' && location === '/');
          
          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "outline"}
              size="sm"
              asChild
              className={cn(
                "flex items-center gap-2 whitespace-nowrap",
                isActive && "bg-blue-600 text-white"
              )}
            >
              <Link href={item.href}>
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </div>
    </div>
  );
}