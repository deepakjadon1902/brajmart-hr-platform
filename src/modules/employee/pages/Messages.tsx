import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

const threads = [
  { id: "t1", name: "Priya Verma (HR)", last: "Your leave has been approved.", unread: 1 },
  { id: "t2", name: "Vikram Singh", last: "Sync at 4pm?", unread: 0 },
  { id: "t3", name: "Engineering Channel", last: "Sprint demo on Friday.", unread: 3 },
];

export default function Messages() {
  const [active, setActive] = useState(threads[0]);
  const [msg, setMsg] = useState("");
  return (
    <div className="space-y-6">
      <PageHeader title="Messages" subtitle="Internal chat with your team and HR." />
      <Card className="grid h-[60vh] grid-cols-1 overflow-hidden p-0 shadow-soft md:grid-cols-[280px_1fr]">
        <aside className="border-r">
          {threads.map((t) => (
            <button key={t.id} onClick={() => setActive(t)}
              className={`flex w-full items-start gap-3 border-b p-4 text-left hover:bg-muted/40 ${active.id === t.id ? "bg-muted/40" : ""}`}>
              <div className="h-9 w-9 rounded-full bg-primary/15 text-primary grid place-items-center text-xs font-semibold">{t.name.slice(0,1)}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="truncate text-xs text-muted-foreground">{t.last}</p>
              </div>
              {t.unread > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{t.unread}</span>}
            </button>
          ))}
        </aside>
        <section className="flex flex-col">
          <header className="border-b p-4 font-medium">{active.name}</header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            <div className="max-w-sm rounded-2xl bg-muted px-3 py-2">{active.last}</div>
            <div className="ml-auto max-w-sm rounded-2xl bg-primary px-3 py-2 text-primary-foreground">Thanks!</div>
          </div>
          <form className="flex gap-2 border-t p-3" onSubmit={(e) => { e.preventDefault(); setMsg(""); }}>
            <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message..." />
            <Button type="submit" size="icon" aria-label="Send"><Send className="h-4 w-4" /></Button>
          </form>
        </section>
      </Card>
    </div>
  );
}
