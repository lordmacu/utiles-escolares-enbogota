"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { formatCOP } from "@/lib/site";

/** Panel lateral del carrito (slide-over). Montado una vez en el layout. */
export function CartDrawer() {
  const { items, count, total, isOpen, closeCart, setQty, remove } = useCart();

  // Bloquea el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Cierra con Escape.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={closeCart}
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Carrito de compra"
        aria-modal={isOpen}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[var(--color-surface)] shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
            Tu carrito {count > 0 && <span className="text-[var(--color-ink-soft)]">({count})</span>}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar carrito"
            className="rounded-full p-2 text-[var(--color-ink-soft)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
            </div>
            <p className="font-display text-lg font-semibold text-[var(--color-ink)]">Tu carrito está vacío</p>
            <p className="text-sm text-[var(--color-ink-soft)]">Agrega útiles, papelería o lo que necesites para el cole.</p>
            <Link href="/productos" onClick={closeCart} className="btn-primary mt-2">
              Ver productos
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-[var(--color-line)] overflow-y-auto px-5">
              {items.map((it) => (
                <li key={it.slug} className="flex gap-3 py-4">
                  <Link
                    href={`/producto/${it.slug}`}
                    onClick={closeCart}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-primary-soft)]"
                  >
                    {it.imagen && (
                      <Image src={it.imagen} alt={it.nombre} fill className="object-contain p-1.5" sizes="80px" />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/producto/${it.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary)]"
                    >
                      {it.nombre}
                    </Link>
                    <span className="mt-0.5 text-sm font-bold text-[var(--color-primary)]">{formatCOP(it.precio)}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-[var(--color-line)]">
                        <button
                          type="button"
                          onClick={() => setQty(it.slug, it.cantidad - 1)}
                          aria-label="Quitar uno"
                          className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]"
                        >
                          −
                        </button>
                        <span className="min-w-[24px] text-center text-sm font-semibold">{it.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => setQty(it.slug, it.cantidad + 1)}
                          aria-label="Agregar uno"
                          className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(it.slug)}
                        aria-label={`Eliminar ${it.nombre}`}
                        className="text-xs font-medium text-[var(--color-ink-soft)] hover:text-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-[var(--color-line)] px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[var(--color-ink-soft)]">Total</span>
                <span className="font-display text-xl font-extrabold text-[var(--color-ink)]">{formatCOP(total)}</span>
              </div>
              <Link href="/carrito" onClick={closeCart} className="btn-primary w-full">
                Ir al carrito y pedir
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="mt-2 w-full text-center text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]"
              >
                Seguir comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
