import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Btn, Empty, Field, Modal, SelectInput, Tag, TextArea, TextInput } from "@/components/ui-kit";
import { useStore } from "@/lib/store";
import { PLATFORMS, today, uid, type ContentEntry } from "@/lib/crm-types";
import { toast } from "sonner";

export const Route = createFileRoute("/content")({
  head: () => ({
    meta: [
      { title: "Content & Outreach — Dev's CRM" },
      {
        name: "description",
        content: "Log posts across Instagram, LinkedIn, X and Substack plus Discord partnership outreach.",
      },
      { property: "og:title", content: "Content & Outreach — Dev's CRM" },
      { property: "og:description", content: "Content and partnership log with lead attribution." },
    ],
  }),
  component: ContentPage,
});

function blank(): ContentEntry {
  return { id: uid(), kind: "Content", platform: "Instagram", date: today(), topic: "", link: "", notes: "" };
}

function ContentPage() {
  const { data, update } = useStore();
  const [editing, setEditing] = useState<ContentEntry | null>(null);
  const [tab, setTab] = useState<"Content" | "Partnership">("Content");

  const rows = data.content.filter((c) => c.kind === tab);

  const save = (entry: ContentEntry) => {
    update((d) => ({
      ...d,
      content: d.content.some((c) => c.id === entry.id)
        ? d.content.map((c) => (c.id === entry.id ? entry : c))
        : [entry, ...d.content],
    }));
    setEditing(null);
    toast.success("Entry saved");
  };

  const remove = (id: string) => {
    update((d) => ({
      ...d,
      content: d.content.filter((c) => c.id !== id),
      leads: d.leads.map((l) => (l.contentId === id ? { ...l, contentId: undefined } : l)),
    }));
    setEditing(null);
  };

  return (
    <AppShell
      title="Content & Outreach"
      subtitle="Everything you publish and every partnership you pitch"
      actions={
        <Btn variant="accent" onClick={() => setEditing({ ...blank(), kind: tab })}>
          <Plus className="h-4 w-4" /> New entry
        </Btn>
      }
    >
      <div className="mb-5 flex w-fit rounded-md border border-border p-0.5">
        {(["Content", "Partnership"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1 text-xs transition-colors ${
              tab === t ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            {t === "Content" ? "Content log" : "Partnerships"}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty>Nothing logged here yet.</Empty>
      ) : (
        <div className="panel divide-y divide-border">
          {rows.map((c) => {
            const attributed = data.leads.filter((l) => l.contentId === c.id);
            return (
              <button
                key={c.id}
                onClick={() => setEditing(c)}
                className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50"
              >
                <span className="w-24 font-mono text-xs text-muted-foreground">{c.date}</span>
                <Tag>{c.platform}</Tag>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{c.topic || "Untitled"}</span>
                {attributed.length > 0 && <Tag tone="accent">{attributed.length} leads</Tag>}
                {c.link && (
                  <span
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    <a href={c.link} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Log entry">
        {editing && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type">
              <SelectInput
                value={editing.kind}
                onChange={(e) => setEditing({ ...editing, kind: e.target.value as ContentEntry["kind"] })}
              >
                <option>Content</option>
                <option>Partnership</option>
              </SelectInput>
            </Field>
            <Field label="Platform">
              <SelectInput
                value={editing.platform}
                onChange={(e) => setEditing({ ...editing, platform: e.target.value as ContentEntry["platform"] })}
              >
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Date">
              <TextInput
                type="date"
                value={editing.date}
                onChange={(e) => setEditing({ ...editing, date: e.target.value })}
              />
            </Field>
            <Field label="Topic">
              <TextInput
                value={editing.topic}
                onChange={(e) => setEditing({ ...editing, topic: e.target.value })}
              />
            </Field>
            <Field label="Link" className="sm:col-span-2">
              <TextInput
                value={editing.link}
                onChange={(e) => setEditing({ ...editing, link: e.target.value })}
                placeholder="https://"
              />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <TextArea
                value={editing.notes}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              />
            </Field>
            <div className="flex justify-between sm:col-span-2">
              {data.content.some((c) => c.id === editing.id) ? (
                <Btn variant="danger" onClick={() => remove(editing.id)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Btn>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Btn variant="ghost" onClick={() => setEditing(null)}>
                  Cancel
                </Btn>
                <Btn variant="accent" onClick={() => save(editing)}>
                  Save
                </Btn>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
