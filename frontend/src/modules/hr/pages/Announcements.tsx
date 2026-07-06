import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

const items = [
  {
    id: "a1",
    title: "Quarterly All-Hands",
    body: "Join us this Friday at 4 PM for the company-wide all-hands.",
    date: "2 days ago",
  },
  {
    id: "a2",
    title: "New WFH Policy",
    body: "Read the updated work-from-home policy in the policies section.",
    date: "1 week ago",
  },
  {
    id: "a3",
    title: "Diwali Holidays",
    body: "Office will remain closed from Oct 29 to Nov 1.",
    date: "3 weeks ago",
  },
];

export default function Announcements() {
  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Broadcasts visible to all employees." />
      <div className="space-y-4">
        {items.map((a) => (
          <Card key={a.id} className="flex items-start gap-4 p-5 shadow-soft">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{a.title}</h3>
                <span className="text-xs text-muted-foreground">{a.date}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
