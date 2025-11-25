import { useEffect } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/hooks/use-auth-unified";
import { Shield, Users, CheckCircle, FileText } from "lucide-react";
import kolmoLogo from "@assets/Kolmo (1)_1764104061720.png";
import { theme } from "@/config/theme";


export default function AuthPageV2() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  // Don't render anything while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background }}>
        <div className="animate-pulse flex items-center gap-4">
          <img src={kolmoLogo} alt="Kolmo" className="h-16 w-16" />
          <div>
            <h2 className="text-xl font-bold" style={{ color: theme.colors.primary }}>Kolmo</h2>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.colors.background }}>
      <div className="flex min-h-screen w-full">
        {/* Left Column - Branding & Features */}
        <div className="hidden lg:flex lg:w-1/2 p-12 text-white relative overflow-hidden" style={{ backgroundImage: theme.gradients.darkGradient }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 flex flex-col justify-between w-full">
            {/* Logo & Header */}
            <div>
              <div className="flex items-center gap-4 mb-12">
                <img src={kolmoLogo} alt="Kolmo" className="h-20 w-20" />
                <div>
                  <h2 className="text-3xl font-bold text-white" style={{ color: theme.colors.accent }}>Kolmo</h2>
                  <p className="text-sm opacity-90">Construction Management</p>
                </div>
              </div>
              <h1 className="text-5xl font-bold mb-6 text-white">
                Welcome to Kolmo
              </h1>
              <p className="text-xl opacity-90 mb-12">
                Your comprehensive construction project management platform
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.getColorWithOpacity(theme.colors.accent, 0.2) }}>
                  <FileText className="w-6 h-6" style={{ color: theme.colors.accent }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Project Management</h3>
                  <p className="text-sm opacity-80">Track progress, manage tasks, and stay organized</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.getColorWithOpacity(theme.colors.accent, 0.2) }}>
                  <Users className="w-6 h-6" style={{ color: theme.colors.accent }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Team Collaboration</h3>
                  <p className="text-sm opacity-80">Real-time communication and file sharing</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.getColorWithOpacity(theme.colors.accent, 0.2) }}>
                  <CheckCircle className="w-6 h-6" style={{ color: theme.colors.accent }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Financial Tracking</h3>
                  <p className="text-sm opacity-80">Professional quotes, invoices, and billing management</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: theme.getColorWithOpacity(theme.colors.accent, 0.2) }}>
                  <Shield className="w-6 h-6" style={{ color: theme.colors.accent }} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Secure & Reliable</h3>
                  <p className="text-sm opacity-80">Enterprise-grade security and data protection</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-sm opacity-70">
              © 2025 Kolmo Construction. All rights reserved.
            </div>
          </div>
        </div>

        {/* Right Column - Authentication Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12" style={{ backgroundColor: theme.colors.surfaceLight }}>
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img src={kolmoLogo} alt="Kolmo" className="h-16 w-16" />
              </div>
              <h2 className="text-2xl font-bold" style={{ color: theme.colors.primary }}>Kolmo</h2>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>Construction Management</p>
            </div>

            <LoginForm 
              onSuccess={() => navigate("/")}
              redirectTo="/"
            />

            {/* Additional Links */}
            <div className="mt-8 text-center space-y-4">
              <div className="text-sm" style={{ color: theme.colors.textMuted }}>
                Need help? Contact your system administrator
              </div>
              
              <div className="text-xs" style={{ color: theme.colors.textLight }}>
                By signing in, you agree to our Terms of Service and Privacy Policy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}