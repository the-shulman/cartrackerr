import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  ClipboardPlus,
  Search,
  FileCheck,
  ThumbsUp,
  CheckCircle,
  Truck,
  BarChart3,
  MessageCircle,
  Smartphone,
  Shield,
  ArrowRight,
  Zap,
  Clock,
} from "lucide-react";

const steps = [
  {
    icon: ClipboardPlus,
    title: "Registra el servicio",
    desc: "Captura los datos del vehículo y cliente en segundos.",
    color: "hsl(var(--status-received))",
  },
  {
    icon: Search,
    title: "Diagnóstico detallado",
    desc: "Genera un reporte con piezas, costos y observaciones.",
    color: "hsl(var(--status-diagnosing))",
  },
  {
    icon: FileCheck,
    title: "Cotización automática",
    desc: "El cliente recibe la cotización por WhatsApp al instante.",
    color: "hsl(var(--status-awaiting))",
  },
  {
    icon: ThumbsUp,
    title: "Aprobación digital",
    desc: "El cliente aprueba o rechaza cada ítem desde su celular.",
    color: "hsl(var(--status-awaiting))",
  },
  {
    icon: Wrench,
    title: "Seguimiento en vivo",
    desc: "El cliente ve el avance de su vehículo en tiempo real.",
    color: "hsl(var(--status-progress))",
  },
  {
    icon: CheckCircle,
    title: "Notificación de entrega",
    desc: "Aviso automático cuando el vehículo está listo.",
    color: "hsl(var(--status-ready))",
  },
  {
    icon: Truck,
    title: "Historial completo",
    desc: "Registro de cada servicio para consultas futuras.",
    color: "hsl(var(--status-delivered))",
  },
  {
    icon: BarChart3,
    title: "Métricas del taller",
    desc: "Ingresos, tiempos y estadísticas en un solo lugar.",
    color: "hsl(var(--primary))",
  },
];

const benefits = [
  {
    icon: MessageCircle,
    title: "Notificaciones por WhatsApp",
    desc: "Tus clientes reciben actualizaciones automáticas sin que tengas que llamar.",
  },
  {
    icon: Smartphone,
    title: "Portal del cliente",
    desc: "Cada cliente tiene acceso a su portal para ver el estado de su vehículo.",
  },
  {
    icon: Shield,
    title: "Aprobaciones digitales",
    desc: "Sin malentendidos. El cliente aprueba cada trabajo antes de que empieces.",
  },
  {
    icon: Clock,
    title: "Ahorra tiempo",
    desc: "Automatiza cotizaciones, seguimiento y recordatorios de mantenimiento.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">CarTrackerr</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Iniciar Sesión
            </Button>
            <Button size="sm" onClick={() => navigate("/registro")}>
              Prueba Gratis
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-hero text-primary-foreground py-20 md:py-32 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 text-sm">
            <Zap className="w-4 h-4" />
            <span>La plataforma #1 para talleres mecánicos</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Gestiona tu taller.
            <br />
            <span className="opacity-80">Impresiona a tus clientes.</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
            Controla servicios, envía cotizaciones por WhatsApp y deja que tus clientes sigan el estado de su vehículo en tiempo real. Todo desde una sola app.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-base px-8 gap-2"
              onClick={() => navigate("/registro")}
            >
              Comenzar Gratis <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8"
              onClick={() => {
                document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Ver cómo funciona
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            ¿Por qué CarTrackerr?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Deja de perseguir clientes por teléfono. Automatiza tu taller y ofrece una experiencia profesional.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <Card key={b.title} className="border bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            8 pasos simples. Desde que llega el vehículo hasta que lo entregas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="flex items-start gap-4 bg-background rounded-xl p-5 border shadow-sm"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: step.color + "1a" }}
                >
                  <step.icon className="w-5 h-5" style={{ color: step.color }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 gradient-hero text-primary-foreground">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Lleva tu taller al siguiente nivel
          </h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Regístrate hoy y comienza a gestionar tus servicios de forma profesional.
          </p>
          <Button
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-base px-10 gap-2"
            onClick={() => navigate("/registro")}
          >
            Crear mi cuenta gratis <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            <span>CarTrackerr © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-4">
            <button className="hover:text-foreground transition-colors" onClick={() => navigate("/login")}>
              Iniciar Sesión
            </button>
            <button className="hover:text-foreground transition-colors" onClick={() => navigate("/registro")}>
              Registrarse
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
