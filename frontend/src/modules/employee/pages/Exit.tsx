import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Exit() {
  return (
    <div className="space-y-6">
      <PageHeader title="Exit Workflow" subtitle="Resignation, asset return and settlement." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-destructive" />
            <h3 className="font-semibold">Submit Resignation</h3>
          </div>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Resignation submitted");
            }}
          >
            <div>
              <Label>Last working day</Label>
              <Input type="date" className="mt-1" required />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea rows={4} className="mt-1" maxLength={1000} required />
            </div>
            <Button type="submit" variant="destructive">
              Submit
            </Button>
          </form>
        </Card>
        <Card className="p-6 shadow-soft">
          <h3 className="font-semibold">Exit Checklist</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-lg border p-3">
              Asset return <span className="text-warning">Pending</span>
            </li>
            <li className="flex items-center justify-between rounded-lg border p-3">
              Handover doc <span className="text-success">Done</span>
            </li>
            <li className="flex items-center justify-between rounded-lg border p-3">
              No-dues <span className="text-warning">In review</span>
            </li>
            <li className="flex items-center justify-between rounded-lg border p-3">
              F&F settlement <span className="text-muted-foreground">Not started</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
