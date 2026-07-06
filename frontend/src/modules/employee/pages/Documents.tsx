import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppDispatch, useAppSelector } from "@/store";
import { addDocument } from "@/store/slices/workspaceSlice";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";

export default function Documents() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { documents, employees } = useAppSelector((s) => s.workspace);
  const currentEmployee = employees.find((employee) => employee.id === user?.id) ?? user;
  const docs = documents.filter((doc) => doc.employeeId === currentEmployee?.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" subtitle="Upload and manage your personal documents." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 shadow-soft lg:col-span-1">
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!currentEmployee) return;
              const form = new FormData(event.currentTarget);
              const file = form.get("file") as File | null;
              if (!file || file.size === 0) {
                toast.error("Please choose a real document file.");
                return;
              }
              try {
                await dispatch(
                  addDocument({
                    employeeId: currentEmployee.id,
                    employeeName: currentEmployee.name,
                    name: file.name || String(form.get("name") ?? "Document"),
                    type: String(form.get("type") ?? "Job document"),
                    size: `${Math.ceil(file.size / 1024)} KB`,
                    file,
                  }),
                ).unwrap();
                toast.success("Document uploaded for HR review");
                event.currentTarget.reset();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Document upload failed");
              }
            }}
          >
            <div>
              <Label>Document type</Label>
              <Input name="type" className="mt-1" placeholder="Aadhaar, PAN, offer letter" required />
            </div>
            <div>
              <Label>Document name</Label>
              <Input name="name" className="mt-1" placeholder="Optional manual name" />
            </div>
            <div>
              <Label>File</Label>
              <Input name="file" type="file" className="mt-1" />
            </div>
            <Button type="submit" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </form>
        </Card>
        <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2">
          {docs.map((d) => (
            <Card key={d.id} className="flex items-center gap-3 p-4 shadow-soft">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground">
                  {d.type} - {d.size}
                </p>
                <div className="mt-2">
                  <StatusBadge status={d.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
