/**
 * Shared "Diamond VIP" prism system.
 *
 * These primitives lift the facet / caustic / twinkle language from the
 * Diamond VIP card so every surface in the app — headers, cards, modals,
 * sheets and empty states — carries the same high-end refraction feel.
 * Everything is decorative (pointer-events: none) and reduced-motion safe.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

const FACETS = [
  { top: "12%", left: "8%", size: 10, delay: "0s", dur: "3.4s" },
  { top: "24%", left: "78%", size: 14, delay: "0.7s", dur: "4.1s" },
  { top: "62%", left: "18%", size: 8, delay: "1.5s", dur: "3.8s" },
  { top: "74%", left: "62%", size: 12, delay: "2.1s", dur: "4.6s" },
  { top: "42%", left: "46%", size: 7, delay: "2.9s", dur: "3.2s" },
  { top: "86%", left: "88%", size: 9, delay: "1.1s", dur: "5.1s" },
];

/** Twinkling diamond facets scattered over the parent surface. */
export function PrismSparkles({
  count = FACETS.length,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {FACETS.slice(0, count).map((f, i) => (
        <svg
          key={i}
          className="twinkle absolute text-primary/60"
          style={{
            top: f.top,
            left: f.left,
            width: f.size,
            height: f.size,
            animationDelay: f.delay,
            animationDuration: f.dur,
          }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 0 L14.4 9.6 L24 12 L14.4 14.4 L12 24 L9.6 14.4 L0 12 L9.6 9.6 Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}

/** Drifting refracted caustics — soft coloured light pooling on a surface. */
export function PrismCaustics({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="caustic absolute -left-1/4 -top-1/3 h-[160%] w-[80%] rounded-full bg-primary/25 blur-3xl"
        style={{ animationDuration: "14s" }}
      />
      <div
        className="caustic absolute -right-1/4 top-1/4 h-[140%] w-[70%] rounded-full bg-accent/25 blur-3xl"
        style={{ animationDuration: "18s", animationDirection: "reverse" }}
      />
    </div>
  );
}

/** Holographic sheet that slowly pans its hue across the surface. */
export function PrismSheen({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "prism-shift pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(115deg, transparent 12%, rgba(255,255,255,0.55) 26%, rgba(255,190,230,0.5) 40%, rgba(180,220,255,0.5) 54%, transparent 72%)",
      }}
    />
  );
}

/**
 * A full prism surface: rotating facet ring + caustics + sheen + sparkles.
 * Drop inside any `relative` container.
 */
export function PrismLayer({
  ring = true,
  sparkles = true,
  caustics = true,
  sheen = true,
  className,
}: {
  ring?: boolean;
  sparkles?: boolean;
  caustics?: boolean;
  sheen?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)}>
      {ring && <span className="prism-ring" />}
      {caustics && <PrismCaustics />}
      {sheen && <PrismSheen />}
      {sparkles && <PrismSparkles />}
    </div>
  );
}

/** Prism-dressed panel — the standard section container across the app. */
export function PrismPanel({
  className,
  children,
  intensity = "soft",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { intensity?: "soft" | "full" }) {
  return (
    <div className={cn("glass-card prism-surface relative overflow-hidden", className)} {...props}>
      <PrismLayer ring={intensity === "full"} sparkles caustics sheen={intensity === "full"} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/** Section header with eyebrow + prism-lit title, shared by every page. */
export function PrismHeader({
  eyebrow,
  title,
  subtitle,
  action,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative mb-4 overflow-hidden rounded-[1.5rem]", className)}>
      <PrismLayer ring={false} sparkles caustics sheen={false} className="opacity-70" />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          {eyebrow ? <span className="eyebrow mb-2">{eyebrow}</span> : null}
          <h1 className="font-display text-2xl font-bold tracking-tight text-gradient-brand">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
    </div>
  );
}

/** Shared empty state — prism lit so blank screens still feel premium. */
export function PrismEmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass-card prism-surface relative overflow-hidden px-6 py-12 text-center",
        className,
      )}
    >
      <PrismLayer ring sparkles caustics sheen />
      <div className="relative z-10 flex flex-col items-center gap-3">
        {icon ? (
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow"
            style={{ animation: "float-soft 5s ease-in-out infinite" }}
          >
            {icon}
          </div>
        ) : null}
        <h3 className="font-display text-lg font-bold tracking-tight">{title}</h3>
        {description ? (
          <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
        ) : null}
        {action}
      </div>
    </div>
  );
}
