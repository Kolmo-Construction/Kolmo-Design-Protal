import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element | null;
}) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  return (
    <Route path={path}>
      {() => {
        // Show loading spinner while authentication is being checked
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        // Redirect to auth if not authenticated, but avoid infinite loops
        if (!user && location !== "/auth") {
          return <Redirect to="/auth" replace />;
        }

        // If we have a user, render the component
        if (user) {
          return <Component />;
        }

        // Fallback to loading state
        return (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        );
      }}
    </Route>
  );
}
