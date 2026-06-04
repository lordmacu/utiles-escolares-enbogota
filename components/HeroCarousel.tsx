"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export interface Slide {
  eyebrow: string;
  titulo: string;
  subtitulo: string;
  cta: string;
  href: string;
  imagen: string;
  /** Clases tailwind del fondo (gradiente). */
  bg: string;
  /** Color del texto principal. */
  texto?: "light" | "dark";
}

const INTERVALO = 5500;

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [pausado, setPausado] = useState(false);
  const touchX = useRef<number | null>(null);
  const n = slides.length;

  const go = useCallback((idx: number) => setI(((idx % n) + n) % n), [n]);
  const next = useCallback(() => setI((p) => (p + 1) % n), [n]);
  const prev = useCallback(() => setI((p) => (p - 1 + n) % n), [n]);

  useEffect(() => {
    if (pausado || n <= 1) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(next, INTERVALO);
    return () => clearInterval(t);
  }, [pausado, next, n]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
        touchX.current = null;
      }}
      aria-roledescription="carrusel"
    >
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, idx) => (
          <div
            key={idx}
            className={`relative flex w-full shrink-0 items-center overflow-hidden ${s.bg}`}
            aria-hidden={idx !== i}
          >
            <div className="absolute -right-10 -top-16 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-black/5 blur-2xl" />
            <div className="relative z-10 grid w-full grid-cols-1 items-center gap-4 px-6 py-10 sm:px-10 md:grid-cols-2 md:py-14 lg:px-14">
              <div className={s.texto === "dark" ? "text-[var(--color-ink)]" : "text-white"}>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] opacity-80">{s.eyebrow}</p>
                <h2 className="font-display text-2xl font-extrabold leading-tight text-balance sm:text-4xl lg:text-[2.75rem]">
                  {s.titulo}
                </h2>
                <p className="mt-3 max-w-md text-sm opacity-90 sm:text-base">{s.subtitulo}</p>
                <Link
                  href={s.href}
                  className={`mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition-transform hover:-translate-y-0.5 ${
                    s.texto === "dark" ? "bg-[var(--color-ink)] text-white" : "bg-white text-[var(--color-primary)]"
                  }`}
                >
                  {s.cta}
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div className="relative hidden h-44 md:block md:h-56 lg:h-64">
                {s.imagen && (
                  <>
                    <div className="absolute right-4 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-white/85 md:h-52 md:w-52 lg:h-60 lg:w-60" />
                    <Image
                      src={s.imagen}
                      alt={s.titulo}
                      fill
                      priority={idx === 0}
                      className="object-contain p-4"
                      sizes="(max-width: 768px) 0px, 40vw"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-[var(--color-ink)] shadow-md backdrop-blur transition-colors hover:bg-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Siguiente"
            className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-[var(--color-ink)] shadow-md backdrop-blur transition-colors hover:bg-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => go(idx)}
                aria-label={`Ir al banner ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
