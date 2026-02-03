import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

export const ProtectedRoute = ({ children, requireSubscription = true }: ProtectedRouteProps) => {
  const { user, loading } = useAuthContext();
  const { isSubscribed, isLoading: subscriptionLoading } = useSubscription();

  if (loading || (user && requireSubscription && subscriptionLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If subscription is required and user doesn't have one, redirect to subscription page
  if (requireSubscription && !isSubscribed) {
    return <Navigate to="/suscripcion" replace />;
  }

  return <>{children}</>;
};
