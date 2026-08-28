import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Radio,
  Settings as SettingsIcon,
  Cloud,
  CloudOff,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useStore } from "@/lib/store";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/content", label: "Content & Outreach", icon: Radio },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function SyncBadge() {
  const { sync, syncMessage } = useStore();
  const map = {
    idle: { text: "Synced with Drive", icon: Cloud, tone: "text-muted-foreground" },
    loading: { text: "Loading…", icon: Loader2, tone: "text-muted-foreground" },
    saving: { text: "Saving…", icon: Loader2, tone: "text-muted-foreground" },
    saved: { text: "Saved to Drive", icon: Cloud, tone: "text-success" },
    offline: { text: "Local only", icon: CloudOff, tone: "text-warning" },
    error: { text: "Sync failed", icon: CloudOff, tone: "text-destructive" },
  } as const;
  const s = map[sync];
  const Icon = s.icon;
  return (
    <div className={`flex items-center gap-2 text-[11px] ${s.tone}`} title={syncMessage ?? ""}>
      <Icon className={`h-3.5 w-3.5 ${sync === "saving" || sync === "loading" ? "animate-spin" : ""}`} />
      {s.text}
    </div>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
        <div className="px-2">
          <p className="label-xs">Foundrix</p>
          <h2 className="mt-1 font-display text-2xl leading-none text-foreground">Dev&apos;s CRM</h2>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary !text-foreground" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-3 border-t border-border px-2 pt-4">
          <SyncBadge />
          <ThemeToggle className="w-fit" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-end justify-between gap-3 border-b border-border bg-background/85 px-6 py-5 backdrop-blur">
          <div>
            <h1 className="font-display text-3xl leading-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-muted-foreground"
              activeProps={{ className: "bg-secondary !text-foreground" }}
            >
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
