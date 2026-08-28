import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { loadCrmData, saveCrmData } from "./drive.functions";
import { emptyData, type CrmData } from "./crm-types";

const CACHE_KEY = "devs-crm-cache-v1";

type SyncState = "idle" | "loading" | "saving" | "saved" | "offline" | "error";

interface Ctx {
  data: CrmData;
  update: (fn: (d: CrmData) => CrmData) => void;
  sync: SyncState;
  syncMessage: string | null;
  lastSavedAt: string | null;
  reload: () => void;
}

const StoreContext = createContext<Ctx | null>(null);

function normalize(raw: unknown): CrmData {
  const d = (raw ?? {}) as Partial<CrmData>;
  return {
    leads: Array.isArray(d.leads) ? d.leads : [],
    clients: Array.isArray(d.clients) ? d.clients : [],
    tasks: Array.isArray(d.tasks) ? d.tasks : [],
    content: Array.isArray(d.content) ? d.content : [],
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CrmData>(emptyData);
  const [sync, setSync] = useState<SyncState>("loading");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const load = useServerFn(loadCrmData);
  const save = useServerFn(saveCrmData);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const ready = useRef(false);

  const reload = useCallback(() => {
    setSync("loading");
    load({})
      .then((res) => {
        if (res.json) {
          try {
            setData(normalize(JSON.parse(res.json)));
          } catch {
            /* ignore */
          }
        }
        if (!res.connected) {
          setSync("offline");
          setSyncMessage(res.error ?? "Working locally");
        } else {
          setSync("idle");
          setSyncMessage(null);
        }
        ready.current = true;
      })
      .catch((e: Error) => {
        setSync("offline");
        setSyncMessage(e.message);
        ready.current = true;
      });
  }, [load]);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) setData(normalize(JSON.parse(cached)));
    } catch {
      /* ignore */
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flush = useCallback(
    (next: CrmData) => {
      setSync("saving");
      save({ data: { json: JSON.stringify(next) } })
        .then((res) => {
          dirty.current = false;
          setSync("saved");
          setLastSavedAt(res.savedAt);
          setSyncMessage(null);
        })
        .catch((e: Error) => {
          setSync("error");
          setSyncMessage(e.message);
        });
    },
    [save],
  );

  const update = useCallback(
    (fn: (d: CrmData) => CrmData) => {
      setData((prev) => {
        const next = fn(prev);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        dirty.current = true;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => flush(next), 800);
        return next;
      });
    },
    [flush],
  );

  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  return (
    <StoreContext.Provider value={{ data, update, sync, syncMessage, lastSavedAt, reload }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
