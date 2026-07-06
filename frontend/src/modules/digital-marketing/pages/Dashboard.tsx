import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useAppSelector } from "@/store";
import { BarChart3, ReceiptText, Users, Wallet } from "lucide-react";

export default function Dashboard() {
  const { clients, invoices } = useAppSelector((s) => s.workspace);
  const revenue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const activeClients = clients.filter((client) => client.status === "continue").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Digital Marketing Dashboard"
        subtitle="Clients, invoices and campaign billing across every service domain."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Clients" value={clients.length} icon={<Users className="h-5 w-5" />} />
        <StatCard
          label="Continuing"
          value={activeClients}
          tone="success"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <StatCard
          label="Invoices"
          value={invoices.length}
          icon={<ReceiptText className="h-5 w-5" />}
        />
        <StatCard
          label="Invoice Value"
          value={`INR ${revenue.toLocaleString()}`}
          tone="info"
          icon={<Wallet className="h-5 w-5" />}
        />
      </div>
      <DataTable
        data={clients}
        searchKeys={["name", "domain", "status", "owner"]}
        columns={[
          { key: "name", header: "Client" },
          { key: "owner", header: "Owner" },
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
