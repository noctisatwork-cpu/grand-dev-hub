import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Btn, Empty, Field, Modal, SelectInput, Tag, TextArea, TextInput } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import {
  PAYMENT_STATUSES,
  PROGRAMS,
  daysBetween,
  inr,
  programEnd,
  today,
  uid,
  type Client,
} from "@/lib/crm-types";
import { toast } from "sonner";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "Clients — Dev's CRM" },
      {
        name: "description",
        content: "Track The Grand Standard mentorship clients, payments, guarantees and program timelines.",
      },
      { property: "og:title", content: "Clients — Dev's CRM" },
      { property: "og:description", content: "Mentorship and retainer clients with program timelines." },
    ],
  }),
  component: ClientsPage,
});

function blank(): Client {
  return {
    id: uid(),
    name: "",
    business: "",
    program: "The Grand Standard",
    startDate: today(),
    months: 3,
    paymentStatus: "Pending",
    amount: 25000,
    guaranteeActive: true,
    progress: [],
  };
}

function ClientEditor({ client, onDone }: { client: Client; onDone: () => void }) {
  const { update } = useStore();
  const [form, setForm] = useState<Client>(client);
  const [note, setNote] = useState("");
  const set = <K extends keyof Client>(k: K, v: Client[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = (next: Client = form) => {
    update((d) => ({
      ...d,
      clients: d.clients.some((c) => c.id === next.id)
        ? d.clients.map((c) => (c.id === next.id ? next : c))
        : [next, ...d.clients],
    }));
    toast.success("Client saved");
    onDone();
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Name">
        <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} />
      </Field>
      <Field label="Business">
        <TextInput value={form.business} onChange={(e) => set("business", e.target.value)} />
      </Field>
      <Field label="Program">
        <SelectInput value={form.program} onChange={(e) => set("program", e.target.value as Client["program"])}>
          {PROGRAMS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Duration (months)">
        <TextInput
          type="number"
          min={1}
          value={form.months}
          onChange={(e) => set("months", Number(e.target.value) || 3)}
        />
      </Field>
      <Field label="Start date">
        <TextInput type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
      </Field>
      <Field label="End date (auto)">
        <TextInput value={programEnd(form) || "—"} readOnly className="text-muted-foreground" />
      </Field>
      <Field label="Payment status">
        <SelectInput
          value={form.paymentStatus}
          onChange={(e) => set("paymentStatus", e.target.value as Client["paymentStatus"])}
        >
          {PAYMENT_STATUSES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Amount (₹)">
        <TextInput
          type="number"
          value={form.amount}
          onChange={(e) => set("amount", Number(e.target.value) || 0)}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2">
        <input
          type="checkbox"
          checked={form.guaranteeActive}
          onChange={(e) => set("guaranteeActive", e.target.checked)}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        Results guarantee active
      </label>

      <div className="sm:col-span-2">
        <p className="label-xs">Progress log</p>
        <div className="mt-2 flex flex-col gap-2">
          {form.progress.map((p) => (
            <div key={p.id} className="flex items-start gap-3 rounded-md border border-border px-3 py-2 text-sm">
              <span className="font-mono text-xs text-muted-foreground">{p.date}</span>
              <span className="flex-1 text-foreground">{p.note}</span>
              <button
                aria-label="Remove note"
                onClick={() => set("progress", form.progress.filter((x) => x.id !== p.id))}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {form.progress.length === 0 && (
            <p className="text-xs text-muted-foreground">No progress notes yet.</p>
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <TextArea
            value={note}
            placeholder="Add a dated progress note…"
            onChange={(e) => setNote(e.target.value)}
            className="min-h-10"
          />
          <Btn
            onClick={() => {
              if (!note.trim()) return;
              set("progress", [{ id: uid(), date: today(), note: note.trim() }, ...form.progress]);
              setNote("");
            }}
          >
            Log
          </Btn>
        </div>
      </div>

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Btn variant="ghost" onClick={onDone}>
          Cancel
        </Btn>
        <Btn variant="accent" onClick={() => save()}>
          Save client
        </Btn>
      </div>
    </div>
  );
}

function ClientsPage() {
  const { data, update } = useStore();
  const [editing, setEditing] = useState<Client | null>(null);

  const remove = (id: string) => {
    update((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) }));
    setEditing(null);
    toast.success("Client removed");
  };

  return (
    <AppShell
      title="Clients"
      subtitle={`${data.clients.length} clients · ${inr(data.clients.reduce((s, c) => s + c.amount, 0))} contracted`}
      actions={
        <Btn variant="accent" onClick={() => setEditing(blank())}>
          <Plus className="h-4 w-4" /> New client
        </Btn>
      }
    >
      {data.clients.length === 0 ? (
        <Empty>No clients yet — move a lead to Won/Client in the pipeline.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.clients.map((c) => {
            const end = programEnd(c);
            const remaining = daysBetween(today(), end);
            return (
              <button
                key={c.id}
                onClick={() => setEditing(c)}
                className="panel p-5 text-left transition-colors hover:border-accent/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base text-foreground">{c.name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{c.business || "—"}</p>
                  </div>
                  <Tag tone={c.paymentStatus === "Paid" ? "success" : c.paymentStatus === "Partial" ? "accent" : "danger"}>
                    {c.paymentStatus}
                  </Tag>
                </div>
                <p className="mt-4 font-display text-2xl text-foreground">{inr(c.amount)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.program}</p>
                <div className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  <p>
                    {c.startDate} → {end || "—"}
                  </p>
                  <p className={remaining < 0 ? "text-muted-foreground" : "text-accent"}>
                    {remaining >= 0 ? `${remaining} days remaining` : "Program completed"}
                  </p>
                  {c.guaranteeActive && <p className="text-success">Guarantee active</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Client" wide>
        {editing && (
          <>
            <ClientEditor client={editing} onDone={() => setEditing(null)} />
            {data.clients.some((c) => c.id === editing.id) && (
              <div className="mt-4 border-t border-border pt-4">
                <Btn variant="danger" onClick={() => remove(editing.id)}>
                  <Trash2 className="h-4 w-4" /> Delete client
                </Btn>
              </div>
            )}
          </>
        )}
      </Modal>
    </AppShell>
  );
}
