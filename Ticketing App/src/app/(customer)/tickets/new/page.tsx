import { PageHeader } from "@/components/shared/PageHeader";
import { CreateTicketForm } from "@/components/create-ticket/CreateTicketForm";

export default function NewTicketPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New ticket"
        description="Tell us what's going on — we'll route it to the right team."
      />
      <CreateTicketForm />
    </div>
  );
}
