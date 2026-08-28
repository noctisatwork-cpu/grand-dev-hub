import { useEffect, useRef, useState } from "react";

const PIN = "0710";
const KEY = "devs-crm-unlocked";

export function PinLock({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHydrated(true);
    if (sessionStorage.getItem(KEY) === "1") setUnlocked(true);
  }, []);

  useEffect(() => {
    if (hydrated && !unlocked) inputRef.current?.focus();
  }, [hydrated, unlocked]);

  useEffect(() => {
    if (value.length === 4) {
      if (value === PIN) {
        sessionStorage.setItem(KEY, "1");
        setUnlocked(true);
      } else {
        setError(true);
        setTimeout(() => {
          setValue("");
          setError(false);
        }, 500);
      }
    }
  }, [value]);

  if (!hydrated) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-xs text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Foundrix</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-foreground">Dev&apos;s CRM</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enter your 4-digit PIN</p>

        <div
          className="relative mt-10 flex justify-center gap-3"
          onClick={() => inputRef.current?.focus()}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-14 w-12 rounded-md border transition-colors ${
                error
                  ? "border-destructive"
                  : value.length === i
                    ? "border-accent"
                    : "border-border"
              } flex items-center justify-center bg-card text-2xl text-foreground`}
            >
              {value[i] ? "•" : ""}
            </div>
          ))}
          <input
            ref={inputRef}
            value={value}
            inputMode="numeric"
            autoComplete="off"
            aria-label="PIN"
            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="absolute inset-0 h-full w-full cursor-default opacity-0"
          />
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          {error ? "Incorrect PIN" : "Private workspace — single user access"}
        </p>
      </div>
    </div>
  );
}
