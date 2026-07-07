import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import { createCompany, setActive } from "@/store/slices/companySlice";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function P() {
  const { list, activeId } = useAppSelector((s) => s.company);
  const d = useAppDispatch();
  const [open, setOpen] = useState(false);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const companyId = String(form.get("companyId") ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    const primaryColor = String(form.get("primaryColor") ?? "#4F46E5").trim();
    try {
      const company = await d(createCompany({ name, companyId, primaryColor })).unwrap();
      d(setActive(company.companyId || company.id));
      toast.success(`${name} created`);
      setOpen(false);
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create company");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        subtitle="Manage tenants on the platform."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New company</DialogTitle>
              </DialogHeader>
              <form className="space-y-4" onSubmit={onCreate}>
                <div>
                  <Label htmlFor="company-name">Company name</Label>
                  <Input id="company-name" name="name" className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="company-id">Company code</Label>
                  <Input id="company-id" name="companyId" className="mt-1" placeholder="brajmart-delhi" required />
                </div>
                <div>
                  <Label htmlFor="company-color">Primary color</Label>
                  <Input id="company-color" name="primaryColor" type="color" defaultValue="#4F46E5" className="mt-1 h-10" />
                </div>
                <Button type="submit" className="w-full">
                  Create company
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <Card
            key={c.id}
            className={`p-5 shadow-soft transition-all ${activeId === c.id ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{c.name}</h3>
                <p className="text-xs text-muted-foreground">{c.id}</p>
              </div>
            </div>
            <Button
              variant={activeId === c.id ? "default" : "outline"}
              size="sm"
              className="mt-4 w-full"
              onClick={() => d(setActive(c.id))}
            >
              {activeId === c.id ? "Active" : "Switch to"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
