import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Btn } from "@/components/ui-kit";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Dev's CRM" },
      { name: "description", content: "Drive sync status, theme, PIN lock and data export for Dev's CRM." },
      { property: "og:title", content: "Settings — Dev's CRM" },
      { property: "og:description", content: "Drive sync, theme and data export." },
    ],
  }),
  component: SettingsPage,
});

function Row({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 last:border-0">
      <div>
        <p className="text-sm text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function SettingsPage() {
  const { data, sync, syncMessage, lastSavedAt, reload } = useStore();

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devs-crm-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell title="Settings" subtitle="Storage, appearance and access">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel">
          <div className="border-b border-border px-5 py-3">
            <p className="label-xs">Google Drive storage</p>
          </div>
          <Row
            title="Connection"
            description={
              sync === "offline" || sync === "error"
                ? syncMessage || "Not connected"
                : "Data lives in devs-crm-data.json in your Drive"
            }
          >
            <Btn onClick={() => { reload(); toast.info("Reloading from Drive…"); }}>Reload from Drive</Btn>
          </Row>
          <Row
            title="Last save"
            description={lastSavedAt ? new Date(lastSavedAt).toLocaleString() : "No save in this session yet"}
          >
            <span className="text-xs text-muted-foreground capitalize">{sync}</span>
          </Row>
          <Row title="Export" description="Download a local copy of all four tables">
            <Btn onClick={exportJson}>Export JSON</Btn>
          </Row>
        </section>

        <section className="panel">
          <div className="border-b border-border px-5 py-3">
            <p className="label-xs">Workspace</p>
          </div>
          <Row title="Theme" description="Dark by default, light available">
            <ThemeToggle />
          </Row>
          <Row title="PIN lock" description="4-digit PIN gates the app on every new session">
            <span className="font-mono text-xs text-muted-foreground">•••• set</span>
          </Row>
          <Row title="Lock now" description="Return to the PIN screen">
            <Btn
              onClick={() => {
                sessionStorage.removeItem("devs-crm-unlocked");
                location.reload();
              }}
            >
              Lock
            </Btn>
          </Row>
          <Row
            title="Records"
            description={`${data.leads.length} leads · ${data.clients.length} clients · ${data.tasks.length} tasks · ${data.content.length} log entries`}
          />
        </section>
      </div>
    </AppShell>
  );
}
