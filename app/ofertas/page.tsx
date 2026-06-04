import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";
import { getOfertas } from "@/lib/productos";

export const metadata: Metadata = {
  title: "Ofertas en útiles escolares y papelería",
  description:
    "Aprovecha las ofertas en útiles escolares, papelería y artículos de fiesta en Bogotá. Productos con descuento y entrega a domicilio. Pídelos por WhatsApp.",
  alternates: { canonical: "/ofertas" },
};

export default function OfertasPage() {
  const ofertas = getOfertas(60);

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Ofertas",
    url: `${SITE_URL}/ofertas`,
    description: "Productos de papelería y útiles escolares con descuento en Bogotá.",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: ofertas.length,
      itemListElement: ofertas.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/producto/${p.slug}`,
        name: p.nombre,
      })),
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <JsonLd data={collectionLd} />
      <header className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-bold text-[#1f1300]">
          % Descuentos
        </span>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-[var(--color-ink)] sm:text-4xl">Ofertas</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Productos con descuento por tiempo limitado. Agrégalos al carrito y pide por WhatsApp.
        </p>
      </header>

      {ofertas.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {ofertas.map((p, i) => (
            <ProductCard key={p.slug} producto={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] py-16 text-center">
          <p className="font-display text-lg font-semibold text-[var(--color-ink)]">Pronto habrá nuevas ofertas</p>
          <Link href="/productos" className="btn-primary mt-4">Ver todo el catálogo</Link>
        </div>
      )}
    </div>
  );
}
