import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { signAvatars } from "@/lib/avatars.functions";

/** True when the value is already renderable (absolute URL / data / blob / public path). */
export function isDirectSrc(src?: string | null) {
  return !!src && /^(https?:|data:|blob:|\/)/i.test(src);
}

const cache = new Map<string, string>();
let queue = new Set<string>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const waiters = new Set<() => void>();
type Signer = (opts: { data: { paths: string[] } }) => Promise<Record<string, string>>;
let signer: Signer | null = null;

async function flush() {
  flushTimer = null;
  const paths = Array.from(queue);
  queue = new Set();
  if (!paths.length || !signer) return;
  // Signing requires an authenticated session; signed-out visitors just get fallbacks.
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    for (const w of Array.from(waiters)) w();
    return;
  }
  signer({ data: { paths } })
    .then((map) => {
      for (const [k, v] of Object.entries(map ?? {})) cache.set(k, v);
    })
    .catch(() => {})
    .finally(() => {
      for (const w of Array.from(waiters)) w();
    });
}

/** Resolves a `profiles.avatar_url` (storage path OR url) into something an <img> can render. */
export function useAvatarSrc(src?: string | null): string | null {
  const sign = useServerFn(signAvatars) as unknown as Signer;
  const [resolved, setResolved] = useState<string | null>(() =>
    !src ? null : isDirectSrc(src) ? src : (cache.get(src) ?? null),
  );

  useEffect(() => {
    if (!src) return setResolved(null);
    if (isDirectSrc(src)) return setResolved(src);
    const hit = cache.get(src);
    if (hit) return setResolved(hit);

    signer = sign;
    setResolved(null);
    let alive = true;
    const onDone = () => {
      const url = cache.get(src);
      if (alive && url) setResolved(url);
    };
    waiters.add(onDone);
    queue.add(src);
    if (!flushTimer) flushTimer = setTimeout(() => { void flush(); }, 30);
    return () => {
      alive = false;
      waiters.delete(onDone);
    };
  }, [src, sign]);

  return resolved;
}

type AvatarImgProps = {
  src?: string | null;
  name?: string | null;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
  eager?: boolean;
  /** Rendered instead of the initial when the avatar is missing or fails to load. */
  fallbackSrc?: string | null;
};

/** Round avatar that transparently signs private storage paths and falls back to an initial. */
export function AvatarImg({ src, name, className = "", fallbackClassName = "", alt, eager, fallbackSrc }: AvatarImgProps) {
  const resolved = useAvatarSrc(src);
  const [broken, setBroken] = useState(false);
  const [fallbackBroken, setFallbackBroken] = useState(false);
  useEffect(() => setBroken(false), [resolved]);
  useEffect(() => setFallbackBroken(false), [fallbackSrc]);

  const missing = !resolved || broken;

  if (missing && fallbackSrc && !fallbackBroken) {
    return (
      <img
        src={fallbackSrc}
        alt={alt ?? name ?? ""}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFallbackBroken(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  if (missing) {
    return (
      <span
        aria-label={alt ?? name ?? "Avatar"}
        className={`grid place-items-center bg-muted text-sm font-bold text-muted-foreground ${className} ${fallbackClassName}`}
      >
        {(name ?? "?").trim().slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt ?? name ?? ""}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setBroken(true)}
      className={`object-cover ${className}`}
    />
  );
}

