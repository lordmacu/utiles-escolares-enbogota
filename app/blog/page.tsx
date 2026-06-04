import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { POSTS, imagenDeCategoria, formatFecha } from "@/lib/blog";

const TITLE = "Blog de útiles escolares y papelería";
const DESCRIPTION =
  "Noticias y consejos sobre útiles escolares y papelería en Bogotá: regreso a clases, cómo ahorrar en la lista, novedades y tendencias para el cole.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

export default function BlogIndexPage() {
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `Blog de ${SITE_NAME}`,
    url: `${SITE_URL}/blog`,
    blogPost: POSTS.map((p) => ({
      "@type": "BlogPosting",
      headline: p.h1,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.fecha,
    })),
  };

  const [featured, ...rest] = POSTS;

  return (
    <div className="flex flex-col">
      <JsonLd data={blogLd} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-primary)] py-14 text-white lg:py-20">
        <div className="bg-grid absolute inset-0 opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
            <Link href="/" className="transition-colors hover:text-white">Inicio</Link>
            <span>/</span>
            <span className="text-white">Blog</span>
          </nav>
          <p className="eyebrow mb-3 text-[var(--color-accent)]">Útiles y papelería</p>
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl lg:text-6xl">{TITLE}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Consejos prácticos y novedades para el cole: regreso a clases, cómo ahorrar en la lista y todo lo de la papelería en Bogotá.
          </p>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section className="bg-[var(--color-bg)] py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Link
              href={`/blog/${featured.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] card-hover lg:grid-cols-2"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-primary-soft)] lg:aspect-auto lg:min-h-[340px]">
                <Image
                  src={imagenDeCategoria(featured.heroCategoria)}
                  alt={featured.h1}
                  fill
                  priority
                  className="object-contain p-8 transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  {featured.etiqueta}
                </span>
              </div>
              <div className="flex flex-col justify-center p-8 lg:p-10">
                <time className="text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]" dateTime={featured.fecha}>
                  {formatFecha(featured.fecha)}
                </time>
                <h2 className="mt-3 mb-4 font-display text-2xl font-bold leading-tight text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-primary)] lg:text-4xl">
                  {featured.h1}
                </h2>
                <p className="mb-6 text-lg leading-relaxed text-[var(--color-ink-soft)]">{featured.excerpt}</p>
                <span className="inline-flex items-center gap-2 font-semibold text-[var(--color-primary)]">
                  Leer artículo
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Resto */}
      <section className="bg-[var(--color-bg)] pb-16 lg:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] card-hover"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-primary-soft)]">
                  <Image
                    src={imagenDeCategoria(post.heroCategoria)}
                    alt={post.h1}
                    fill
                    className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-[var(--color-surface)]/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                    {post.etiqueta}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <time className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]" dateTime={post.fecha}>
                    {formatFecha(post.fecha)}
                  </time>
                  <h2 className="mt-2 mb-3 font-display text-xl font-bold leading-snug text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-primary)]">
                    {post.h1}
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">{post.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
                    Leer más
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
