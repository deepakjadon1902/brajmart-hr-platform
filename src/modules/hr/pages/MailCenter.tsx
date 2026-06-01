import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Send } from "lucide-react";
import { toast } from "sonner";

export default function MailCenter() {
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
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); toast.success("Email queued"); }}>
              <div><Label>To</Label><Input type="email" placeholder="employee@acme.com" className="mt-1" /></div>
              <div><Label>Subject</Label><Input className="mt-1" required maxLength={200} /></div>
              <div><Label>Message</Label><Textarea rows={6} className="mt-1" required maxLength={5000} /></div>
              <Button type="submit"><Send className="mr-2 h-4 w-4" />Send</Button>
            </form>
          </TabsContent>
          <TabsContent value="bulk" className="mt-4"><p className="text-sm text-muted-foreground">Upload CSV with recipients to send a bulk email blast.</p></TabsContent>
          <TabsContent value="templates" className="mt-4"><p className="text-sm text-muted-foreground">Reusable templates for onboarding, payslip and policy emails.</p></TabsContent>
          <TabsContent value="history" className="mt-4"><p className="text-sm text-muted-foreground">All emails sent in the last 90 days.</p></TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
