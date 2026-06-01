import { PageHeader } from "@/components/common/PageHeader";
import { FileUpload } from "@/components/common/FileUpload";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

const docs = [
  { name: "Offer Letter.pdf", size: "212 KB" },
  { name: "Aadhaar.pdf", size: "456 KB" },
  { name: "PAN Card.pdf", size: "98 KB" },
  { name: "Education Certificates.pdf", size: "1.2 MB" },
];

export default function Documents() {
  return (
    <div className="space-y-6">
      <PageHeader title="Documents" subtitle="Upload and manage your personal documents." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1"><FileUpload multiple label="Upload documents" /></div>
        <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2">
          {docs.map((d) => (
            <Card key={d.name} className="flex items-center gap-3 p-4 shadow-soft">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><FileText className="h-5 w-5" /></div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.size}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
