import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardPlus,
  Search,
  FileCheck,
  ThumbsUp,
  Wrench,
  CheckCircle,
  Truck,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";

const ONBOARDING_KEY = "cartrackerr_onboarding_seen";

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

const steps: Step[] = [
  {
    icon: ClipboardPlus,
    title: "1. Registra un servicio",
    description:
      'Haz clic en "Agregar Servicio" para registrar el vehículo del cliente con sus datos: nombre, teléfono, placa, marca, modelo y tipo de servicio.',
    color: "hsl(var(--status-received))",
  },
  {
    icon: Search,
    title: "2. Diagnóstico",
    description:
      "Cambia el estado a 'Diagnosticando' y agrega un reporte detallado con las piezas, costos y observaciones necesarias.",
    color: "hsl(var(--status-diagnosing))",
  },
  {
    icon: FileCheck,
    title: "3. Cotización y aprobación",
    description:
      "El cliente recibe un enlace por WhatsApp para ver el diagnóstico, seleccionar los trabajos que aprueba y confirmar la reparación.",
    color: "hsl(var(--status-awaiting))",
  },
  {
    icon: ThumbsUp,
    title: "4. Aprobación del cliente",
    description:
      "El cliente revisa los ítems, aprueba o rechaza cada uno desde su portal. Tú ves los cambios en tiempo real.",
    color: "hsl(var(--status-awaiting))",
  },
  {
    icon: Wrench,
    title: "5. Trabajo en progreso",
    description:
      "Una vez aprobado, el servicio pasa a 'En Progreso'. El cliente puede seguir el avance desde su portal de seguimiento.",
    color: "hsl(var(--status-progress))",
  },
  {
    icon: CheckCircle,
    title: "6. Listo para entrega",
    description:
      "Cuando terminas el trabajo, marca el servicio como 'Listo'. El cliente recibe una notificación automática por WhatsApp.",
    color: "hsl(var(--status-ready))",
  },
  {
    icon: Truck,
    title: "7. Entrega",
    description:
      "Entrega el vehículo y marca como 'Entregado'. El historial queda guardado para futuras consultas y recordatorios de mantenimiento.",
    color: "hsl(var(--status-delivered))",
  },
  {
    icon: BarChart3,
    title: "8. Métricas y reportes",
    description:
      "Consulta estadísticas de tu taller: ingresos, servicios completados, tiempos promedio y más desde la sección de métricas.",
    color: "hsl(var(--primary))",
  },
];

export function OnboardingTutorial() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
    setCurrent(0);
  };

  const next = () => {
    if (current < steps.length - 1) setCurrent((c) => c + 1);
    else dismiss();
  };

  const prev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const step = steps[current];
  const Icon = step.icon;
  const progress = ((current + 1) / steps.length) * 100;
  const isLast = current === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        {/* Color bar */}
        <div
          className="h-2 w-full transition-colors duration-300"
          style={{ backgroundColor: step.color }}
        />

        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Paso {current + 1} de {steps.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-auto p-1"
                onClick={dismiss}
              >
                Omitir tutorial
              </Button>
            </div>
            <Progress value={progress} className="h-1.5 mt-2" />
          </DialogHeader>

          {/* Step content */}
          <div className="flex flex-col items-center text-center py-4 animate-fade-in" key={current}>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-colors duration-300"
              style={{ backgroundColor: step.color + "1a" }}
            >
              <Icon className="w-8 h-8" style={{ color: step.color }} />
            </div>
            <DialogTitle className="text-lg mb-2">{step.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed max-w-sm">
              {step.description}
            </DialogDescription>
          </div>

          <DialogFooter className="flex-row justify-between gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={prev}
              disabled={current === 0}
              className="gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>
            <Button size="sm" onClick={next} className="gap-1">
              {isLast ? "¡Comenzar!" : "Siguiente"}
              {!isLast && <ArrowRight className="w-4 h-4" />}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
