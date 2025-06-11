import { useAuthV2 } from "@/hooks/use-auth-v2";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import React from "react"; // Import React for ComponentType

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  // It's more conventional to use React.ComponentType for component props
  component: React.ComponentType;
}) {
  const { user, authState, isLoading } = useAuthV2();

  return (
    <Route path={path}>
      {() => {
        console.log('[ProtectedRoute] Auth check:', {
          path,
          user: user ? `User ID ${user.id}` : 'No user',
          authState,
          isLoading,
          shouldShowLoader: authState === "loading",
          shouldRedirect: authState === "unauthenticated",
          timestamp: new Date().toISOString()
        });

        // Show loading state while checking authentication
        if (authState === "loading") {
          console.log('[ProtectedRoute] Showing loader for path:', path);
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        // Check if user should be redirected to login
        if (authState === "unauthenticated") {
          console.log('[ProtectedRoute] Redirecting to auth from path:', path);
          return <Redirect to="/auth" />;
        }

        // Render the protected component
        console.log('[ProtectedRoute] Rendering component for authenticated user on path:', path);
        return <Component />;
      }}
    </Route>
  );
}