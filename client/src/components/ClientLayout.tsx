import { useAuth } from '@/hooks/use-auth-unified';
import { ClientNavigation } from './ClientNavigation';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { user } = useAuth();

  // Only render client layout for client users
  if (!user || user.role !== 'client') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNavigation />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}