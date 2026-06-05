import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, SITE_NAME, waLink } from "@/lib/site";
import { CATEGORIAS } from "@/lib/categorias";
import { PRODUCTOS, getTopMarcas } from "@/lib/productos";
import config from "@/data/config.json";

const TITLE = "Quiénes somos";
const DESCRIPTION =
  "Conoce a Útiles Escolares: una tienda de papelería y útiles escolares a domicilio en Bogotá. Catálogo amplio, marcas reconocidas, lista del colegio completa y entrega en toda la ciudad.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/nosotros" },
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: `${SITE_URL}/nosotros`,
    type: "website",
  },
};

const VALORES = [
  {
    titulo: "Catálogo amplio en un solo lugar",
    texto:
      "Reunimos útiles escolares, papelería, morrales, artículos de oficina y de fiesta para que armes todo el pedido sin recorrer varias tiendas.",
  },
  {
    titulo: "La lista del colegio, completa",
    texto:
      "Nos envías la lista por WhatsApp (una foto sirve) y te la cotizamos entera, con productos equivalentes de la misma calidad cuando falta una referencia.",
  },
  {
    titulo: "Entrega a domicilio en Bogotá",
    texto:
      "Llevamos tu pedido a la casa, la oficina o el conjunto, en todas las localidades de la ciudad. Si pides temprano, en muchos casos el mismo día.",
  },
  {
    titulo: "Precios bajos y al por mayor",
    texto:
      "Manejamos precios competitivos para familias y tarifas por volumen para papelerías, colegios y revendedores.",
  },
];

export default function NosotrosPage() {
  const totalProductos = PRODUCTOS.length;
  const totalCategorias = CATEGORIAS.length;
  const totalMarcas = new Set(PRODUCTOS.map((p) => (p.marca || "").trim()).filter(Boolean)).size;
  const marcas = getTopMarcas(12);

  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    inLanguage: "es-CO",
    name: `${TITLE} | ${SITE_NAME}`,
    url: `${SITE_URL}/nosotros`,
    description: DESCRIPTION,
    mainEntity: { "@id": `${SITE_URL}/#store` },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: TITLE, item: `${SITE_URL}/nosotros` },
    ],
  };

  return (
    <div className="flex flex-col">
      <JsonLd data={[aboutLd, breadcrumbLd]} />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-primary)] text-white">
        <div className="bg-grid absolute inset-0 opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <nav className="mb-6 flex items-center gap-2 text-sm text-white/60">
            <Link href="/" className="transition-colors hover:text-white">Inicio</Link>
            <span>/</span>
            <span className="text-white">{TITLE}</span>
          </nav>
          <h1 className="font-display text-4xl font-extrabold leading-tight text-balance sm:text-5xl">
            {SITE_NAME}: papelería y útiles a domicilio en Bogotá
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85">
            {config.tagline}. Resolvemos la papelería del colegio, la oficina y la
            casa sin filas ni vueltas: tú armas el pedido y nosotros lo llevamos.
          </p>
        </div>
      </section>

      {/* Números */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-4xl grid-cols-3 gap-4 px-4 py-10 text-center sm:px-6 lg:px-8">
          {[
            [`${totalProductos.toLocaleString("es-CO")}+`, "Productos en catálogo"],
            [`${totalCategorias}`, "Categorías"],
            [`${totalMarcas}`, "Marcas reconocidas"],
          ].map(([num, label]) => (
            <div key={label}>
              <p className="font-display text-3xl font-extrabold text-[var(--color-primary)] sm:text-4xl">{num}</p>
              <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Historia / qué hacemos */}
      <section className="bg-[var(--color-bg)] py-14 lg:py-20">
        <div className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6 lg:px-8">
          <p className="eyebrow">Quiénes somos</p>
          <h2 className="font-display text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
            Una papelería pensada para resolverte el día
          </h2>
          <p className="text-lg leading-relaxed text-[var(--color-ink-soft)]">
            Nacimos para que conseguir los útiles del colegio deje de ser un dolor
            de cabeza. En lugar de recorrer papelerías buscando referencias
            agotadas, reunimos en un solo catálogo cuadernos, esferos, lápices,
            colores, témperas, carpetas, morrales, loncheras y artículos de oficina
            de marcas reconocidas, y te lo llevamos a la puerta de tu casa.
          </p>
          <p className="text-lg leading-relaxed text-[var(--color-ink-soft)]">
            Atendemos a familias con la lista escolar de preescolar, primaria y
            bachillerato, a profesionales que trabajan desde casa y a papelerías,
            colegios y revendedores que compran al por mayor. Todo se coordina por
            WhatsApp, sin registros ni formularios largos: nos escribes, confirmamos
            disponibilidad y precio, y acordamos la entrega en Bogotá.
          </p>
        </div>
      </section>

      {/* Valores / por qué elegirnos */}
      <section className="bg-[var(--color-surface)] py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center font-display text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
            Por qué nos eligen
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {VALORES.map((v) => (
              <div key={v.titulo} className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-bg)] p-7">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
                  <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-display text-lg font-semibold text-[var(--color-ink)]">{v.titulo}</h3>
                <p className="mt-2 leading-relaxed text-[var(--color-ink-soft)]">{v.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marcas */}
      {marcas.length > 0 && (
        <section className="bg-[var(--color-bg)] py-14">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-3 font-display text-2xl font-bold text-[var(--color-ink)]">Trabajamos con marcas que conoces</h2>
            <p className="mb-8 text-[var(--color-ink-soft)]">
              Artículos que duran todo el año escolar, de fabricantes reconocidos.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {marcas.map((m) => (
                <span key={m.marca} className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)]">
                  {m.marca}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[var(--color-ink)] py-14 text-white lg:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 font-display text-2xl font-bold sm:text-3xl">¿Armamos tu pedido?</h2>
          <p className="mb-8 text-lg text-white/75">
            Escríbenos por WhatsApp con tu lista o explora el catálogo. Coordinamos
            la entrega a domicilio en Bogotá.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={waLink("Hola! Quiero hacer un pedido de útiles escolares")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-wa)] px-8 py-4 font-semibold text-white transition-transform hover:scale-105"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 1.758-1.688 0-.633-.252-1.195-.572-1.48z" />
              </svg>
              Pedir por WhatsApp
            </a>
            <Link href="/contacto" className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-7 py-3.5 font-semibold text-white transition-all hover:border-white">
              Ver datos de contacto
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
