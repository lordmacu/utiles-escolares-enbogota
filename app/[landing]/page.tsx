import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, SITE_NAME, waLink } from "@/lib/site";
import { CATEGORIAS, getCategoriaInfo } from "@/lib/categorias";
import {
  getLanding,
  getLandingSlugs,
  getProductosLanding,
  BARRIOS,
} from "@/lib/landings";

interface PageProps {
  params: Promise<{ landing: string }>;
}

// Solo se renderizan los slugs de landings.json. Las rutas estáticas
// (/categorias, /productos, /ofertas, /carrito) tienen precedencia sobre este
// segmento dinámico; cualquier otro slug de un segmento → 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getLandingSlugs().map((landing) => ({ landing }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { landing: slug } = await params;
  const landing = getLanding(slug);
  if (!landing) return { title: "Página no encontrada" };

  return {
    title: landing.title,
    description: landing.metaDescription,
    keywords: landing.keywords,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title: landing.title,
      description: landing.metaDescription,
      url: `${SITE_URL}/${slug}`,
      type: "website",
    },
  };
}

export default async function LandingPage({ params }: PageProps) {
  const { landing: slug } = await params;
  const landing = getLanding(slug);
  if (!landing) notFound();

  const productos = getProductosLanding(landing);
  const heroImagen = productos[0]?.imagen || "";
  const ctaCat = getCategoriaInfo(landing.ctaCategoria);
  const wa = waLink(`Hola! Quiero información sobre ${landing.h1}`);

  const otrasCategorias = CATEGORIAS.filter(
    (c) => !landing.categoriasFuente.includes(c.slug)
  ).slice(0, 10);
  const otrosBarrios = BARRIOS.filter((b) => b.slug !== slug).slice(0, 11);

  // === Datos estructurados (JSON-LD) ===
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: landing.h1, item: `${SITE_URL}/${slug}` },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "es-CO",
    mainEntity: landing.faq.map((f) => ({
      "@type": "Question",
      name: f.pregunta,
      acceptedAnswer: { "@type": "Answer", text: f.respuesta },
    })),
  };

  return (
    <div className="flex flex-col">
      <JsonLd data={[breadcrumbLd, faqLd]} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-primary)] text-white">
        <div className="bg-grid absolute inset-0 opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
            <Link href="/" className="transition-colors hover:text-white">Inicio</Link>
            <span>/</span>
            <span className="text-white">{landing.h1}</span>
          </nav>

          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="font-display text-4xl font-extrabold leading-tight text-balance sm:text-5xl lg:text-6xl">
                {landing.h1}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
                {landing.subtitulo}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-wa)] px-7 py-3.5 font-semibold text-white transition-transform hover:scale-[1.02]"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 1.758-1.688 0-.633-.252-1.195-.572-1.48z" />
                  </svg>
                  Pedir por WhatsApp
                </a>
                {ctaCat && (
                  <Link
                    href={`/categorias/${ctaCat.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 px-7 py-3.5 font-semibold text-white transition-all hover:border-white"
                  >
                    Ver catálogo
                  </Link>
                )}
              </div>
            </div>

            {heroImagen && (
              <div className="relative hidden aspect-square overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl lg:block">
                <Image
                  src={heroImagen}
                  alt={landing.h1}
                  fill
                  priority
                  className="object-contain p-8"
                  sizes="(max-width: 1024px) 0px, 50vw"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Intro (contenido único SEO) */}
      <section className="bg-[var(--color-bg)] py-12 lg:py-16">
        <div className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6 lg:px-8">
          {landing.intro.map((parrafo, i) => (
            <p key={i} className="text-lg leading-relaxed text-[var(--color-ink-soft)] text-pretty">
              {parrafo}
            </p>
          ))}
        </div>
      </section>

      {/* Beneficios */}
      <section className="bg-[var(--color-bg)] pb-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {landing.beneficios.map((b) => (
              <div key={b.titulo} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
                  <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">{b.titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">{b.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Productos */}
      {productos.length > 0 && (
        <section className="bg-[var(--color-bg)] py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow mb-1">Catálogo</p>
                <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
                  Productos destacados
                </h2>
              </div>
              {ctaCat && (
                <Link href={`/categorias/${ctaCat.slug}`} className="flex items-center gap-2 font-semibold text-[var(--color-primary)] hover:underline">
                  Ver todo
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {productos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cómo funciona */}
      <section className="bg-[var(--color-primary)] py-14 text-white lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center font-display text-2xl font-bold sm:text-3xl">¿Cómo pedir?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              ["1", "Arma tu pedido", "Explora el catálogo y elige los útiles que necesitas."],
              ["2", "Escríbenos por WhatsApp", "Envíanos tu lista; confirmamos disponibilidad, precio y dirección."],
              ["3", "Recibe en casa", "Entregamos a domicilio en Bogotá, a la hora que acordemos."],
            ].map(([n, t, d]) => (
              <div key={n} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 font-display text-xl font-bold text-[var(--color-accent)]">{n}</div>
                <h3 className="font-display text-lg font-semibold">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/75">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cobertura local (SEO local + enlazado entre barrios) */}
      <section className="bg-[var(--color-bg)] py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          {landing.tipo === "barrio" ? (
            <>
              <h2 className="mb-3 font-display text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
                Cobertura en {landing.zonaNombre}
              </h2>
              <p className="mb-6 text-[var(--color-ink-soft)]">
                Entregamos en {landing.zonaNombre} y sus alrededores, incluyendo:
              </p>
              <div className="mb-10 flex flex-wrap justify-center gap-2">
                {(landing.puntosReferencia ?? []).map((z) => (
                  <span key={z} className="rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)]">
                    {z}
                  </span>
                ))}
              </div>
              {otrosBarrios.length > 0 && (
                <>
                  <p className="mb-4 text-sm text-[var(--color-ink-soft)]">
                    También entregamos en otras zonas de Bogotá:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {otrosBarrios.map((b) => (
                      <Link
                        key={b.slug}
                        href={`/${b.slug}`}
                        className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                      >
                        {b.nombre}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h2 className="mb-3 font-display text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
                Entregamos en toda Bogotá
              </h2>
              <p className="mb-6 text-[var(--color-ink-soft)]">
                Llevamos tu pedido a cualquier zona de la ciudad. Mira nuestra cobertura por barrio:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {BARRIOS.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/${b.slug}`}
                    className="rounded-full bg-[var(--color-primary-soft)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                  >
                    {b.nombre}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[var(--color-surface)] py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center font-display text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {landing.faq.map((item, i) => (
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

      {/* Enlaces internos a otras categorías */}
      <section className="bg-[var(--color-bg)] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-center font-display text-xl font-bold text-[var(--color-ink)]">
            Explora más categorías
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {otrasCategorias.map((cat) => (
              <Link
                key={cat.id}
                href={`/categorias/${cat.slug}`}
                className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                {cat.nombre}
              </Link>
            ))}
            <Link href="/categorias" className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white">
              Ver todas →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[var(--color-ink)] py-14 text-white lg:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 font-display text-2xl font-bold sm:text-3xl">
            ¿Listo para tu pedido?
          </h2>
          <p className="mb-8 text-lg text-white/75">
            Escríbenos por WhatsApp y coordinamos tu entrega en Bogotá. {SITE_NAME} a un mensaje de distancia.
          </p>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-wa)] px-8 py-4 font-semibold text-white transition-transform hover:scale-105"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 1.758-1.688 0-.633-.252-1.195-.572-1.48z" />
            </svg>
            Hacer mi pedido
          </a>
        </div>
      </section>
    </div>
  );
}
