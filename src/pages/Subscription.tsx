import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Shield, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export default function Subscription() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSubscribed, isLoading, subscriptionEnd, openCheckout, openCustomerPortal, checkSubscription } = useSubscription();

  // Handle subscription success/cancel from URL params
  useEffect(() => {
    const subscriptionStatus = searchParams.get("subscription");
    if (subscriptionStatus === "success") {
      toast.success("¡Suscripción activada exitosamente!");
      checkSubscription();
      navigate("/suscripcion", { replace: true });
    } else if (subscriptionStatus === "cancelled") {
      toast.info("Proceso de suscripción cancelado");
      navigate("/suscripcion", { replace: true });
    }
  }, [searchParams, navigate, checkSubscription]);

  const handleSubscribe = async () => {
    try {
      await openCheckout();
    } catch {
      toast.error("Error al iniciar el proceso de suscripción");
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch {
      toast.error("Error al abrir el portal de gestión");
    }
  };

  const features = [
    "Gestión ilimitada de servicios",
    "Notificaciones WhatsApp automáticas",
    "Portal de clientes personalizado",
    "Reportes de diagnóstico con fotos",
    "Métricas y estadísticas del taller",
    "Recordatorios de mantenimiento",
    "Cotizaciones PDF profesionales",
    "Soporte técnico prioritario",
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            CarTrackerr Pro
          </h1>
          <p className="text-muted-foreground">
            Tu sistema completo de gestión de taller automotriz
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Plan Card */}
          <Card className={`relative ${isSubscribed ? "border-primary border-2" : ""}`}>
            {isSubscribed && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                Tu Plan Actual
              </Badge>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Membresía Mensual</CardTitle>
              <CardDescription>Acceso completo a todas las funciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold text-primary">$2,600</span>
                <span className="text-muted-foreground"> MXN/mes</span>
              </div>

              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isSubscribed ? (
                <div className="space-y-3">
                  <div className="text-center text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Suscripción activa hasta:{" "}
                    {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }) : "N/A"}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleManageSubscription}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Gestionar Suscripción
                  </Button>
                  <Button 
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Ir al Dashboard
                  </Button>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleSubscribe}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Suscribirse Ahora
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Benefits Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">¿Por qué CarTrackerr Pro?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Ahorra tiempo</h4>
                    <p className="text-sm text-muted-foreground">
                      Automatiza notificaciones y seguimiento de servicios
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Mejora la comunicación</h4>
                    <p className="text-sm text-muted-foreground">
                      Mantén a tus clientes informados en tiempo real
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Incrementa ingresos</h4>
                    <p className="text-sm text-muted-foreground">
                      Recordatorios de mantenimiento generan más visitas
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Imagen profesional</h4>
                    <p className="text-sm text-muted-foreground">
                      Cotizaciones y reportes con tu marca
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
