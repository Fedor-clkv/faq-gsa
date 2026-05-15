import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface AnchorPreviewProps {
  fields: Record<string, unknown>;
}

const ANCHOR_KEYS = [
  { key: "anchor_ratio_exact", label: "Точные", color: "#3b82f6" },
  { key: "anchor_ratio_partial", label: "Частичные", color: "#8b5cf6" },
  { key: "anchor_ratio_branded", label: "Брендовые", color: "#10b981" },
  { key: "anchor_ratio_naked", label: "Голый URL", color: "#f59e0b" },
  { key: "anchor_ratio_generic", label: "Дженерики", color: "#6b7280" },
];

export default function AnchorPreview({ fields }: AnchorPreviewProps) {
  const data = ANCHOR_KEYS.map((k) => ({
    name: k.label,
    value: Number(fields[k.key] ?? 20),
    color: k.color,
  })).filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  return (
    <div className="mt-6 p-4 rounded-lg border border-border bg-card/50">
      <h4 className="text-sm font-medium mb-3">Распределение анкоров</h4>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={100} height={100}>
          <PieChart>
            <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={45}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val) => [`${((Number(val) / total) * 100).toFixed(1)}%`, ""]}
              contentStyle={{
                background: "hsl(222 47% 9%)",
                border: "1px solid hsl(217 33% 17%)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-1.5">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-muted-foreground">{d.name}</span>
              <span className="ml-auto font-medium">{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
