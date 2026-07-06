import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Check } from "lucide-react";

export default function Onboarding() {
  return (
    <div className="space-y-6">
      <PageHeader title="Onboarding" subtitle="Complete your onboarding journey." />
      <EmptyState
        icon={<Check className="h-6 w-6" />}
        title="No onboarding checklist"
        description="Your onboarding checklist will appear here after HR assigns it in the database."
      />
    </div>
  );
}
