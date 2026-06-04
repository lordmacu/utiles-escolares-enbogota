import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CATEGORIAS } from "@/lib/categorias";
import { getConteosPorCategoria } from "@/lib/productos";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Categorías de papelería y útiles escolares",
  description:
    "Navega nuestras categorías: útiles escolares, escritura, morrales y loncheras, papeles, fiesta, confitería y más. Entrega a domicilio en Bogotá.",
  alternates: { canonical: "/categorias" },
};

export default function CategoriasPage() {
  const conteos = getConteosPorCategoria();

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Categorías", item: `${SITE_URL}/categorias` },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <JsonLd data={breadcrumbLd} />
      <header className="mb-10">
        <p className="eyebrow mb-2">Explora</p>
        <h1 className="font-display text-3xl font-extrabold text-[var(--color-ink)] sm:text-4xl">Categorías</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Encuentra justo lo que buscas: desde la lista escolar hasta artículos de fiesta y oficina.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIAS.map((c) => (
          <Link
            key={c.slug}
            href={`/categorias/${c.slug}`}
            className="group flex items-center gap-4 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 card-hover"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-[var(--color-primary-soft)]">
              {c.imagen && (
                <Image src={c.imagen} alt={c.nombre} fill className="object-contain p-2" sizes="96px" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-[var(--color-ink)] group-hover:text-[var(--color-primary)]">{c.nombre}</h2>
              <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">{conteos[c.slug] ?? 0} productos</p>
              {c.subcategorias.length > 0 && (
                <p className="mt-1 line-clamp-1 text-xs text-[var(--color-ink-soft)]">
                  {c.subcategorias.map((s) => s.nombre).join(" · ")}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
