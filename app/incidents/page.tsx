import { AlertTriangle } from "lucide-react";

import { GlowPanel } from "../../components/ui/glow-panel";
import { PageHeader } from "../../components/ui/page-header";
import { EmptyState } from "../../components/ui/states";

export default function IncidentsPage() {
  return (
    <main className="page">
      <PageHeader
        eyebrow="Operations"
        icon={<AlertTriangle size={18} aria-hidden />}
        title="Incidents"
        description="Incident triage and response workflows will be added in a future milestone."
      />

      <GlowPanel className="glow-panel-card">
        <section className="card">
          <EmptyState
            title="Incidents module coming soon"
            description="Use Audit Logs, Orders, and Observability pages for current operational diagnostics."
          />
        </section>
      </GlowPanel>
    </main>
  );
}
