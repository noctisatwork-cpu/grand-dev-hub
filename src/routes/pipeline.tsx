import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { LeadForm } from "@/components/LeadForm";
import { Btn, Empty, Modal, SelectInput, Tag, TextInput } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import {
  BUSINESS_TYPES,
  SOURCES,
  STATUSES,
  today,
  uid,
  type CrmData,
  type Lead,
  type Status,
} from "@/lib/crm-types";
import { toast } from "sonner";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — Dev's CRM" },
      { name: "description", content: "Kanban and table views of every Foundrix lead from first touch to won client." },
      { property: "og:title", content: "Pipeline — Dev's CRM" },
      { property: "og:description", content: "Kanban and table views of every Foundrix lead." },
    ],
  }),
  component: PipelinePage,
});

export function promoteToClient(d: CrmData, lead: Lead): CrmData {
  if (d.clients.some((c) => c.leadId === lead.id)) return d;
  return {
    ...d,
    clients: [
      {
        id: uid(),
        leadId: lead.id,
        name: lead.name,
        business: lead.business,
        program: "The Grand Standard",
        startDate: today(),
        months: 3,
        paymentStatus: "Pending",
        amount: 25000,
        guaranteeActive: true,
        progress: [],
      },
      ...d.clients,
    ],
  };
}

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: (l: Lead) => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", lead.id)}
      onClick={() => onOpen(lead)}
      className="panel cursor-grab p-3 transition-colors hover:border-accent/50 active:cursor-grabbing"
    >
      <p className="text-sm text-foreground">{lead.name || "Untitled"}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {lead.business || "—"} · {lead.businessType}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Tag>{lead.source}</Tag>
        {lead.lastContacted && <Tag tone="muted">Last {lead.lastContacted}</Tag>}
      </div>
    </div>
  );
}

function PipelinePage() {
  const { data, update } = useStore();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fSource, setFSource] = useState("");
  const [fType, setFType] = useState("");
  const [sort, setSort] = useState("dateAdded");

  const leads = useMemo(() => {
    const list = data.leads.filter(
      (l) =>
        (!fStatus || l.status === fStatus) &&
        (!fSource || l.source === fSource) &&
        (!fType || l.businessType === fType) &&
        (!q ||
          `${l.name} ${l.business} ${l.email} ${l.handle} ${l.notes}`
            .toLowerCase()
            .includes(q.toLowerCase())),
    );
    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "lastContacted") return (b.lastContacted || "").localeCompare(a.lastContacted || "");
      if (sort === "status") return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
      return (b.dateAdded || "").localeCompare(a.dateAdded || "");
    });
  }, [data.leads, fStatus, fSource, fType, q, sort]);

  const move = (id: string, status: Status) => {
    update((d) => {
      const lead = d.leads.find((l) => l.id === id);
      if (!lead || lead.status === status) return d;
      const updated = { ...lead, status, lastContacted: today() };
      let next: CrmData = { ...d, leads: d.leads.map((l) => (l.id === id ? updated : l)) };
      if (status === "Won/Client") {
        next = promoteToClient(next, updated);
        toast.success(`${updated.name} moved to clients`);
      }
      return next;
    });
  };

  const remove = (id: string) => {
    update((d) => ({ ...d, leads: d.leads.filter((l) => l.id !== id) }));
    toast.success("Lead deleted");
    setEditing(null);
  };

  return (
    <AppShell
      title="Pipeline"
      subtitle={`${leads.length} of ${data.leads.length} leads`}
      actions={
        <>
          <div className="flex rounded-md border border-border p-0.5">
            {(["kanban", "table"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded px-3 py-1 text-xs capitalize transition-colors ${
                  view === v ? "bg-secondary text-foreground" : "text-muted-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Btn variant="accent" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> New lead
          </Btn>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-2 md:grid-cols-5">
        <TextInput placeholder="Search leads…" value={q} onChange={(e) => setQ(e.target.value)} />
        <SelectInput value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectInput>
        <SelectInput value={fSource} onChange={(e) => setFSource(e.target.value)}>
          <option value="">All sources</option>
          {SOURCES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectInput>
        <SelectInput value={fType} onChange={(e) => setFType(e.target.value)}>
          <option value="">All business types</option>
          {BUSINESS_TYPES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </SelectInput>
        <SelectInput value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="dateAdded">Sort: newest</option>
          <option value="lastContacted">Sort: last contacted</option>
          <option value="name">Sort: name</option>
          <option value="status">Sort: stage</option>
        </SelectInput>
      </div>

      {data.leads.length === 0 ? (
        <Empty>No leads yet — add your first one to start the pipeline.</Empty>
      ) : view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((s) => {
            const col = leads.filter((l) => l.status === s);
            return (
              <div
                key={s}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  move(e.dataTransfer.getData("text/plain"), s);
                }}
                className="flex w-64 shrink-0 flex-col gap-2 rounded-lg border border-border/70 bg-surface p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="label-xs">{s}</span>
                  <span className="text-xs text-muted-foreground">{col.length}</span>
                </div>
                {col.map((l) => (
                  <LeadCard key={l.id} lead={l} onOpen={setEditing} />
                ))}
                {col.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground/60">Drop here</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Name", "Business", "Type", "Source", "Status", "Last contacted", ""].map((h) => (
                  <th key={h} className="label-xs px-4 py-3 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr
                  key={l.id}
                  className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-secondary/50"
                  onClick={() => setEditing(l)}
                >
                  <td className="px-4 py-3 text-foreground">{l.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.business || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.businessType}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.source}</td>
                  <td className="px-4 py-3">
                    <SelectInput
                      value={l.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => move(l.id, e.target.value as Status)}
                      className="!w-auto !px-2 !py-1 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </SelectInput>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.lastContacted || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      aria-label="Delete lead"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(l.id);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New lead" wide>
        <LeadForm onDone={() => setAdding(false)} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit lead" wide>
        {editing && (
          <>
            <LeadForm lead={editing} onDone={() => setEditing(null)} />
            <div className="mt-4 border-t border-border pt-4">
              <Btn variant="danger" onClick={() => remove(editing.id)}>
                <Trash2 className="h-4 w-4" /> Delete lead
              </Btn>
            </div>
          </>
        )}
      </Modal>
    </AppShell>
  );
}
