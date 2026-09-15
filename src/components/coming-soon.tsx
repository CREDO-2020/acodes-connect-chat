import type { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  points,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <div className="surface-panel mx-auto mt-8 max-w-2xl p-8 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-6" />
      </span>
      <h2 className="mt-5 font-display text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm text-muted-foreground">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
            {point}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted-foreground">
        Landing in an upcoming Acodes release.
      </p>
    </div>
  );
}
