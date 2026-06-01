import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const data = Array.from({ length: 12 }).map((_, i) => ({
  m: new Date(2025, i, 1).toLocaleString("en", { month: "short" }),
  headcount: 180 + i * 6,
  attrition: 4 + ((i * 2) % 5),
}));

export default function Analytics() {
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Trends across headcount, attrition and engagement." />
      <Card className="p-6 shadow-soft">
        <h3 className="font-semibold">Headcount vs Attrition</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="m" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Line type="monotone" dataKey="headcount" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="attrition" stroke="var(--color-destructive)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
