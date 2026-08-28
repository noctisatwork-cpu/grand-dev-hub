import { useEffect, useRef, useState } from "react";
import {
  BUSINESS_TYPES,
  SOURCES,
  STATUSES,
  today,
  uid,
  type Lead,
} from "@/lib/crm-types";
import { useStore } from "@/lib/store";
import { Btn, Field, SelectInput, TextArea, TextInput } from "./ui-kit";
import { toast } from "sonner";

function blank(): Lead {
  return {
    id: uid(),
    name: "",
    business: "",
    businessType: "Agency",
    email: "",
    phone: "",
    handle: "",
    source: "Instagram DM",
    status: "New Lead",
    notes: "",
    dateAdded: today(),
    lastContacted: today(),
  };
}

export function LeadForm({ lead, onDone }: { lead?: Lead; onDone: () => void }) {
  const { data, update } = useStore();
  const [form, setForm] = useState<Lead>(lead ?? blank());
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
  }, []);

  const set = <K extends keyof Lead>(k: K, v: Lead[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    update((d) => ({
      ...d,
      leads: lead ? d.leads.map((l) => (l.id === form.id ? form : l)) : [form, ...d.leads],
    }));
    toast.success(lead ? "Lead updated" : "Lead added");
    onDone();
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
      }}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      <Field label="Name">
        <TextInput ref={first} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
      </Field>
      <Field label="Business name">
        <TextInput value={form.business} onChange={(e) => set("business", e.target.value)} placeholder="Company" />
      </Field>
      <Field label="Business type">
        <SelectInput value={form.businessType} onChange={(e) => set("businessType", e.target.value as Lead["businessType"])}>
          {BUSINESS_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Source">
        <SelectInput value={form.source} onChange={(e) => set("source", e.target.value as Lead["source"])}>
          {SOURCES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Email">
        <TextInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
      </Field>
      <Field label="Phone">
        <TextInput value={form.phone} onChange={(e) => set("phone", e.target.value)} />
      </Field>
      <Field label="Instagram / LinkedIn handle">
        <TextInput value={form.handle} onChange={(e) => set("handle", e.target.value)} placeholder="@handle" />
      </Field>
      <Field label="Status">
        <SelectInput value={form.status} onChange={(e) => set("status", e.target.value as Lead["status"])}>
          {STATUSES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Date added">
        <TextInput type="date" value={form.dateAdded} onChange={(e) => set("dateAdded", e.target.value)} />
      </Field>
      <Field label="Last contacted">
        <TextInput type="date" value={form.lastContacted} onChange={(e) => set("lastContacted", e.target.value)} />
      </Field>
      <Field label="Attributed to content / partnership" className="sm:col-span-2">
        <SelectInput value={form.contentId ?? ""} onChange={(e) => set("contentId", e.target.value || undefined)}>
          <option value="">None</option>
          {data.content.map((c) => (
            <option key={c.id} value={c.id}>
              {c.date} · {c.platform} · {c.topic || c.kind}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Notes" className="sm:col-span-2">
        <TextArea value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </Field>

      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <p className="text-xs text-muted-foreground">⌘/Ctrl + Enter to save</p>
        <div className="flex gap-2">
          <Btn type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Btn>
          <Btn type="submit" variant="accent">
            {lead ? "Save changes" : "Add lead"}
          </Btn>
        </div>
      </div>
    </form>
  );
}
