import { PageHeader } from "../../components/ui/page-header";
import { EmptyState } from "../../components/ui/states";

export default function IncidentsPage() {
  return (
    <main className="page">
      <PageHeader
        title="Incidents"
        description="Incident triage and response workflows will be added in a future milestone."
      />

      <EmptyState
        title="Incidents module coming soon"
        description="Use Audit Logs, Orders, and Observability pages for current operational diagnostics."
      />
    </main>
  );
}
