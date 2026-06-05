import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Página no encontrada",
  description: "No encontramos esta página. Explora el catálogo de útiles escolares y papelería con entrega a domicilio en Bogotá.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center">
      <p className="font-display text-6xl font-extrabold text-[var(--color-primary)]">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-[var(--color-ink)]">No encontramos esta página</h1>
      <p className="mt-2 text-[var(--color-ink-soft)]">
        Puede que el producto ya no esté disponible o el enlace haya cambiado.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">Ir al inicio</Link>
        <Link href="/productos" className="btn-secondary">Ver productos</Link>
      </div>
    </div>
  );
}
