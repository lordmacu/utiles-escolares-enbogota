"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatCOP, waLink } from "@/lib/site";

export function CartView() {
  const { items, total, count, setQty, remove, clear, checkout, ready } = useCart();
  const [datos, setDatos] = useState({ nombre: "", telefono: "", nota: "" });
  const [pedido, setPedido] = useState<{ id: string; waUrl: string } | null>(null);

  // Aún hidratando localStorage: evita parpadeo de "carrito vacío".
  if (!ready) {
    return <div className="py-24 text-center text-[var(--color-ink-soft)]">Cargando tu carrito…</div>;
  }

  // Confirmación post-checkout.
  if (pedido) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]">
          <svg className="h-11 w-11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-ink)]">¡Pedido registrado!</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">
          Guardamos tu pedido <span className="font-semibold text-[var(--color-ink)]">{pedido.id}</span>. Para confirmarlo y
          coordinar la entrega, envíanoslo por WhatsApp.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <a href={pedido.waUrl} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
            Enviar pedido por WhatsApp
          </a>
          <Link href="/productos" className="btn-secondary w-full">Seguir comprando</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-extrabold text-[var(--color-ink)]">Tu carrito está vacío</h1>
        <p className="mt-2 text-[var(--color-ink-soft)]">Agrega los útiles y la papelería que necesitas.</p>
        <Link href="/productos" className="btn-primary mt-6">Ver productos</Link>
      </div>
    );
  }

  function confirmar() {
    const lineas = items.map((i) => `• ${i.cantidad} x ${i.nombre} — ${formatCOP(i.precio * i.cantidad)}`).join("\n");
    const resumen =
      `Hola! Quiero hacer este pedido:\n\n${lineas}\n\nTotal: ${formatCOP(total)}` +
      (datos.nombre ? `\n\nNombre: ${datos.nombre}` : "") +
      (datos.telefono ? `\nTeléfono: ${datos.telefono}` : "") +
      (datos.nota ? `\nNota: ${datos.nota}` : "");
    const waUrl = waLink(resumen);
    const id = checkout(datos);
    setPedido({ id, waUrl });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      {/* Items */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold text-[var(--color-ink)]">Tu carrito ({count})</h1>
          <button type="button" onClick={clear} className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-red-600">
            Vaciar
          </button>
        </div>
        <ul className="divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          {items.map((it) => (
            <li key={it.slug} className="flex gap-4 p-4">
              <Link href={`/producto/${it.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-primary-soft)]">
                {it.imagen && <Image src={it.imagen} alt={it.nombre} fill className="object-contain p-2" sizes="96px" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link href={`/producto/${it.slug}`} className="font-semibold text-[var(--color-ink)] hover:text-[var(--color-primary)] line-clamp-2">
                  {it.nombre}
                </Link>
                <span className="mt-1 text-sm font-bold text-[var(--color-primary)]">{formatCOP(it.precio)}</span>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="inline-flex items-center rounded-full border border-[var(--color-line)]">
                    <button type="button" onClick={() => setQty(it.slug, it.cantidad - 1)} aria-label="Quitar uno" className="grid h-9 w-9 place-items-center rounded-full text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]">−</button>
                    <span className="min-w-[28px] text-center text-sm font-semibold">{it.cantidad}</span>
                    <button type="button" onClick={() => setQty(it.slug, it.cantidad + 1)} aria-label="Agregar uno" className="grid h-9 w-9 place-items-center rounded-full text-[var(--color-ink-soft)] hover:text-[var(--color-primary)]">+</button>
                  </div>
                  <span className="font-semibold text-[var(--color-ink)]">{formatCOP(it.precio * it.cantidad)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/productos" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] hover:underline">
          ← Seguir comprando
        </Link>
      </div>

      {/* Resumen + datos */}
      <aside className="h-fit rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 lg:sticky lg:top-20">
        <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">Resumen del pedido</h2>
        <div className="mt-4 flex items-center justify-between border-b border-[var(--color-line)] pb-4">
          <span className="text-[var(--color-ink-soft)]">Productos ({count})</span>
          <span className="font-semibold">{formatCOP(total)}</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-semibold text-[var(--color-ink)]">Total</span>
          <span className="font-display text-2xl font-extrabold text-[var(--color-primary)]">{formatCOP(total)}</span>
        </div>
        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">El domicilio se coordina por WhatsApp según tu zona.</p>

        <div className="mt-5 space-y-3">
          <input
            type="text"
            placeholder="Tu nombre (opcional)"
            value={datos.nombre}
            onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <input
            type="tel"
            inputMode="tel"
            placeholder="Teléfono (opcional)"
            value={datos.telefono}
            onChange={(e) => setDatos((d) => ({ ...d, telefono: e.target.value }))}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <textarea
            placeholder="Nota o dirección (opcional)"
            rows={2}
            value={datos.nota}
            onChange={(e) => setDatos((d) => ({ ...d, nota: e.target.value }))}
            className="w-full resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <button type="button" onClick={confirmar} className="btn-primary mt-5 w-full">
          Confirmar pedido
        </button>
        <p className="mt-3 text-center text-xs text-[var(--color-ink-soft)]">
          Guardamos tu pedido y lo confirmas por WhatsApp. Aún no procesamos pagos en línea.
        </p>
      </aside>
    </div>
  );
}
