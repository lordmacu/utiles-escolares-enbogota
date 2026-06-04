import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, SITE_NAME, formatCOP, waLink } from "@/lib/site";
import { getCategoriaInfo } from "@/lib/categorias";
import {
  POSTS,
  getPost,
  getPostSlugs,
  representativeProducto,
  heroDe,
  formatFecha,
  type BlogItem,
} from "@/lib/blog";

export const dynamicParams = false;

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 1.758-1.688 0-.633-.252-1.195-.572-1.48z" />
    </svg>
  );
}

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Artículo no encontrado" };

  const img = heroDe(post).src;
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: `${SITE_URL}/blog/${slug}`,
      type: "article",
      publishedTime: post.fecha,
      images: img ? [{ url: img }] : undefined,
    },
  };
}

function ItemBlock({ item, n, postH1 }: { item: BlogItem; n: number; postH1: string }) {
  const prod = representativeProducto(item.ctaCategoria);
  const cat = getCategoriaInfo(item.ctaCategoria);
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] card-hover">
      <div className="grid sm:grid-cols-[1.45fr_1fr]">
        <div className="order-2 flex flex-col p-6 sm:order-1 sm:p-8">
          <div className="mb-3 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] font-display font-bold text-white">
              {n}
            </span>
            <h2 className="font-display text-xl font-bold leading-snug text-[var(--color-ink)] sm:text-2xl">
              {item.titulo}
            </h2>
          </div>
          <p className="mb-5 leading-relaxed text-[var(--color-ink-soft)]">{item.texto}</p>

          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-3">
            {prod && (
              <span className="font-display text-xl font-extrabold text-[var(--color-primary)]">desde {formatCOP(prod.precio)}</span>
            )}
            <a
              href={waLink(`Hola! Vengo del blog "${postH1}" y quiero ${item.ctaTexto.toLowerCase()}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-wa)] px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Pedir por WhatsApp
            </a>
            <Link
              href={`/categorias/${item.ctaCategoria}`}
              className="text-sm font-semibold text-[var(--color-primary)] hover:underline"
            >
              {item.ctaTexto} →
            </Link>
          </div>
        </div>

        <Link
          href={`/categorias/${item.ctaCategoria}`}
          className="relative order-1 block aspect-[4/5] overflow-hidden bg-[var(--color-primary-soft)] sm:order-2"
        >
          {prod?.imagen && (
            <Image
              src={prod.imagen}
              alt={cat?.nombre ?? item.titulo}
              fill
              className="object-contain p-6"
              sizes="(max-width: 640px) 100vw, 40vw"
            />
          )}
        </Link>
      </div>
    </div>
  );
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const heroImagen = heroDe(post).src;
  const cats = post.categoriasRelacionadas
    .map(getCategoriaInfo)
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const otros = POSTS.filter((p) => p.slug !== slug).slice(0, 3);

  // === JSON-LD ===
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.h1,
    description: post.metaDescription,
    image: heroImagen ? `${SITE_URL}${heroImagen}` : undefined,
    datePublished: post.fecha,
    dateModified: post.fecha,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.h1, item: `${SITE_URL}/blog/${slug}` },
    ],
  };
  const faqLd =
    post.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: "es-CO",
          mainEntity: post.faq.map((f) => ({
            "@type": "Question",
            name: f.pregunta,
            acceptedAnswer: { "@type": "Answer", text: f.respuesta },
          })),
        }
      : null;

  return (
    <div className="flex flex-col">
      <JsonLd data={[blogLd, breadcrumbLd, ...(faqLd ? [faqLd] : [])]} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-ink)] text-white">
        {heroImagen && (
          <div className="absolute inset-0">
            <Image src={heroImagen} alt={post.h1} fill priority className="object-cover opacity-20" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)]/85 to-[var(--color-ink)]/50" />
          </div>
        )}
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
            <Link href="/" className="transition-colors hover:text-white">Inicio</Link>
            <span>/</span>
            <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
          </nav>
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {post.etiqueta}
            </span>
            <time className="text-sm text-[var(--color-accent)]" dateTime={post.fecha}>
              {formatFecha(post.fecha)}
            </time>
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight text-balance sm:text-4xl lg:text-5xl">
            {post.h1}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80 text-pretty">{post.excerpt}</p>
        </div>
      </section>

      {/* Cuerpo */}
      <article className="bg-[var(--color-surface)] py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="mb-8 text-xl font-medium leading-relaxed text-[var(--color-ink)]">{post.lead}</p>
          <div className="mb-4 space-y-4">
            {post.intro.map((p, i) => (
              <p key={i} className="text-lg leading-relaxed text-[var(--color-ink-soft)]">{p}</p>
            ))}
          </div>

          {/* Listicle con CTA por ítem */}
          <div className="mt-10 space-y-6">
            {post.items.map((item, i) => (
              <div key={item.titulo}>
                <ItemBlock item={item} n={i + 1} postH1={post.h1} />
                {i === 2 && post.items.length > 4 && (
                  <div className="relative my-6 overflow-hidden rounded-3xl bg-[var(--color-primary)] px-6 py-7 text-center text-white sm:px-8">
                    <p className="relative mb-2 font-display text-xl font-bold sm:text-2xl">¿Armamos tu lista juntos?</p>
                    <p className="relative mx-auto mb-5 max-w-md text-sm text-white/85">
                      Envíanos la lista de tu colegio y la cotizamos completa, con entrega a domicilio en Bogotá.
                    </p>
                    <a
                      href={waLink(`Hola! Estoy leyendo "${post.h1}" y quiero cotizar mi lista de útiles`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative inline-flex items-center gap-2 rounded-full bg-[var(--color-wa)] px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
                    >
                      <WhatsAppIcon />
                      Escríbenos por WhatsApp
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Secciones de fondo */}
          {post.secciones && post.secciones.length > 0 && (
            <div className="mt-12 space-y-10">
              {post.secciones.map((sec, i) => (
                <section key={i}>
                  <h2 className="mb-4 font-display text-2xl font-bold leading-snug text-[var(--color-ink)] sm:text-3xl">
                    {sec.titulo}
                  </h2>
                  <div className="space-y-4">
                    {sec.parrafos.map((par, j) => (
                      <p key={j} className="text-lg leading-relaxed text-[var(--color-ink-soft)]">{par}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Cierre */}
          <div className="mt-10 space-y-4">
            {post.cierre.map((p, i) => (
              <p key={i} className="text-lg leading-relaxed text-[var(--color-ink-soft)]">{p}</p>
            ))}
          </div>

          {/* CTA final */}
          <div className="mt-12 rounded-3xl border border-[var(--color-line)] bg-[var(--color-bg)] p-8 text-center">
            <p className="eyebrow mb-3">Pide hoy</p>
            <h2 className="mb-3 font-display text-2xl font-bold text-[var(--color-ink)]">
              Resuelve la papelería sin salir de casa
            </h2>
            <p className="mx-auto mb-6 max-w-md text-[var(--color-ink-soft)]">
              Escríbenos por WhatsApp, arma tu pedido y coordinamos la entrega a domicilio en Bogotá.
            </p>
            <a
              href={waLink(`Hola! Vengo del blog "${post.h1}" y quiero hacer un pedido`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-wa)] px-8 py-4 font-semibold text-white transition-transform hover:scale-105"
            >
              <WhatsAppIcon />
              Pedir por WhatsApp
            </a>
          </div>
        </div>
      </article>

      {/* FAQ */}
      {post.faq.length > 0 && (
        <section className="border-t border-[var(--color-line)] bg-[var(--color-bg)] py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 text-center font-display text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
              Preguntas frecuentes
            </h2>
            <div className="space-y-4">
              {post.faq.map((item, i) => (
                <details key={i} className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 [&_summary::-webkit-details-marker]:hidden">
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

      {/* Enlaces internos */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-surface)] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {cats.length > 0 && (
            <div className="mb-12">
              <h2 className="mb-6 text-center font-display text-2xl font-bold text-[var(--color-ink)]">
                Explora estas categorías
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {cats.map((cat) => (
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

          {otros.length > 0 && (
            <div>
              <h2 className="mb-6 text-center font-display text-2xl font-bold text-[var(--color-ink)]">
                Sigue leyendo
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {otros.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`} className="block rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6 card-hover">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{p.etiqueta}</span>
                    <h3 className="mt-2 mb-2 font-display text-lg font-semibold leading-snug text-[var(--color-ink)]">{p.h1}</h3>
                    <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{p.excerpt}</p>
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
