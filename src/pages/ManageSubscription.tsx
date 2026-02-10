import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield, CreditCard, Calendar, Clock, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export default function ManageSubscription() {
  const navigate = useNavigate();
  const { isSubscribed, isLoading, subscriptionEnd, isTrial, trialEnd, openCustomerPortal } = useSubscription();

  const handleCancel = async () => {
    try {
      await openCustomerPortal();
    } catch {
      toast.error("No se pudo abrir el portal de gestión. Es posible que no tengas una suscripción activa en Stripe.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  };

  const daysRemaining = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Math.max(0, Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  };

  const trialDays = daysRemaining(trialEnd);
  const subDays = daysRemaining(subscriptionEnd);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Button>

        {/* Status Card */}
        <Card className="border-primary/50">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Mi Suscripción</CardTitle>
            <CardDescription>Estado actual de tu plan CarTrackerr Pro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estado</span>
              {isSubscribed ? (
                isTrial ? (
                  <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30">
                    <Clock className="w-3 h-3 mr-1" />
                    Periodo de Prueba
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
                    Activa
                  </Badge>
                )
              ) : (
                <Badge variant="secondary">Inactiva</Badge>
              )}
            </div>

            <Separator />

            {/* Trial info */}
            {isTrial && trialEnd && (
              <>
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    <Clock className="w-4 h-4" />
                    Prueba gratuita
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tu prueba gratis termina el <strong>{formatDate(trialEnd)}</strong>
                    {trialDays !== null && (
                      <span> ({trialDays} {trialDays === 1 ? "día" : "días"} restantes)</span>
                    )}
                    . Después se cobrará automáticamente a menos que canceles.
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Subscription details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  Plan
                </div>
                <span className="text-sm font-medium">CarTrackerr Pro</span>
              </div>

              {subscriptionEnd && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {isTrial ? "Primer cobro" : "Próxima renovación"}
                  </div>
                  <span className="text-sm font-medium">{formatDate(subscriptionEnd)}</span>
                </div>
              )}

              {!isTrial && subDays !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Días restantes
                  </div>
                  <span className="text-sm font-medium">{subDays} días</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Go to dashboard */}
            <Button className="w-full" onClick={() => navigate("/")}>
              Ir al Dashboard
            </Button>

            {/* Cancel - small and at the bottom */}
            <div className="pt-4">
              <button
                onClick={handleCancel}
                className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
              >
                Cancelar suscripción
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
