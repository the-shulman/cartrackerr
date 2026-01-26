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

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--info))",
  "hsl(var(--secondary))",
];

export function ServicesPieChart({ data, title, dataKey = "status" }: ServicesPieChartProps) {
  const formattedData = data.map((item, index) => ({
    name: dataKey === "status" ? (STATUS_LABELS[item.status] || item.status) : (item as any).type,
    value: item.count,
    fill: COLORS[index % COLORS.length],
  }));

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
