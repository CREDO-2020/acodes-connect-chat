import { cn } from "@/lib/utils";

export function AcodesMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex size-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 18 10 5l6 13" />
        <path d="M6.5 14h7" />
        <path d="M18.5 11v7" />
      </svg>
      <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-accent ring-2 ring-background" />
    </span>
  );
}

export function AcodesWordmark({
  className,
  showMark = true,
}: {
  className?: string;
  showMark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showMark ? <AcodesMark /> : null}
      <span className="font-display text-lg font-semibold tracking-tight">
        Acodes
      </span>
    </span>
  );
}
