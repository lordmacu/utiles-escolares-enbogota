import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, SITE_NAME, waLink } from "@/lib/site";
import config from "@/data/config.json";

const TITLE = "Contacto";
const DESCRIPTION =
  "Contáctanos para pedir útiles escolares y papelería a domicilio en Bogotá. Escríbenos por WhatsApp, envía tu lista del colegio y coordinamos la entrega. Atención de lunes a sábado.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contacto" },
  openGraph: {
    title: `${TITLE} | ${SITE_NAME}`,
    description: DESCRIPTION,
    url: `${SITE_URL}/contacto`,
    type: "website",
  },
};

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 1.758-1.688 0-.633-.252-1.195-.572-1.48z" />
    </svg>
  );
}

export default function ContactoPage() {
  const telefono = `+57${config.whatsapp}`;

  const contactLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    inLanguage: "es-CO",
    name: `${TITLE} | ${SITE_NAME}`,
    url: `${SITE_URL}/contacto`,
    description: DESCRIPTION,
    mainEntity: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#store`,
      name: SITE_NAME,
      url: SITE_URL,
      email: config.email,
      areaServed: { "@type": "City", name: "Bogotá" },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: telefono,
        email: config.email,
        areaServed: "CO",
        availableLanguage: ["es"],
      },
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: TITLE, item: `${SITE_URL}/contacto` },
    ],
  };

  const DATOS = [
    {
      label: "WhatsApp",
      valor: telefono,
      href: waLink("Hola! Quiero información sobre un pedido"),
      externo: true,
      icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 1.758-1.688 0-.633-.252-1.195-.572-1.48z",
    },
    {
      label: "Correo",
      valor: config.email,
      href: `mailto:${config.email}`,
      externo: false,
      icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
    },
    {
      label: "Cobertura",
      valor: config.direccion,
      icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
    },
    {
      label: "Horario",
      valor: config.horario,
      icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Instagram",
      valor: `@${config.instagram}`,
      href: `https://instagram.com/${config.instagram}`,
      externo: true,
      icon: "M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9zm0 0V5.25m4.5 11.25h.008v.008H16.5v-.008zM6.75 3.75h10.5A3 3 0 0120.25 6.75v10.5a3 3 0 01-3 3H6.75a3 3 0 01-3-3V6.75a3 3 0 013-3z",
    },
  ];

  return (
    <div className="flex flex-col">
      <JsonLd data={[contactLd, breadcrumbLd]} />

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
            Contáctanos
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/85">
            Atendemos por WhatsApp y correo. Escríbenos para cotizar tu lista del
            colegio, resolver dudas o pedir al por mayor. Entregamos en toda Bogotá.
          </p>
        </div>
      </section>

      {/* Datos de contacto (NAP) */}
      <section className="bg-[var(--color-bg)] py-14 lg:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8">
          <div>
            <h2 className="mb-6 font-display text-2xl font-bold text-[var(--color-ink)]">Datos del negocio</h2>
            <ul className="space-y-4">
              {DATOS.map((d) => {
                const contenido = (
                  <>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)]">
                      <svg className="h-5 w-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d={d.icon} />
                      </svg>
                    </span>
                    <span>
                      <span className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">{d.label}</span>
                      <span className="block font-medium text-[var(--color-ink)]">{d.valor}</span>
                    </span>
                  </>
                );
                return (
                  <li key={d.label}>
                    {d.href ? (
                      <a
                        href={d.href}
                        {...(d.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="flex items-center gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-primary)]"
                      >
                        {contenido}
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                        {contenido}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Cómo pedir */}
          <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-7">
            <h2 className="mb-5 font-display text-xl font-bold text-[var(--color-ink)]">Cómo hacer un pedido</h2>
            <ol className="space-y-5">
              {[
                ["Arma tu pedido o ten lista la lista del colegio (una foto sirve)."],
                ["Escríbenos por WhatsApp con los productos o la lista."],
                ["Confirmamos disponibilidad, precio total y dirección de entrega."],
                ["Recibes todo a domicilio en Bogotá, muchas veces el mismo día."],
              ].map(([texto], i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] font-display text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-[var(--color-ink-soft)]">{texto}</span>
                </li>
              ))}
            </ol>
            <a
              href={waLink("Hola! Quiero hacer un pedido de útiles escolares")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-wa)] px-6 py-3.5 font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              <WhatsAppIcon className="h-5 w-5" />
              Escríbenos por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Enlaces útiles */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-surface)] py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 font-display text-xl font-bold text-[var(--color-ink)]">Mientras tanto, explora</h2>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {[
              ["Todos los productos", "/productos"],
              ["Categorías", "/categorias"],
              ["Ofertas", "/ofertas"],
              ["Guías", "/guias"],
              ["Quiénes somos", "/nosotros"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-medium text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
