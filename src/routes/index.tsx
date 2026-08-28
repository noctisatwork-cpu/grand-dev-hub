import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Check } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { LeadForm } from "@/components/LeadForm";
import { Btn, Empty, Field, Modal, SelectInput, Stat, Tag, TextInput } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import {
  SOURCES,
  STATUSES,
  daysBetween,
  inr,
  programEnd,
  today,
  uid,
  type Task,
} from "@/lib/crm-types";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Dev's CRM" },
      {
        name: "description",
        content: "Pipeline funnel, lead sources, conversion rate, revenue and active mentorship clients at a glance.",
      },
      { property: "og:title", content: "Dashboard — Dev's CRM" },
      { property: "og:description", content: "Funnel, sources, revenue and follow-ups for Foundrix." },
    ],
  }),
  component: Dashboard;
});

function TaskPanel() {
  const { data, update } = useStore();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(today());
  const [linkedId, setLinkedId] = useState("");

  const open = data.tasks.filter((t) => !t.done);
  const overdue = open.filter((t) => t.dueDate < today());
  const dueToday = open.filter((t) => t.dueDate === today());
  const upcoming = open.filter((t) => t.dueDate > today()).slice(0, 5);

  const toggle = (t: Task) =>
    update((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)) }));

  const add = () => {
    if (!title.trim()) return;
    const linked = [...data.leads, ...data.clients].find((x) => x.id === linkedId);
    update((d) => ({
      ...d,
      tasks: [
        { id: uid(), title: title.trim(), dueDate: due, done: false, linkedId: linkedId || undefined, linkedLabel: linked?.name },
        ...d.tasks,
      ],
    }));
    setTitle("");
    setLinkedId("");
    setAdding(false);
    toast.success("Follow-up added");
  };

  const List = ({ label, items, tone }: { label: string; items: Task[]; tone?: "danger" }) => (
    <div>
      <p className="label-xs">{label}</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {items.length === 0 && <p className="text-xs text-muted-foreground">Nothing here.</p>}
        {items.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
            <button
              aria-label="Complete"
              onClick={() => toggle(t)}
              className="flex h-4 w-4 items-center justify-center rounded border border-border text-transparent hover:border-accent hover:text-accent"
            >
              <Check className="h-3 w-3" />
            </button>
            <span className="flex-1 text-sm text-foreground">{t.title}</span>
            {t.linkedLabel && <Tag>{t.linkedLabel}</Tag>}
            <span className={`font-mono text-xs ${tone === "danger" ? "text-destructive" : "text-muted-foreground"}`}>
              {t.dueDate}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">Follow-ups</h2>
        <Btn variant="ghost" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add
        </Btn>
      </div>
      <div className="flex flex-col gap-5">
        <List label="Overdue" items={overdue} tone="danger" />
        <List label="Today" items={dueToday} />
        <List label="Upcoming" items={upcoming} />
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="New follow-up">
        <div className="grid gap-4">
          <Field label="Task">
            <TextInput
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="e.g. Send proposal recap"
            />
          </Field>
          <Field label="Due date">
            <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
          <Field label="Linked to">
            <SelectInput value={linkedId} onChange={(e) => setLinkedId(e.target.value)}>
              <option value="">None</option>
              {data.leads.map((l) => (
                <option key={l.id} value={l.id}>
                  Lead · {l.name}
                </option>
              ))}
              {data.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  Client · {c.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Btn>
            <Btn variant="accent" onClick={add}>
              Add follow-up
            </Btn>
          </div>
        </div>
      </Modal>
    </section>
  );
}

function Chart({ title, data: rows, color }: { title: string; data: { name: string; value: number }[]; color: string }) {
  return (
    <section className="panel p-5">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} stroke="var(--color-border)" />
            <XAxis type="number" allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              stroke="var(--color-muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "var(--color-secondary)" }}
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--color-foreground)",
              }}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
              {rows.map((r) => (
                <Cell key={r.name} fill={color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Dashboard() {
  const { data } = useStore();
  const [adding, setAdding] = useState(false);

  const funnel = useMemo(
    () => STATUSES.map((s) => ({ name: s, value: data.leads.filter((l) => l.status === s).length })),
    [data.leads],
  );
  const bySource = useMemo(
    () => SOURCES.map((s) => ({ name: s, value: data.leads.filter((l) => l.source === s).length })).filter((r) => r.value),
    [data.leads],
  );

  const won = data.leads.filter((l) => l.status === "Won/Client").length;
  const conversion = data.leads.length ? Math.round((won / data.leads.length) * 100) : 0;
  const revenue = data.clients.reduce((s, c) => s + (c.paymentStatus === "Pending" ? 0 : c.amount), 0);
  const contracted = data.clients.reduce((s, c) => s + c.amount, 0);
  const active = data.clients.filter((c) => daysBetween(today(), programEnd(c)) >= 0);
  const monthRevenue = data.clients
    .filter((c) => c.startDate.slice(0, 7) === today().slice(0, 7) && c.paymentStatus !== "Pending")
    .reduce((s, c) => s + c.amount, 0);

  return (
    <AppShell
      title="Dashboard"
      subtitle="Foundrix · The Grand Standard"
      actions={
        <Btn variant="accent" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> New lead
        </Btn>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total leads" value={data.leads.length} hint={`${won} won`} />
        <Stat label="Conversion" value={`${conversion}%`} hint="Leads → clients" />
        <Stat label="Collected revenue" value={inr(revenue)} hint={`${inr(contracted)} contracted`} />
        <Stat label="This month" value={inr(monthRevenue)} hint="Programs started this month" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Chart title="Pipeline funnel" data={funnel} color="var(--color-chart-1)" />
        <Chart title="Leads by source" data={bySource} color="var(--color-chart-2)" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl text-foreground">Active clients</h2>
            <span className="text-xs text-muted-foreground">{active.length} in program</span>
          </div>
          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active programs right now.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {active.map((c) => {
                const total = (c.months || 3) * 30;
                const left = daysBetween(today(), programEnd(c));
                const pct = Math.max(0, Math.min(100, ((total - left) / total) * 100));
                return (
                  <div key={c.id} className="rounded-md border border-border px-3 py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{left} days left</span>
                    </div>
                    <div className="mt-2 h-1 w-full rounded-full bg-secondary">
                      <div className="h-1 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {c.program} · {inr(c.amount)} · {c.paymentStatus}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <TaskPanel />
      </div>

      {data.leads.length === 0 && (
        <div className="mt-6">
          <Empty>Start by adding your first lead — it takes about ten seconds.</Empty>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New lead" wide>
        <LeadForm onDone={() => setAdding(false)} />
      </Modal>
    </AppShell>
  );
}
