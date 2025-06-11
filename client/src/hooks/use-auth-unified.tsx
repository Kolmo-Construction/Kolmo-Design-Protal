import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: userQueryLoading,
    refetch: refetchUser,
    error
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user", {
          credentials: "include",
        });
        
        if (response.status === 401) {
          return null; // User not authenticated
        }
        
        if (!response.ok) {
          throw new Error(`Authentication check failed: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("[AuthProvider] User query error:", error);
        throw error;
      }
    },
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    refetchInterval: false,
    networkMode: 'online',
  });

  // Update loading state based on query state
  useEffect(() => {
    setIsLoading(userQueryLoading);
  }, [userQueryLoading]);

  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/login", {
        username,
        password,
      });

      // Invalidate and refetch user data after successful login
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      await refetchUser();
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest("POST", "/api/logout");

      // Clear all queries and reset auth state
      queryClient.clear();
      await refetchUser();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const contextValue: AuthContextType = {
    user: user || null,
    isLoading,
    login,
    logout,
    refetchUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}