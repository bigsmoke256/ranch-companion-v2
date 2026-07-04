import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { FarmProvider } from "@/hooks/useFarm";
import AuthPage from "./pages/AuthPage";
import FarmSetupPage from "./pages/FarmSetupPage";
import Dashboard from "./pages/Dashboard";
import VetDashboard from "./pages/VetDashboard";
import FarmManagerDashboard from "./pages/FarmManagerDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import LivestockList from "./pages/LivestockList";
import AnimalProfile from "./pages/AnimalProfile";
import Traceability from "./pages/Traceability";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import UserAccessPage from "./pages/UserAccessPage";
import VetHealthRecordsPage from "./pages/VetHealthRecordsPage";
import ProfilePage from "./pages/ProfilePage";
import HealthOverviewPage from "./pages/HealthOverviewPage";
import MovementLogPage from "./pages/MovementLogPage";
import MyInterestsPage from "./pages/MyInterestsPage";
import AIAssistantPage from "./pages/AIAssistantPage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RoleDashboard() {
  const { isFarmer, isVet, isFarmManager, isClient } = useAuth();
  
  if (isVet) return <VetDashboard />;
  if (isFarmManager) return <FarmManagerDashboard />;
  if (isClient) return <ClientDashboard />;
  return <Dashboard />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/farm-setup" element={<ProtectedRoute><FarmSetupPage /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />
      <Route path="/livestock" element={<ProtectedRoute><LivestockList /></ProtectedRoute>} />
      <Route path="/livestock/:id" element={<ProtectedRoute><AnimalProfile /></ProtectedRoute>} />
      <Route path="/browse" element={<ProtectedRoute><LivestockList /></ProtectedRoute>} />
      <Route path="/browse/:id" element={<ProtectedRoute><AnimalProfile /></ProtectedRoute>} />
      <Route path="/traceability" element={<ProtectedRoute><Traceability /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      {/* Farmer routes */}
      <Route path="/users" element={<ProtectedRoute><UserAccessPage /></ProtectedRoute>} />
      {/* Vet routes */}
      <Route path="/health-records" element={<ProtectedRoute><VetHealthRecordsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      {/* Farm Manager routes */}
      <Route path="/health-overview" element={<ProtectedRoute><HealthOverviewPage /></ProtectedRoute>} />
      <Route path="/movements" element={<ProtectedRoute><MovementLogPage /></ProtectedRoute>} />
      {/* Client routes */}
      <Route path="/interests" element={<ProtectedRoute><MyInterestsPage /></ProtectedRoute>} />
      {/* AI Routes */}
      <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FarmProvider>
            <AppRoutes />
          </FarmProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
