import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ExportButtons } from "@/components/common/ExportButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addClient } from "@/store/slices/workspaceSlice";
import { useAppDispatch, useAppSelector } from "@/store";
import type { Client } from "@/types";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const domains: Client["domain"][] = [
  "IT",
  "Digital Marketing",
  "Social Marketing",
  "Email Marketing",
  "WhatsApp Marketing",
];
const statuses: Client["status"][] = ["continue", "on-break", "leave", "new"];

export default function Clients() {
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState<Client["domain"]>("Digital Marketing");
  const [status, setStatus] = useState<Client["status"]>("new");
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const clients = useAppSelector((s) => s.workspace.clients);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        subtitle="Client status shared from HR and visible to digital marketing."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add client</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  const name = String(form.get("name") ?? "").trim();
                  dispatch(
                    addClient({
                      name,
                      owner: String(form.get("owner") ?? "").trim(),
                      email: String(form.get("email") ?? "").trim(),
                      domain,
                      status,
                      addedBy: user?.name ?? "HR",
                      monthlyValue: Number(form.get("monthlyValue") || 0),
                    }),
                  );
                  toast.success(`${name} added`);
                  setOpen(false);
                  event.currentTarget.reset();
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Name</Label>
                    <Input name="name" className="mt-1" required />
                  </div>
                  <div>
                    <Label>Owner</Label>
                    <Input name="owner" className="mt-1" required />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input name="email" type="email" className="mt-1" required />
                  </div>
                  <div>
                    <Label>Monthly value</Label>
                    <Input name="monthlyValue" type="number" className="mt-1" required />
                  </div>
                  <div>
                    <Label>Domain</Label>
                    <Select value={domain} onValueChange={(value) => setDomain(value as Client["domain"])}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {domains.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(value) => setStatus(value as Client["status"])}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item.replace("-", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Save client
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <DataTable
        data={clients}
        searchKeys={["name", "owner", "domain", "status"]}
        toolbar={<ExportButtons rows={clients} filename="digital-marketing-clients" />}
        columns={[
          { key: "name", header: "Client" },
          { key: "owner", header: "Owner" },
          { key: "email", header: "Email" },
          { key: "domain", header: "Domain" },
          {
            key: "monthlyValue",
            header: "Monthly Value",
            render: (client) => `INR ${client.monthlyValue.toLocaleString()}`,
          },
          { key: "status", header: "Status", render: (client) => <StatusBadge status={client.status} /> },
        ]}
      />
    </div>
  );
}
