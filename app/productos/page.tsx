import type { Metadata } from "next";
import { SearchableProducts } from "@/components/SearchableProducts";
import { CATEGORIAS } from "@/lib/categorias";
import { getProductoIndex, getConteosPorCategoria, getNavSubcategorias, PRODUCTOS } from "@/lib/productos";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Todos los productos — útiles, papelería y más",
  description:
    "Explora y busca entre miles de útiles escolares, papelería, artículos de fiesta y oficina. Filtra por categoría y pide a domicilio en Bogotá.",
  alternates: { canonical: "/productos" },
};

interface PageProps {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}

export default async function ProductosPage({ searchParams }: PageProps) {
  const { categoria, q } = await searchParams;
  const productos = getProductoIndex();
  const conteos = getConteosPorCategoria();
  const categorias = CATEGORIAS.map((c) => ({
    slug: c.slug,
    nombre: c.nombre,
    count: conteos[c.slug] ?? 0,
  }));

  const initialCategoria = categorias.some((c) => c.slug === categoria) ? categoria! : "";

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Todos los productos",
    description: "Catálogo de útiles escolares y papelería en Bogotá.",
    url: `${SITE_URL}/productos`,
    isPartOf: { "@type": "WebSite", url: SITE_URL },
    about: { "@type": "Thing", name: `${PRODUCTOS.length} productos` },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <JsonLd data={itemListLd} />
      <header className="mb-8">
        <p className="eyebrow mb-2">Catálogo</p>
        <h1 className="font-display text-3xl font-extrabold text-[var(--color-ink)] sm:text-4xl">Todos los productos</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-ink-soft)]">
          Busca por nombre o marca y filtra por categoría. Agrega lo que necesites al carrito y pide por WhatsApp.
        </p>
      </header>

      <SearchableProducts
        productos={productos}
        categorias={categorias}
        navSubs={getNavSubcategorias()}
        initialCategoria={initialCategoria}
        initialQuery={typeof q === "string" ? q : ""}
      />
    </div>
  );
}
