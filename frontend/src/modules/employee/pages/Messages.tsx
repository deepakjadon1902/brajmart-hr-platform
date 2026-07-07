import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store";
import { sendMessage } from "@/store/slices/workspaceSlice";
import { Send } from "lucide-react";
import { toast } from "sonner";

function formatMessageTime(value?: string) {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Messages() {
  const [msg, setMsg] = useState("");
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { employees, messages } = useAppSelector((s) => s.workspace);
  const currentEmployee = employees.find((employee) => employee.id === user?.id) ?? user;
  const employeeMessages = messages.filter(
    (message) => message.toId === currentEmployee?.id || message.fromId === currentEmployee?.id,
  );
  const contacts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; last: string; channel: string }>();
    employeeMessages.forEach((message) => {
      const isSender = message.fromId === currentEmployee?.id;
      const id = isSender ? message.toId : message.fromId;
      map.set(id, {
        id,
        name: isSender ? message.toName : message.fromName,
        last: message.body,
        channel: message.channel,
      });
    });
    return Array.from(map.values());
  }, [currentEmployee?.id, employeeMessages]);
  const [activeId, setActiveId] = useState("");
  const active = contacts.find((contact) => contact.id === activeId) ?? contacts[0];
  const thread = employeeMessages.filter(
    (message) =>
      active &&
      ((message.fromId === currentEmployee?.id && message.toId === active.id) ||
        (message.toId === currentEmployee?.id && message.fromId === active.id)),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Messages" subtitle="Reply to HR, team managers and colleagues." />
      <Card className="grid h-[60vh] grid-cols-1 overflow-hidden p-0 shadow-soft md:grid-cols-[280px_1fr]">
        <aside className="border-r">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setActiveId(contact.id)}
              className={`flex w-full items-start gap-3 border-b p-4 text-left hover:bg-muted/40 ${active?.id === contact.id ? "bg-muted/40" : ""}`}
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {contact.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{contact.name}</p>
                <p className="truncate text-xs text-muted-foreground">{contact.last}</p>
              </div>
            </button>
          ))}
        </aside>
        <section className="flex flex-col">
          <header className="border-b p-4 font-medium">{active?.name ?? "No messages"}</header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {thread.map((message) => {
              const mine = message.fromId === currentEmployee?.id;
              return (
                <div
                  key={message.id}
                  className={`max-w-sm rounded-2xl px-3 py-2 ${mine ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  <p className="font-medium">{message.subject}</p>
                  <p>{message.body}</p>
                  <p className="mt-1 text-[11px] opacity-70">{formatMessageTime(message.sentOn)}</p>
                </div>
              );
            })}
          </div>
          <form
            className="flex gap-2 border-t p-3"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!active || !currentEmployee || !msg.trim()) return;
              try {
                await dispatch(
                  sendMessage({
                    fromId: currentEmployee.id,
                    fromName: currentEmployee.name,
                    toId: active.id,
                    toName: active.name,
                    subject: "Reply",
                    body: msg.trim(),
                    channel: active.channel === "manager" ? "manager" : "employee",
                  }),
                ).unwrap();
                toast.success("Reply sent");
                setMsg("");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to send reply");
              }
            }}
          >
            <Input
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Type a message..."
            />
            <Button type="submit" size="icon" aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      </Card>
    </div>
  );
}
