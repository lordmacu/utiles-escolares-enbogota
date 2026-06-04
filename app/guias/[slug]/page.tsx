import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, SITE_NAME, waLink } from "@/lib/site";
import { getCategoriaInfo } from "@/lib/categorias";
import {
  GUIAS,
  getGuia,
  getGuiaSlugs,
  imagenDeCategoria,
  productosDeCategorias,
  formatFecha,
} from "@/lib/blog";

export const dynamicParams = false;

export function generateStaticParams() {
  return getGuiaSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guia = getGuia(slug);
  if (!guia) return { title: "Guía no encontrada" };

  const img = imagenDeCategoria(guia.imagenCategoria);
  return {
    title: guia.title,
    description: guia.metaDescription,
    alternates: { canonical: `/guias/${slug}` },
    openGraph: {
      title: guia.title,
      description: guia.metaDescription,
      url: `${SITE_URL}/guias/${slug}`,
      type: "article",
      publishedTime: guia.fecha,
      images: img ? [{ url: img }] : undefined,
    },
  };
}

export default async function GuiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guia = getGuia(slug);
  if (!guia) notFound();

  const heroImagen = imagenDeCategoria(guia.imagenCategoria);
  const productos = productosDeCategorias(guia.categoriasRelacionadas);
  const catsRelacionadas = guia.categoriasRelacionadas
    .map(getCategoriaInfo)
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const otrasGuias = GUIAS.filter((g) => g.slug !== slug).slice(0, 3);

  // === JSON-LD ===
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guia.h1,
    description: guia.metaDescription,
    image: heroImagen ? `${SITE_URL}${heroImagen}` : undefined,
    datePublished: guia.fecha,
    dateModified: guia.fecha,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/guias/${slug}` },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Guías", item: `${SITE_URL}/guias` },
      { "@type": "ListItem", position: 3, name: guia.h1, item: `${SITE_URL}/guias/${slug}` },
    ],
  };
  const faqLd =
    guia.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: "es-CO",
          mainEntity: guia.faq.map((f) => ({
            "@type": "Question",
            name: f.pregunta,
            acceptedAnswer: { "@type": "Answer", text: f.respuesta },
          })),
        }
      : null;

  return (
    <div className="flex flex-col">
      <JsonLd data={[articleLd, breadcrumbLd, ...(faqLd ? [faqLd] : [])]} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-ink)] text-white">
        {heroImagen && (
          <div className="absolute inset-0">
            <Image src={heroImagen} alt={guia.h1} fill priority className="object-cover opacity-20" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)]/85 to-[var(--color-ink)]/50" />
          </div>
        )}
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
            <Link href="/" className="transition-colors hover:text-white">Inicio</Link>
            <span>/</span>
            <Link href="/guias" className="transition-colors hover:text-white">Guías</Link>
          </nav>
          <time className="text-sm uppercase tracking-wide text-[var(--color-accent)]" dateTime={guia.fecha}>
            {formatFecha(guia.fecha)}
          </time>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl">
            {guia.h1}
          </h1>
        </div>
      </section>

      {/* Cuerpo del artículo */}
      <article className="bg-[var(--color-surface)] py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="mb-10 text-xl font-medium leading-relaxed text-[var(--color-ink)]">{guia.lead}</p>

          <div className="space-y-10">
            {guia.secciones.map((s) => (
              <section key={s.titulo}>
                <h2 className="mb-4 font-display text-2xl font-bold text-[var(--color-ink)]">{s.titulo}</h2>
                <div className="space-y-4">
                  {s.parrafos.map((p, i) => (
                    <p key={i} className="text-lg leading-relaxed text-[var(--color-ink-soft)]">{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* CTA en línea */}
          <div className="mt-12 rounded-3xl border border-[var(--color-line)] bg-[var(--color-bg)] p-8 text-center">
            <h2 className="mb-3 font-display text-2xl font-bold text-[var(--color-ink)]">
              ¿Listo para armar tu pedido?
            </h2>
            <p className="mb-6 text-[var(--color-ink-soft)]">
              Escríbenos por WhatsApp y coordinamos tu entrega a domicilio en Bogotá hoy mismo.
            </p>
            <a
              href={waLink(`Hola! Vengo de la guía "${guia.h1}" y quiero hacer un pedido`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-wa)] px-8 py-4 font-semibold text-white transition-transform hover:scale-105"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 1.758-1.688 0-.633-.252-1.195-.572-1.48z" />
              </svg>
              Pedir por WhatsApp
            </a>
          </div>
        </div>
      </article>

      {/* Productos relacionados */}
      {productos.length > 0 && (
        <section className="bg-[var(--color-bg)] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-center font-display text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
              Productos que puedes pedir hoy
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {productos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {guia.faq.length > 0 && (
        <section className="bg-[var(--color-surface)] py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-10 text-center font-display text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {guia.faq.map((item, i) => (
                <details key={i} className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between font-display text-lg font-semibold text-[var(--color-ink)]">
                    {item.pregunta}
                    <svg className="ml-4 h-5 w-5 shrink-0 text-[var(--color-primary)] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="mt-4 leading-relaxed text-[var(--color-ink-soft)]">{item.respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Enlaces internos: categorías relacionadas + otras guías */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-bg)] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {catsRelacionadas.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-6 text-center font-display text-2xl font-bold text-[var(--color-ink)]">
                Explora estas categorías
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {catsRelacionadas.map((cat) => (
                  <Link key={cat.id} href={`/categorias/${cat.slug}`} className="rounded-full border border-[var(--color-line)] px-5 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]">
                    {cat.nombre}
                  </Link>
                ))}
                <Link href="/categorias" className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white">
                  Ver todas →
                </Link>
              </div>
            </div>
          )}

          {otrasGuias.length > 0 && (
            <div>
              <h2 className="mb-6 text-center font-display text-2xl font-bold text-[var(--color-ink)]">
                Más guías
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {otrasGuias.map((g) => (
                  <Link key={g.slug} href={`/guias/${g.slug}`} className="block rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 card-hover">
                    <h3 className="mb-2 font-display text-lg font-semibold leading-snug text-[var(--color-ink)]">{g.h1}</h3>
                    <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{g.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
