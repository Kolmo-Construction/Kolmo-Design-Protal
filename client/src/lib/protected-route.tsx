import { useAuth } from "@/hooks/use-auth-unified";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import React from "react"; // Import React for ComponentType

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
}: {
  path: string;
  component: React.ComponentType;
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();

  return (
    <Route path={path}>
      {() => {
        // Show loading state while checking authentication
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        // Check if user should be redirected to login
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Check admin access for admin-only routes
        if (adminOnly && user.role !== 'admin') {
          return <Redirect to="/client-portal" />;
        }

        // Auto-redirect clients to their portal from main dashboard
        if (path === "/" && user.role === 'client') {
          return <Redirect to="/client-portal" />;
        }

        // Render the protected component
        return <Component />;
      }}
    </Route>
  );
}