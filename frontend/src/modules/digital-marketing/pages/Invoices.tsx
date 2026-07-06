import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable } from "@/components/common/DataTable";
import { ExportButtons } from "@/components/common/ExportButtons";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch, useAppSelector } from "@/store";
import { upsertInvoice } from "@/store/slices/workspaceSlice";
import type { Client, Invoice } from "@/types";
import { FilePenLine, Plus } from "lucide-react";
import { toast } from "sonner";

const templates: Record<Client["domain"], string> = {
  IT: "IT services invoice: development, hosting, maintenance and support.",
  "Digital Marketing": "Digital marketing invoice: strategy, media planning, creatives and analytics.",
  "Social Marketing": "Social marketing invoice: content calendar, creatives, reels and reporting.",
  "Email Marketing": "Email marketing invoice: campaign setup, automation, templates and delivery reporting.",
  "WhatsApp Marketing": "WhatsApp marketing invoice: broadcast setup, templates, automation and reports.",
};

export default function Invoices() {
  const dispatch = useAppDispatch();
  const { clients, invoices } = useAppSelector((s) => s.workspace);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === clientId) ?? clients[0],
    [clientId, clients],
  );

  const startEdit = (invoice: Invoice) => {
    setEditing(invoice);
    setClientId(invoice.clientId);
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle="Design, edit and export client invoices by service domain."
        actions={
          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit invoice" : "Create invoice"}</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!selectedClient) return;
                  const form = new FormData(event.currentTarget);
                  const amount = Number(form.get("amount") || 0);
                  const tax = Number(form.get("tax") || Math.round(amount * 0.18));
                  dispatch(
                    upsertInvoice({
                      id: editing?.id,
                      clientId: selectedClient.id,
                      clientName: selectedClient.name,
                      domain: selectedClient.domain,
                      month: String(form.get("month") ?? ""),
                      amount,
                      tax,
                      status: String(form.get("status")) as Invoice["status"],
                      template: String(form.get("template") ?? ""),
                      notes: String(form.get("notes") ?? ""),
                    }),
                  );
                  toast.success(editing ? "Invoice updated" : "Invoice created");
                  setOpen(false);
                  setEditing(null);
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label>Client</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.domain}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Month</Label>
                    <Input name="month" className="mt-1" defaultValue={editing?.month ?? "June 2026"} required />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select name="status" defaultValue={editing?.status ?? "draft"}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      name="amount"
                      type="number"
                      className="mt-1"
                      defaultValue={editing?.amount ?? selectedClient?.monthlyValue ?? 0}
                      required
                    />
                  </div>
                  <div>
                    <Label>GST / Tax</Label>
                    <Input
                      name="tax"
                      type="number"
                      className="mt-1"
                      defaultValue={editing?.tax ?? Math.round((selectedClient?.monthlyValue ?? 0) * 0.18)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Invoice format</Label>
                    <Textarea
                      name="template"
                      className="mt-1"
                      rows={3}
                      defaultValue={editing?.template ?? templates[selectedClient?.domain ?? "Digital Marketing"]}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Notes</Label>
                    <Textarea name="notes" className="mt-1" rows={3} defaultValue={editing?.notes} />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Save invoice
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <DataTable
        data={invoices}
        searchKeys={["clientName", "domain", "month", "status"]}
        toolbar={<ExportButtons rows={invoices} filename="digital-marketing-invoices" />}
        columns={[
          { key: "clientName", header: "Client" },
          { key: "domain", header: "Domain" },
          { key: "month", header: "Month" },
          { key: "amount", header: "Amount", render: (invoice) => `INR ${invoice.amount.toLocaleString()}` },
          { key: "tax", header: "Tax", render: (invoice) => `INR ${invoice.tax.toLocaleString()}` },
          { key: "total", header: "Total", render: (invoice) => `INR ${invoice.total.toLocaleString()}` },
          { key: "status", header: "Status", render: (invoice) => <StatusBadge status={invoice.status} /> },
          {
            key: "id",
            header: "Edit",
            render: (invoice) => (
              <Button size="sm" variant="outline" onClick={() => startEdit(invoice)}>
                <FilePenLine className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
