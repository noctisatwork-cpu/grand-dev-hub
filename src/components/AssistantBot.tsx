import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Btn, TextInput } from "./ui-kit";
import { askAssistant } from "@/lib/assistant.functions";
import { useStore } from "@/lib/store";
import {
  BUSINESS_TYPES,
  PAYMENT_STATUSES,
  PLATFORMS,
  PROGRAMS,
  SOURCES,
  STATUSES,
  today,
  uid,
  type BusinessType,
  type Client,
  type ContentEntry,
  type CrmData,
  type Lead,
  type PaymentStatus,
  type Platform,
  type Program,
  type Source,
  type Status,
  type Task,
} from "@/lib/crm-types";

type Msg = { role: "user" | "bot"; text: string };

type Action = Record<string, unknown> & { type?: string };

function pick<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return list.includes(value as T) ? (value as T) : fallback;
}
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown, fb: number) => (typeof v === "number" && !Number.isNaN(v) ? v : fb);
const date = (v: unknown) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? String(v) : today());

function applyAction(d: CrmData, a: Action): { data: CrmData; label: string | null } {
  switch (a["type"]) {
    case "add_lead": {
      const lead: Lead = {
        id: uid(),
        name: str(a["name"]) || "Untitled",
        business: str(a["business"]),
        businessType: pick<BusinessType>(BUSINESS_TYPES, a["businessType"], "Agency"),
        email: str(a["email"]),
        phone: str(a["phone"]),
        handle: str(a["handle"]),
        source: pick<Source>(SOURCES, a["source"], "Other"),
        status: pick<Status>(STATUSES, a["status"], "New Lead"),
        notes: str(a["notes"]),
        dateAdded: today(),
        lastContacted: "",
      };
      return { data: { ...d, leads: [lead, ...d.leads] }, label: `Lead: ${lead.name}` };
    }
    case "add_client": {
      const client: Client = {
        id: uid(),
        name: str(a["name"]) || "Untitled",
        business: str(a["business"]),
        program: pick<Program>(PROGRAMS, a["program"], "The Grand Standard"),
        startDate: date(a["startDate"]),
        months: num(a["months"], 3),
        paymentStatus: pick<PaymentStatus>(PAYMENT_STATUSES, a["paymentStatus"], "Pending"),
        amount: num(a["amount"], 25000),
        guaranteeActive: a["guaranteeActive"] !== false,
        progress: [],
      };
      return { data: { ...d, clients: [client, ...d.clients] }, label: `Client: ${client.name}` };
    }
    case "add_task": {
      const task: Task = {
        id: uid(),
        title: str(a["title"]) || "Follow up",
        dueDate: date(a["dueDate"]),
        done: false,
      };
      return { data: { ...d, tasks: [task, ...d.tasks] }, label: `Task: ${task.title}` };
    }
    case "add_content": {
      const entry: ContentEntry = {
        id: uid(),
        kind: a["kind"] === "Partnership" ? "Partnership" : "Content",
        platform: pick<Platform>(PLATFORMS, a["platform"], "Other"),
        date: date(a["date"]),
        topic: str(a["topic"]),
        link: str(a["link"]),
        notes: str(a["notes"]),
      };
      return { data: { ...d, content: [entry, ...d.content] }, label: `${entry.kind}: ${entry.topic || entry.platform}` };
    }
    case "update_lead_status": {
      const name = str(a["name"]).toLowerCase();
      const status = pick<Status>(STATUSES, a["status"], "Contacted");
      let hit = false;
      const leads = d.leads.map((l) => {
        if (!hit && l.name.toLowerCase().includes(name) && name) {
          hit = true;
          return { ...l, status, lastContacted: today() };
        }
        return l;
      });
      return { data: { ...d, leads }, label: hit ? `${str(a["name"])} → ${status}` : null };
    }
    default:
      return { data: d, label: null };
  }
}

function parse(raw: string): { reply: string; actions: Action[] } {
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const j = JSON.parse(cleaned) as { reply?: string; actions?: Action[] };
    return { reply: j.reply ?? "Done.", actions: Array.isArray(j.actions) ? j.actions : [] };
  } catch {
    return { reply: cleaned || "I couldn't understand that — try rephrasing.", actions: [] };
  }
}

export function AssistantBot() {
  const { data, update } = useStore();
  const ask = useServerFn(askAssistant);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "bot", text: "Tell me what to add — leads, clients, follow-ups or content. e.g. “Add Riya from PixelForge, an agency from Instagram DM, and remind me to call her Friday.”" },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const res = await ask({
        data: {
          message: text,
          context: `${data.leads.length} leads, ${data.clients.length} clients, ${data.tasks.length} tasks. Recent lead names: ${data.leads.slice(0, 15).map((l) => l.name).join(", ")}`,
        },
      });
      const { reply, actions } = parse(res.raw);
      const labels: string[] = [];
      if (actions.length) {
        let preview = data;
        for (const a of actions) {
          const out = applyAction(preview, a);
          preview = out.data;
          if (out.label) labels.push(out.label);
        }
        update((d) => {
          let next = d;
          for (const a of actions) next = applyAction(next, a).data;
          return next;
        });
        if (labels.length) toast.success(`Added ${labels.length} record${labels.length > 1 ? "s" : ""}`);
      }

      setMsgs((m) => [...m, { role: "bot", text: labels.length ? `${reply}\n• ${labels.join("\n• ")}` : reply }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "bot", text: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open AI assistant"
          className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105"
        >
          <Bot className="h-5 w-5" />
        </button>
      )}

      {open && (
        <div className="panel fixed bottom-5 right-5 z-40 flex h-[70vh] max-h-[560px] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-accent" />
              <span className="text-sm text-foreground">CRM Assistant</span>
            </div>
            <button aria-label="Close assistant" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground"
                    : "max-w-[95%] whitespace-pre-wrap text-sm text-foreground"
                }
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </p>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex gap-2 border-t border-border p-3">
            <TextInput
              value={input}
              placeholder="Add a lead, task, client…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
            />
            <Btn variant="accent" onClick={() => void send()} disabled={busy} aria-label="Send">
              <Send className="h-4 w-4" />
            </Btn>
          </div>
        </div>
      )}
    </>
  );
}
