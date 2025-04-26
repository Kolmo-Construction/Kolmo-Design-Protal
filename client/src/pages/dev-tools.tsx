import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw, ArrowLeft } from "lucide-react";

// Only show this page in development mode
const isDev = import.meta.env.DEV;

type ResetToken = {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  tokenExpiry: string;
  resetLink: string;
};

export default function DevTools() {
  const [resetTokens, setResetTokens] = useState<ResetToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async () => {
    if (!isDev) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/dev/reset-tokens');
      if (!response.ok) throw new Error('Failed to fetch reset tokens');
      
      const data = await response.json();
      setResetTokens(data);
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  if (!isDev) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Development Tools</CardTitle>
            <CardDescription className="text-center">
              This page is only available in development mode.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Development Tools</h1>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Dev Mode
          </Badge>
        </div>
        <Button variant="outline" onClick={fetchTokens} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Password Reset Tokens</CardTitle>
            <CardDescription>
              Active password reset tokens for testing. Click on a link to reset the user's password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
                Error: {error}
              </div>
            )}

            {loading ? (
              <div className="py-8 text-center">
                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary opacity-70" />
                <p className="mt-2 text-muted-foreground">Loading tokens...</p>
              </div>
            ) : resetTokens.length === 0 ? (
              <div className="py-8 text-center border rounded-md bg-slate-50">
                <p className="text-muted-foreground">No active reset tokens found.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Request a password reset to generate a token.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {resetTokens.map((token) => (
                  <div key={token.userId} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">
                          {token.firstName} {token.lastName} ({token.username})
                        </h3>
                        <p className="text-sm text-muted-foreground">{token.email}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm">
                      <p className="text-muted-foreground">
                        Expires: {new Date(token.tokenExpiry).toLocaleString()}
                      </p>
                      <div className="mt-3">
                        <Button 
                          asChild
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                        >
                          <Link href={token.resetLink}>
                            <ExternalLink className="h-3 w-3 mr-2" />
                            Open Reset Page
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="ghost"
              size="sm" 
              asChild
            >
              <Link href="/auth">Go to Login Page</Link>
            </Button>
            <Button 
              variant="default"
              size="sm" 
              onClick={fetchTokens} 
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Tokens
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}