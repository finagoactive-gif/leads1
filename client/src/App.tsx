import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import SubmitLead from "@/pages/submit-lead";
import MyLeads from "@/pages/my-leads";
import BrowseLeads from "@/pages/browse-leads";
import PendingLeads from "@/pages/pending-leads";
import ManageUsers from "@/pages/manage-users";
import CreditManagement from "@/pages/credit-management";

function AuthenticatedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route>
          <Redirect to="/login" />
        </Route>
      </Switch>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/submit-lead" component={SubmitLead} />
          <Route path="/my-leads" component={MyLeads} />
          <Route path="/browse-leads" component={BrowseLeads} />
          <Route path="/pending-leads">
            <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
              <PendingLeads />
            </ProtectedRoute>
          </Route>
          <Route path="/manage-users">
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <ManageUsers />
            </ProtectedRoute>
          </Route>
          <Route path="/credit-management">
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <CreditManagement />
            </ProtectedRoute>
          </Route>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AuthenticatedApp />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
