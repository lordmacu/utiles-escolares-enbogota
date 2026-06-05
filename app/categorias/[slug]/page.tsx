import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CategoriaSeoContent } from "@/components/CategoriaSeoContent";
import { JsonLd } from "@/components/JsonLd";
import { loadCategoriaSeo } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import {
  CATEGORIAS,
  getAllCategoriaSlugs,
  getCategoriaInfo,
  getSubcategoriaParent,
  getBreadcrumb,
} from "@/lib/categorias";
import {
  getProductosDeCategoria,
  getIndexDeCategoria,
  getSubcategoriasConProductos,
  getSubcategoriaSlugsConProductos,
} from "@/lib/productos";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Existen las 14 categorías principales + las subcategorías con productos.
// Cualquier otro slug → 404 (evita páginas vacías / soft-404).
export const dynamicParams = false;

export function generateStaticParams() {
  const slugs = [...getAllCategoriaSlugs(), ...getSubcategoriaSlugsConProductos()];
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoria = getCategoriaInfo(slug);
  if (!categoria) return { title: "Categoría no encontrada" };

  const catSeo = await loadCategoriaSeo(slug);
  const total = getProductosDeCategoria(slug).length;
  const titulo = catSeo?.metaTitle || `${categoria.nombre} en Bogotá`;
  const descripcion =
    catSeo?.metaDescription ||
    `Compra ${categoria.nombre.toLowerCase()} en Bogotá. ${total} productos de papelería y útiles escolares con entrega a domicilio. Pídelos por WhatsApp.`.slice(0, 160);

  return {
    title: titulo,
    description: descripcion,
    keywords: catSeo?.keywordsObjetivo?.join(", ") || undefined,
    alternates: { canonical: `/categorias/${slug}` },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: `${SITE_URL}/categorias/${slug}`,
      type: "website",
      // Sin override WebP: usa el PNG de marca del sitio (opengraph-image), que sí
      // previsualizan WhatsApp y Facebook.
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const categoria = getCategoriaInfo(slug);
  if (!categoria) notFound();

  const breadcrumb = getBreadcrumb(slug);
  const productos = getIndexDeCategoria(slug);
  const esSub = getSubcategoriaParent(slug) !== null;
  const subcategorias = esSub ? [] : getSubcategoriasConProductos(slug);
  const catSeo = await loadCategoriaSeo(slug);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Categorías", item: `${SITE_URL}/categorias` },
      ...breadcrumb.map((b, i) => ({
        "@type": "ListItem",
        position: 3 + i,
        name: b.nombre,
        item: `${SITE_URL}/categorias/${b.slug}`,
      })),
    ],
  };

  const collectionLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: categoria.nombre,
    url: `${SITE_URL}/categorias/${slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: productos.length,
      itemListElement: productos.slice(0, 50).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/producto/${p.slug}`,
        name: p.nombre,
      })),
    },
  };

  const faqLd =
    catSeo && catSeo.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: catSeo.faqs.map((f) => ({
            "@type": "Question",
            name: f.pregunta,
            acceptedAnswer: { "@type": "Answer", text: f.respuesta },
          })),
        }
      : null;

  const jsonLd = faqLd ? [breadcrumbLd, collectionLd, faqLd] : [breadcrumbLd, collectionLd];

  return (
    <div className="flex flex-col">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:px-8 lg:py-16">
          <div className="flex-1">
            <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-[var(--color-ink-soft)]">
              <Link href="/" className="hover:text-[var(--color-primary)]">Inicio</Link>
              <span>/</span>
              <Link href="/categorias" className="hover:text-[var(--color-primary)]">Categorías</Link>
              {breadcrumb.map((b, i) => (
                <span key={b.slug} className="flex items-center gap-2">
                  <span>/</span>
                  {i === breadcrumb.length - 1 ? (
                    <span className="text-[var(--color-ink)]">{b.nombre}</span>
                  ) : (
                    <Link href={`/categorias/${b.slug}`} className="hover:text-[var(--color-primary)]">{b.nombre}</Link>
                  )}
                </span>
              ))}
            </nav>
            <p className="eyebrow mb-2">{productos.length} productos</p>
            <h1 className="font-display text-3xl font-extrabold text-[var(--color-ink)] text-balance sm:text-4xl lg:text-5xl">
              {categoria.nombre}
            </h1>
            <p className="mt-3 max-w-xl text-[var(--color-ink-soft)]">
              Encuentra {categoria.nombre.toLowerCase()} al mejor precio, con entrega a domicilio en Bogotá.
            </p>
          </div>
          {categoria.imagen && (
            <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-primary-soft)] lg:h-52 lg:w-52">
              <Image src={categoria.imagen} alt={categoria.nombre} fill priority className="object-contain p-4" sizes="208px" />
            </div>
          )}
        </div>
      </section>

      {/* Filtros + grid */}
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <CategoryFilter productos={productos} subcategorias={subcategorias} />
      </section>

      {/* Contenido editorial/SEO de la categoría */}
      {catSeo && <CategoriaSeoContent seo={catSeo} nombre={categoria.nombre} />}

      {/* Otras categorías */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-surface)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-center font-display text-xl font-bold text-[var(--color-ink)]">Otras categorías</h2>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {CATEGORIAS.filter((c) => c.slug !== slug).map((c) => (
              <Link
                key={c.slug}
                href={`/categorias/${c.slug}`}
                className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                {c.nombre}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
