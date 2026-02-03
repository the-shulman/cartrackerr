import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

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
  const formattedData = data.map((item, index) => {
    let name: string;
    if (dataKey === "status") {
      name = STATUS_LABELS[item.status] || item.status;
    } else {
      // For type data, item.status actually contains the type value
      name = SERVICE_TYPE_LABELS[item.status] || item.status;
    }
    
    return {
      name,
      value: item.count,
      fill: COLORS[index % COLORS.length],
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formattedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {formattedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value, "Servicios"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
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
