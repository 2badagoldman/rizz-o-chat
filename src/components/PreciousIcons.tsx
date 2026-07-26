/**
 * Animated "real material" icons: a molten gold medallion and a faceted
 * brilliant-cut diamond with moving fire/refraction.
 */

export function GoldMedallion({ className = '' }: { className?: string }) {
  return (
    <span className={`relative grid place-items-center ${className}`} aria-hidden>
      <span className="gold-surface absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,.8),inset_0_-3px_6px_rgba(120,72,0,.5),0_6px_18px_-6px_rgba(180,130,20,.7)]" />
      <span className="absolute inset-[14%] rounded-full bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,.95),rgba(255,236,170,.5)_35%,rgba(170,120,20,.35)_75%)]" />
      <svg viewBox="0 0 24 24" className="relative h-1/2 w-1/2 drop-shadow-[0_1px_0_rgba(255,255,255,.65)]">
        <defs>
          <linearGradient id="goldStar" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c4f07" />
            <stop offset="45%" stopColor="#c9971d" />
            <stop offset="100%" stopColor="#5e3a04" />
          </linearGradient>
        </defs>
        <path
          fill="url(#goldStar)"
          d="M12 2.6l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.1l6.1-.9z"
        />
      </svg>
      <span
        className="gold-glint pointer-events-none absolute right-[10%] top-[8%] h-2.5 w-2.5 bg-white"
        style={{ clipPath: 'polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)' }}
      />
      <span
        className="gold-glint pointer-events-none absolute bottom-[12%] left-[12%] h-2 w-2 bg-white"
        style={{
          animationDelay: '2.1s',
          clipPath: 'polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)',
        }}
      />
    </span>
  );
}

export function DiamondGem({ className = '' }: { className?: string }) {
  return (
    <span className={`gem-float relative grid place-items-center ${className}`} aria-hidden>
      <svg viewBox="0 0 64 64" className="h-full w-full drop-shadow-[0_6px_14px_rgba(56,189,248,.55)]">
        <defs>
          <linearGradient id="gemTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <linearGradient id="gemLeft" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#e9d5ff" />
          </linearGradient>
          <linearGradient id="gemRight" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0abfc" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>
          <linearGradient id="gemCore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".95" />
            <stop offset="60%" stopColor="#a5f3fc" stopOpacity=".75" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity=".9" />
          </linearGradient>
        </defs>
        {/* crown */}
        <polygon points="16,22 32,10 48,22" fill="url(#gemTop)" />
        <polygon points="4,22 16,22 22,10" fill="url(#gemLeft)" opacity=".9" />
        <polygon points="60,22 48,22 42,10" fill="url(#gemRight)" opacity=".9" />
        <polygon points="22,10 32,10 16,22" fill="#ffffff" opacity=".55" />
        <polygon points="42,10 32,10 48,22" fill="#e0f2fe" opacity=".7" />
        {/* pavilion */}
        <polygon points="4,22 60,22 32,58" fill="url(#gemCore)" />
        <polygon points="16,22 32,58 4,22" fill="#7dd3fc" opacity=".45" />
        <polygon points="48,22 32,58 60,22" fill="#f0abfc" opacity=".4" />
        <polygon points="32,22 32,58 16,22" fill="#ffffff" opacity=".3" />
        <path d="M4 22h56" stroke="#ffffff" strokeWidth="1.2" opacity=".85" />
      </svg>
      {/* internal fire sweeping through the stone */}
      <span className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="gem-fire absolute inset-y-0 left-0 w-full bg-[linear-gradient(100deg,transparent_35%,rgba(255,255,255,.95)_48%,rgba(186,230,253,.7)_54%,transparent_66%)] mix-blend-screen" />
      </span>
    </span>
  );
}
