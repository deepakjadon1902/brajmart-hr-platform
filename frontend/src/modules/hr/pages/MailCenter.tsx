import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Users } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { sendMessage } from "@/store/slices/workspaceSlice";

const allEmployeesValue = "all-employees";

export default function MailCenter() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { employees, messages } = useAppSelector((s) => s.workspace);
  const [employeeId, setEmployeeId] = useState(allEmployeesValue);
  const recipient = employees.find((employee) => employee.id === employeeId) ?? employees[0];
  const recipientLabel =
    employeeId === allEmployeesValue
      ? `All employees (${employees.length})`
      : recipient
        ? `${recipient.name} - ${recipient.email}`
        : "Select employee";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mail Center"
        subtitle="Send direct messages or common announcements to employee portals."
      />
      <Card className="p-6 shadow-soft">
        <Tabs defaultValue="compose">
          <TabsList>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="compose" className="mt-4">
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (employeeId !== allEmployeesValue && !recipient) return;
                const form = new FormData(e.currentTarget);
                try {
                  const result = await dispatch(
                    sendMessage({
                      fromId: user?.id ?? "hr",
                      fromName: user?.name ?? "HR Team",
                      toId: employeeId,
                      toName: employeeId === allEmployeesValue ? "All employees" : recipient?.name,
                      subject: String(form.get("subject") ?? ""),
                      body: String(form.get("message") ?? ""),
                      channel: user?.role === "team-manager" ? "manager" : "hr",
                    }),
                  ).unwrap();
                  const count = Array.isArray(result) ? result.length : 1;
                  toast.success(`Message sent to ${count} employee${count === 1 ? "" : "s"}`);
                  e.currentTarget.reset();
                  setEmployeeId(allEmployeesValue);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to send message");
                }
              }}
            >
              <div>
                <Label>Recipient</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue>{recipientLabel}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={allEmployeesValue}>
                      <span className="inline-flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        All employees
                      </span>
                    </SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject</Label>
                <Input name="subject" className="mt-1" required maxLength={200} />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea name="message" rows={6} className="mt-1" required maxLength={5000} />
              </div>
              <Button type="submit">
                <Send className="mr-2 h-4 w-4" />
                {employeeId === allEmployeesValue ? "Send common message" : "Send message"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="history" className="mt-4">
            <div className="space-y-3">
              {messages.slice(0, 8).map((message) => (
                <div key={message.id} className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">
                    {message.fromName} to {message.toName}: {message.subject}
                  </p>
                  <p className="text-muted-foreground">{message.body}</p>
                </div>
              ))}
              {!messages.length && (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No messages sent yet
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
