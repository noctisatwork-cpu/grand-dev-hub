import { forwardRef } from "react";

export const Field = ({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <label className={`flex flex-col gap-1.5 ${className}`}>
    <span className="label-xs">{label}</span>
    {children}
  </label>
);

const base =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent focus:ring-1 focus:ring-ring";

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => <input ref={ref} className={`${base} ${className}`} {...props} />,
);
TextInput.displayName = "TextInput";

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea ref={ref} className={`${base} min-h-20 resize-y ${className}`} {...props} />
));
TextArea.displayName = "TextArea";

export const SelectInput = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className = "", ...props }, ref) => (
  <select ref={ref} className={`${base} ${className}`} {...props} />
));
SelectInput.displayName = "SelectInput";

export function Btn({
  variant = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "accent" | "ghost" | "danger";
}) {
  const variants = {
    default:
      "border border-border bg-card text-foreground hover:bg-secondary",
    accent: "border border-transparent bg-accent text-accent-foreground hover:opacity-90",
    ghost: "border border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
    danger: "border border-border text-destructive hover:bg-destructive/10",
  } as const;
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="panel p-5">
      <p className="label-xs">{label}</p>
      <p className="mt-3 font-display text-3xl leading-none text-foreground">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Tag({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" | "success" | "danger" }) {
  const tones = {
    muted: "border-border text-muted-foreground",
    accent: "border-accent/40 text-accent",
    success: "border-success/40 text-success",
    danger: "border-destructive/40 text-destructive",
  } as const;
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`panel my-10 w-full ${wide ? "max-w-3xl" : "max-w-lg"} p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl text-foreground">{title}</h2>
          <Btn variant="ghost" onClick={onClose} aria-label="Close">
            Esc
          </Btn>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel flex items-center justify-center px-6 py-14 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
