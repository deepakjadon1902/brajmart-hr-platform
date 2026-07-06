import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { sendMessage } from "@/store/slices/workspaceSlice";

export default function MailCenter() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { employees, messages } = useAppSelector((s) => s.workspace);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const recipient = employees.find((employee) => employee.id === employeeId) ?? employees[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Mail Center" subtitle="Send announcements, payslips or bulk emails." />
      <Card className="p-6 shadow-soft">
        <Tabs defaultValue="compose">
          <TabsList>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Email</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="compose" className="mt-4">
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!recipient) return;
                const form = new FormData(e.currentTarget);
                dispatch(
                  sendMessage({
                    fromId: user?.id ?? "hr",
                    fromName: user?.name ?? "HR Team",
                    toId: recipient.id,
                    toName: recipient.name,
                    subject: String(form.get("subject") ?? ""),
                    body: String(form.get("message") ?? ""),
                    channel: "hr",
                  }),
                );
                toast.success("Message sent to employee portal");
                e.currentTarget.reset();
              }}
            >
              <div>
                <Label>To</Label>
                <Select value={employeeId} onValueChange={setEmployeeId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                Send
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="bulk" className="mt-4">
            <p className="text-sm text-muted-foreground">
              Upload CSV with recipients to send a bulk email blast.
            </p>
          </TabsContent>
          <TabsContent value="templates" className="mt-4">
            <p className="text-sm text-muted-foreground">
              Reusable templates for onboarding, payslip and policy emails.
            </p>
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
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
