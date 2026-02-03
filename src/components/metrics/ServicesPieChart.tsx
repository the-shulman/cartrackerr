import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface ServicesPieChartProps {
  data: { status: string; count: number }[];
  title: string;
  dataKey?: "status" | "type";
}

const STATUS_LABELS: Record<string, string> = {
  received: "Recibido",
  diagnosing: "Diagnosticando",
  awaiting_approval: "Esperando Aprobación",
  in_progress: "En Progreso",
  ready: "Listo",
  delivered: "Entregado",
};

const STATUS_LABELS_SHORT: Record<string, string> = {
  received: "Recibido",
  diagnosing: "Diagnóstico",
  awaiting_approval: "Esperando",
  in_progress: "En Progreso",
  ready: "Listo",
  delivered: "Entregado",
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  oil_change: "Cambio de Aceite",
  brake_service: "Servicio de Frenos",
  tire_rotation: "Rotación de Llantas",
  general_maintenance: "Mantenimiento General",
  engine_repair: "Reparación de Motor",
  transmission: "Transmisión",
  electrical: "Eléctrico",
  suspension: "Suspensión",
  air_conditioning: "Aire Acondicionado",
  diagnostics: "Diagnóstico",
  other: "Otro",
};

const SERVICE_TYPE_LABELS_SHORT: Record<string, string> = {
  oil_change: "Aceite",
  brake_service: "Frenos",
  tire_rotation: "Llantas",
  general_maintenance: "Manto. Gral",
  engine_repair: "Motor",
  transmission: "Transmisión",
  electrical: "Eléctrico",
  suspension: "Suspensión",
  air_conditioning: "A/C",
  diagnostics: "Diagnóstico",
  other: "Otro",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--status-progress))",
  "hsl(var(--status-ready))",
  "hsl(var(--status-awaiting))",
  "hsl(var(--status-diagnosing))",
  "hsl(var(--status-received))",
  "hsl(var(--status-delivered))",
];

export function ServicesPieChart({ data, title, dataKey = "status" }: ServicesPieChartProps) {
  const isMobile = useIsMobile();
  
  const formattedData = data.map((item, index) => {
    let name: string;
    let shortName: string;
    
    if (dataKey === "status") {
      name = STATUS_LABELS[item.status] || item.status;
      shortName = STATUS_LABELS_SHORT[item.status] || item.status;
    } else {
      name = SERVICE_TYPE_LABELS[item.status] || item.status;
      shortName = SERVICE_TYPE_LABELS_SHORT[item.status] || item.status;
    }
    
    return {
      name: isMobile ? shortName : name,
      fullName: name,
      value: item.count,
      fill: COLORS[index % COLORS.length],
    };
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-2 md:p-6">
        <div className="h-[280px] md:h-[300px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formattedData}
                  cx="50%"
                  cy="45%"
                  innerRadius={isMobile ? 40 : 60}
                  outerRadius={isMobile ? 70 : 100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {formattedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name, props) => [
                    `${value} servicios`,
                    props.payload.fullName
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: isMobile ? "12px" : "14px",
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={isMobile ? 60 : 36}
                  wrapperStyle={{
                    fontSize: isMobile ? "10px" : "12px",
                    paddingTop: "8px",
                  }}
                  formatter={(value) => (
                    <span className="text-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No hay datos disponibles
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
