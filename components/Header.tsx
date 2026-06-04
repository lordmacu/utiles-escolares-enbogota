"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useCart } from "@/lib/cart";
import { CATEGORIAS } from "@/lib/categorias";

function SearchForm({ className = "", autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  return (
    <form action="/productos" role="search" className={`relative flex w-full ${className}`}>
      <input
        type="search"
        name="q"
        autoFocus={autoFocus}
        placeholder="Encuentra cuadernos, esferos, morrales…"
        aria-label="Buscar productos"
        className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] py-2.5 pl-5 pr-12 text-[var(--color-ink)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-[var(--color-primary)] text-white transition-colors hover:bg-[var(--color-primary-dark)]"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </button>
    </form>
  );
}

type NavSubs = Record<string, { nombre: string; slug: string }[]>;

export function Header({ navSubs = {} }: { navSubs?: NavSubs }) {
  const { count, openCart, ready } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);

  return (
    <header>
      {/* Barra utilitaria (no sticky) */}
      <div className="bg-[var(--color-primary)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 text-xs sm:px-6 lg:px-8">
          <p className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
            Entrega a domicilio en <strong className="font-semibold">Bogotá</strong>
          </p>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Pide fácil por WhatsApp</span>
            <Link href="/categorias" className="font-semibold underline-offset-2 hover:underline">Ver categorías</Link>
          </div>
        </div>
      </div>

      {/* Barra superior + categorías (sticky) */}
      <div className="sticky top-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur">
      {/* Barra superior */}
      <div className="border-b border-[var(--color-line)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />
          <SearchForm className="mx-2 hidden max-w-xl flex-1 md:flex" />
          <div className="ml-auto flex items-center gap-1.5">
            <Link href="/ofertas" className="hidden rounded-full px-3 py-2 text-sm font-bold text-[var(--color-accent-dark)] hover:text-[var(--color-accent)] lg:block">
              Ofertas
            </Link>
            <Link href="/categorias" className="hidden rounded-full px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:text-[var(--color-primary)] lg:block">
              Categorías
            </Link>
            <button
              type="button"
              onClick={openCart}
              aria-label="Abrir carrito"
              className="relative rounded-full p-2.5 text-[var(--color-ink)] transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {ready && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[0.7rem] font-bold text-[#1f1300]">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Abrir menú"
              aria-expanded={mobileOpen}
              className="rounded-full p-2.5 text-[var(--color-ink)] transition-colors hover:bg-[var(--color-primary-soft)] lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Buscador en móvil (fila propia) */}
        <div className="px-4 pb-3 sm:px-6 md:hidden">
          <SearchForm />
        </div>
      </div>

      {/* Barra de categorías (desktop) */}
      <nav className="hidden border-b border-[var(--color-line)] bg-[var(--color-surface)] lg:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-1 px-4 sm:px-6 lg:px-8">
          <Link href="/ofertas" className="flex items-center gap-1 whitespace-nowrap px-3 py-3 text-sm font-bold text-[var(--color-accent-dark)] transition-colors hover:text-[var(--color-accent)]">
            Ofertas
          </Link>
          {CATEGORIAS.map((c) => (
            <div
              key={c.slug}
              className="relative"
              onMouseEnter={() => setOpenCat(c.slug)}
              onMouseLeave={() => setOpenCat(null)}
            >
              <Link
                href={`/categorias/${c.slug}`}
                className="flex items-center gap-1 whitespace-nowrap px-3 py-3 text-sm font-medium text-[var(--color-ink)] transition-colors hover:text-[var(--color-primary)]"
              >
                {c.nombre}
              </Link>
              {openCat === c.slug && (
                <div className="absolute left-0 top-full z-50 w-60 pt-1">
                  <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-xl shadow-slate-900/10">
                    <Link href={`/categorias/${c.slug}`} className="group/cat relative block h-28 w-full overflow-hidden bg-[var(--color-primary-soft)]">
                      {c.imagen && (
                        <Image src={c.imagen} alt={c.nombre} fill className="object-cover transition-transform duration-300 group-hover/cat:scale-105" sizes="240px" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                      <span className="absolute bottom-2.5 left-3 right-3 font-display text-sm font-bold text-white">{c.nombre} →</span>
                    </Link>
                    {(navSubs[c.slug]?.length ?? 0) > 0 ? (
                      <div className="grid gap-0.5 p-2">
                        {navSubs[c.slug].map((s) => (
                          <Link key={s.slug} href={`/categorias/${s.slug}`} className="rounded-lg px-3 py-2 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]">
                            {s.nombre}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link href={`/categorias/${c.slug}`} className="flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">
                        Ver productos
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Menú móvil */}
      {mobileOpen && (
        <div className="max-h-[70vh] overflow-y-auto border-b border-[var(--color-line)] bg-[var(--color-surface)] lg:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 font-medium text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)]">Inicio</Link>
            <Link href="/productos" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 font-medium text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)]">Todos los productos</Link>
            <Link href="/ofertas" onClick={() => setMobileOpen(false)} className="block rounded-lg px-3 py-2.5 font-bold text-[var(--color-accent-dark)] hover:bg-[var(--color-primary-soft)]">Ofertas</Link>
            <p className="mt-2 px-3 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-[var(--color-ink-soft)]">Categorías</p>
            {CATEGORIAS.map((c) => (
              <div key={c.slug}>
                <Link
                  href={`/categorias/${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                >
                  {c.nombre}
                </Link>
                {(navSubs[c.slug]?.length ?? 0) > 0 && (
                  <div className="ml-3 border-l border-[var(--color-line)] pl-2">
                    {navSubs[c.slug].map((s) => (
                      <Link
                        key={s.slug}
                        href={`/categorias/${s.slug}`}
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-1.5 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
                      >
                        {s.nombre}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}
      </div>
    </header>
  );
}
