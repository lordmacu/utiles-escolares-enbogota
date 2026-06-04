"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { CartItem } from "@/lib/types";

type Item = Omit<CartItem, "cantidad">;

/** Botón compacto "Agregar" usado en las tarjetas de producto. */
export function AddToCartButton({ item, className = "" }: { item: Item; className?: string }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    add(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={`Agregar ${item.nombre} al carrito`}
      className={`relative z-10 inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3.5 py-2 text-sm font-semibold text-white transition-all hover:bg-[var(--color-primary-dark)] active:scale-95 ${className}`}
    >
      {added ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Listo
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar
        </>
      )}
    </button>
  );
}
