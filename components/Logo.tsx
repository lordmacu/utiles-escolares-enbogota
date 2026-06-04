import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

/** Marca de monograma: squircle con "ue" + acento ámbar. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label={SITE_NAME}>
      <defs>
        <linearGradient id="ue-mark" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#ue-mark)" />
      <text
        x="20"
        y="27.5"
        textAnchor="middle"
        className="font-display"
        fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, sans-serif"
        fontWeight="800"
        fontSize="21"
        letterSpacing="-1.2"
        fill="#ffffff"
      >
        ue
      </text>
      <rect x="13" y="30.5" width="14" height="2.6" rx="1.3" fill="#fbbf24" />
    </svg>
  );
}

/** Logo completo: monograma + wordmark. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label={`${SITE_NAME} — inicio`} className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-9 w-9 shrink-0" />
      <span className="font-display text-[1.15rem] font-extrabold leading-none tracking-tight text-[var(--color-ink)]">
        Útiles<span className="text-[var(--color-primary)]">Escolares</span>
      </span>
    </Link>
  );
}
