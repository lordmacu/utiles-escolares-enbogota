"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { waLink } from "@/lib/site";
import type { CartItem } from "@/lib/types";

type Item = Omit<CartItem, "cantidad">;

/** Selector de cantidad + agregar al carrito + pedir por WhatsApp. */
export function ProductBuyBox({ item }: { item: Item }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center rounded-full border border-[var(--color-line)]">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Quitar uno"
            className="grid h-11 w-11 place-items-center rounded-full text-lg text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]"
          >
            −
          </button>
          <span className="min-w-[2.5rem] text-center font-semibold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            aria-label="Agregar uno"
            className="grid h-11 w-11 place-items-center rounded-full text-lg text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => add({ ...item, cantidad: qty })}
          className="btn-primary flex-1"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
          Agregar al carrito
        </button>
      </div>

      <a
        href={waLink(`Hola! Quiero pedir ${qty} x ${item.nombre}`)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-wa)] px-6 py-3 font-semibold text-[var(--color-wa)] transition-colors hover:bg-[var(--color-wa)] hover:text-white"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        </svg>
        Pedir por WhatsApp
      </a>
    </div>
  );
}
