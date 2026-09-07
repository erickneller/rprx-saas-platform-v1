import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { LibraryAdminRoute } from "@/components/auth/LibraryAdminRoute";
import LibraryAdmin from "./pages/LibraryAdmin";
import { NavigationBlockerProvider } from "@/contexts/NavigationBlockerContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import StrategyAssistant from "./pages/StrategyAssistant";
import Plans from "./pages/Plans";
import PlanDetail from "./pages/PlanDetail";
import DebtEliminator from "./pages/DebtEliminator";
import Assessments from "./pages/Assessments";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import AdminInsights from "./pages/admin/Insights";
import CompletePhone from "./pages/CompletePhone";
import Wizard from "./pages/Wizard";
import CompanyDashboard from "./pages/CompanyDashboard";
import NotFound from "./pages/NotFound";
import Join from "./pages/Join";
import Partners from "./pages/Partners";
import Library from "./pages/Library";
import CoursePage from "./pages/CoursePage";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import HealthAssessment from "./pages/HealthAssessment";
import VirtualAdvisor from "./pages/VirtualAdvisor";
import RprxW2 from "./pages/RprxW2";
import Help from "./pages/Help";
import LandingPage from "@/components/landing/LandingPage";
import EquityRecapturePage from "./pages/EquityRecapture";
import Unsubscribe from "./pages/Unsubscribe";
import OAuthConsent from "./pages/OAuthConsent";
import { WizardGuard } from "@/components/auth/WizardGuard";
import { UpgradeRouteGuard } from "@/components/auth/UpgradeRouteGuard";
import { UpgradeGateProvider } from "@/contexts/UpgradeGateContext";
import { AuthProvider } from "@/hooks/useAuth";
import { useAffiliateCapture } from "@/hooks/useAffiliateCapture";

const queryClient = new QueryClient();

const AffiliateCaptureBridge = () => {
  useAffiliateCapture();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="rprx-theme">
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <NavigationBlockerProvider>
        <UpgradeGateProvider>
        <AffiliateCaptureBridge />

        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/old-home" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unsubscribe" element={<Unsubscribe />} />
          <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
          <Route path="/wizard" element={<ProtectedRoute><WizardGuard><Wizard /></WizardGuard></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><WizardGuard><Dashboard /></WizardGuard></ProtectedRoute>} />
          <Route path="/assessment" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
          <Route path="/assessment/edit/:id" element={<ProtectedRoute><Assessment /></ProtectedRoute>} />
          <Route path="/results/:id" element={<ProtectedRoute><WizardGuard><Results /></WizardGuard></ProtectedRoute>} />
          <Route element={<UpgradeRouteGuard feature="strategy-assistant" />}>
            <Route path="/strategy-assistant" element={<ProtectedRoute><WizardGuard><StrategyAssistant /></WizardGuard></ProtectedRoute>} />
          </Route>
          <Route element={<UpgradeRouteGuard feature="plans" />}>
            <Route path="/plans" element={<ProtectedRoute><WizardGuard><Plans /></WizardGuard></ProtectedRoute>} />
            <Route path="/plans/:id" element={<ProtectedRoute><WizardGuard><PlanDetail /></WizardGuard></ProtectedRoute>} />
          </Route>
          <Route path="/assessments" element={<ProtectedRoute><WizardGuard><Assessments /></WizardGuard></ProtectedRoute>} />
          <Route element={<UpgradeRouteGuard feature="debt-eliminator" />}>
            <Route path="/debt-eliminator" element={<ProtectedRoute><WizardGuard><DebtEliminator /></WizardGuard></ProtectedRoute>} />
          </Route>
          <Route path="/complete-phone" element={<ProtectedRoute><CompletePhone /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route element={<UpgradeRouteGuard feature="partners-directory" />}>
            <Route path="/partners" element={<ProtectedRoute><WizardGuard><Partners /></WizardGuard></ProtectedRoute>} />
          </Route>
          <Route element={<UpgradeRouteGuard feature="library" />}>
            <Route path="/library" element={<ProtectedRoute><WizardGuard><Library /></WizardGuard></ProtectedRoute>} />
          </Route>
          <Route path="/company-dashboard" element={<ProtectedRoute><WizardGuard><CompanyDashboard /></WizardGuard></ProtectedRoute>} />
          <Route path="/course/:navConfigId" element={<ProtectedRoute><WizardGuard><CoursePage /></WizardGuard></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          <Route path="/admin/insights" element={<AdminRoute><AdminInsights /></AdminRoute>} />
          <Route path="/library-admin" element={<LibraryAdminRoute><LibraryAdmin /></LibraryAdminRoute>} />
          {/* /join — no ProtectedRoute; handles auth inline */}
          <Route path="/join" element={<Join />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/health-assessment" element={<HealthAssessment />} />
          <Route element={<UpgradeRouteGuard feature="virtual-advisor" />}>
            <Route path="/virtual-advisor" element={<ProtectedRoute><WizardGuard><VirtualAdvisor /></WizardGuard></ProtectedRoute>} />
          </Route>
          <Route element={<UpgradeRouteGuard feature="equity-recapture-calculator" />}>
            <Route path="/calculators/equity-recapture" element={<ProtectedRoute><WizardGuard><EquityRecapturePage /></WizardGuard></ProtectedRoute>} />
          </Route>
          <Route path="/rprx-w2" element={<RprxW2 />} />
          <Route path="/help" element={<ProtectedRoute><WizardGuard><Help /></WizardGuard></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </UpgradeGateProvider>
        </NavigationBlockerProvider>
        </AuthProvider>
      </BrowserRouter>

    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
