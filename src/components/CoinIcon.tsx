type Variant = 'gold' | 'diamond';

const SPARKS = [
  { top: '-6%', left: '78%', size: 10, delay: '0s' },
  { top: '68%', left: '-8%', size: 8, delay: '0.7s' },
  { top: '82%', left: '70%', size: 9, delay: '1.4s' },
  { top: '18%', left: '-10%', size: 7, delay: '2s' },
];

const STAR = 'polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)';

/** Animated 3D-ish coin: gold or diamond, with orbiting sparks and a pulsing halo. */
export function CoinIcon({
  variant = 'gold',
  size = 48,
  label,
}: {
  variant?: Variant;
  size?: number;
  label?: string;
}) {
  const diamond = variant === 'diamond';
  const face = diamond
    ? 'bg-[conic-gradient(from_210deg,#e0f2fe,#ffffff,#bae6fd,#f5d0fe,#ffffff,#e0f2fe)]'
    : 'bg-[conic-gradient(from_210deg,#b45309,#fcd34d,#fffbeb,#f59e0b,#fde68a,#b45309)]';
  const rim = diamond ? 'ring-sky-200/90' : 'ring-amber-300/90';
  const halo = diamond ? 'bg-sky-300/45' : 'bg-amber-300/45';
  const inner = diamond ? 'text-sky-600' : 'text-amber-800';

  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      aria-label={label}
      role={label ? 'img' : undefined}
    >
      {/* pulsing halo rings */}
      <span aria-hidden className={`ring-pulse absolute inset-0 rounded-full ${halo} blur-[6px]`} />
      <span
        aria-hidden
        className={`ring-pulse absolute inset-0 rounded-full border ${diamond ? 'border-sky-300/70' : 'border-amber-300/70'}`}
        style={{ animationDelay: '1.3s' }}
      />

      {/* coin body */}
      <span className="coin-bob relative grid h-full w-full place-items-center" style={{ perspective: 600 }}>
        <span className={`coin-flip relative grid h-full w-full place-items-center rounded-full ${face} shadow-lg ring-2 ${rim}`}>
          {/* engraved inner disc */}
          <span
            className={`grid place-items-center rounded-full ${diamond ? 'bg-white/70' : 'bg-amber-200/70'} shadow-inner`}
            style={{ width: size * 0.62, height: size * 0.62 }}
          >
            {diamond ? (
              <svg viewBox="0 0 24 24" className={`h-1/2 w-1/2 ${inner}`} fill="currentColor" aria-hidden>
                <path d="M6 3h12l4 6-10 12L2 9l4-6z" opacity=".9" />
              </svg>
            ) : (
              <span className={`font-black leading-none ${inner}`} style={{ fontSize: size * 0.3 }}>
                R
              </span>
            )}
          </span>
          {/* specular sweep across the face */}
          <span
            aria-hidden
            className="gold-sweep pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,.95)_48%,transparent_62%)]"
          />
        </span>
      </span>

      {/* sparks */}
      {SPARKS.map((s) => (
        <span
          key={`${s.top}${s.left}`}
          aria-hidden
          className={`spark pointer-events-none absolute ${diamond ? 'bg-sky-100' : 'bg-amber-100'}`}
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            clipPath: STAR,
            filter: 'drop-shadow(0 0 4px rgba(255,255,255,.9))',
          }}
        />
      ))}
    </span>
  );
}
