import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import OnboardingPage from "@/pages/onboarding";
import DashboardPage from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-emerald-400 via-sky-500 to-purple-500 animate-pulse" />
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && user && !user.onboardingCompleted) {
      navigate("/onboarding");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) return null;
  if (user && !user.onboardingCompleted) return null;
  return <>{children}</>;
}

function Router() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect authenticated users away from auth page
  useEffect(() => {
    if (!isLoading && user && window.location.pathname === "/login") {
      navigate(user.onboardingCompleted ? "/dashboard" : "/onboarding");
    }
  }, [user, isLoading, navigate]);

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={AuthPage} />
      <Route path="/onboarding">
        <AuthGuard>
          <OnboardingPage />
        </AuthGuard>
      </Route>
      <Route path="/dashboard">
        <AuthGuard>
          <OnboardingGuard>
            <DashboardPage />
          </OnboardingGuard>
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
