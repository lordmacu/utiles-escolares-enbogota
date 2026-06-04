"use client";

import Link from "next/link";
import { useRef } from "react";
import { ProductCard } from "@/components/ProductCard";

interface CardProducto {
  nombre: string;
  slug: string;
  marca?: string;
  precio: number;
  precioAnterior: number | null;
  imagen: string;
  categoria: string;
  popular?: boolean;
}

/** Fila de productos con scroll horizontal y flechas (estilo tienda). */
export function ProductCarousel({
  titulo,
  productos,
  verTodoHref,
  eyebrow,
}: {
  titulo: string;
  productos: CardProducto[];
  verTodoHref?: string;
  eyebrow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function scroll(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.9, 800), behavior: "smooth" });
  }

  if (productos.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <h2 className="font-display text-xl font-extrabold text-[var(--color-ink)] sm:text-2xl">{titulo}</h2>
        </div>
        <div className="flex items-center gap-2">
          {verTodoHref && (
            <Link href={verTodoHref} className="hidden text-sm font-semibold text-[var(--color-primary)] hover:underline sm:block">
              Ver todo →
            </Link>
          )}
          <div className="hidden gap-1.5 sm:flex">
            <button type="button" onClick={() => scroll(-1)} aria-label="Anterior" className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-line)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label="Siguiente" className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-line)] text-[var(--color-ink)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={ref}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 sm:mx-0 sm:px-0 sm:scroll-px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {productos.map((p) => (
          <div key={p.slug} className="w-[44vw] shrink-0 snap-start sm:w-56 lg:w-60">
            <ProductCard producto={p} />
          </div>
        ))}
        {verTodoHref && (
          <Link
            href={verTodoHref}
            className="grid w-[44vw] shrink-0 snap-start place-items-center rounded-2xl border border-dashed border-[var(--color-line)] text-sm font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] sm:w-56 lg:w-60"
          >
            <span className="flex flex-col items-center gap-2 p-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-primary-soft)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </span>
              Ver todo
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
