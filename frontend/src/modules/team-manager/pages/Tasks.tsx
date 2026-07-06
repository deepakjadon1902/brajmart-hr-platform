import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
const cols = [
  {
    title: "To Do",
    items: [
      { t: "Refactor onboarding flow", a: "Aarav" },
      { t: "Write API docs", a: "Priya" },
    ],
  },
  {
    title: "In Progress",
    items: [
      { t: "Quarterly review prep", a: "Vikram" },
      { t: "Hire 2 engineers", a: "You" },
    ],
  },
  {
    title: "Done",
    items: [
      { t: "Sprint demo", a: "Team" },
      { t: "OKR draft", a: "You" },
    ],
  },
];
export default function P() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" subtitle="Plan and track your team's work." />
      <div className="grid gap-4 md:grid-cols-3">
        {cols.map((c) => (
          <Card key={c.title} className="p-4 shadow-soft">
            <h3 className="mb-3 font-semibold">{c.title}</h3>
            <ul className="space-y-2">
              {c.items.map((i) => (
                <li key={i.t} className="rounded-xl border bg-background/50 p-3">
                  <p className="text-sm font-medium">{i.t}</p>
                  <p className="text-xs text-muted-foreground">@{i.a}</p>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
