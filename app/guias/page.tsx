import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, SITE_NAME } from "@/lib/site";
import { GUIAS, imagenDeCategoria, formatFecha } from "@/lib/blog";

const TITLE = "Guías de útiles escolares y papelería";
const DESCRIPTION =
  "Guías prácticas para padres y estudiantes en Bogotá: cómo armar la lista de útiles, elegir morral y cuadernos, ahorrar en el regreso a clases y más.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/guias" },
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: `${SITE_URL}/guias`,
    type: "website",
  },
};

export default function GuiasIndexPage() {
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Guías", item: `${SITE_URL}/guias` },
    ],
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: GUIAS.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/guias/${g.slug}`,
      name: g.h1,
    })),
  };

  return (
    <div className="flex flex-col">
      <JsonLd data={[breadcrumbLd, itemListLd]} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[var(--color-primary)] text-white">
        <div className="bg-grid absolute inset-0 opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
            <Link href="/" className="transition-colors hover:text-white">Inicio</Link>
            <span>/</span>
            <span className="text-white">Guías</span>
          </nav>
          <p className="eyebrow mb-3 text-[var(--color-accent)]">Para padres y estudiantes</p>
          <h1 className="mb-4 max-w-3xl font-display text-4xl font-extrabold sm:text-5xl">{TITLE}</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-white/80">
            Consejos prácticos para armar la lista, elegir bien y ahorrar en el regreso a clases, con todo a domicilio en Bogotá.
          </p>
        </div>
      </section>

      {/* Listado de guías */}
      <section className="bg-[var(--color-bg)] py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {GUIAS.map((g) => (
              <article key={g.slug} className="group overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] card-hover">
                <Link href={`/guias/${g.slug}`} className="block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-[var(--color-primary-soft)]">
                    <Image
                      src={imagenDeCategoria(g.imagenCategoria)}
                      alt={g.h1}
                      fill
                      className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-6">
                    <time className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]" dateTime={g.fecha}>
                      {formatFecha(g.fecha)}
                    </time>
                    <h2 className="mt-2 mb-3 font-display text-xl font-bold leading-snug text-[var(--color-ink)] transition-colors group-hover:text-[var(--color-primary)]">
                      {g.h1}
                    </h2>
                    <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{g.excerpt}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">
                      Leer guía
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
