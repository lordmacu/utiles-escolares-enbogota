import type { SeoContent } from "@/lib/seo";

/**
 * Contenido editorial/SEO de la página de producto. Server Component: todo el
 * HTML se envía en el primer response (mejor SEO/GEO/AEO y accesibilidad).
 */
export function ProductSeoContent({ seo }: { seo: SeoContent }) {
  const { intro, highlights, paraQuien, usos, especificaciones, cuidados, faqs } = seo;

  const introParrafos = intro.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-4xl space-y-14 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {introParrafos.length > 0 && (
          <div className="reveal-up">
            <p className="eyebrow mb-3">Sobre este producto</p>
            <div className="font-display text-xl leading-relaxed text-[var(--color-ink)] text-pretty sm:text-[1.4rem]">
              {introParrafos.map((p, i) => (
                <p key={i} className={i > 0 ? "mt-4" : undefined}>{p}</p>
              ))}
            </div>
          </div>
        )}

        {highlights.length > 0 && (
          <div className="reveal-up">
            <p className="eyebrow mb-4">Por qué te conviene</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-[var(--color-ink)]">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span className="leading-snug">{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {paraQuien && (
          <div className="reveal-up rounded-2xl border border-[var(--color-line)] bg-[var(--color-primary-soft)] p-6 sm:p-8">
            <p className="eyebrow mb-2">Para quién es</p>
            <p className="font-display text-lg text-[var(--color-ink)] text-balance sm:text-xl">{paraQuien}</p>
          </div>
        )}

        {usos.length > 0 && (
          <div className="reveal-up">
            <p className="eyebrow mb-4">Usos y ocasiones</p>
            <div className="flex flex-wrap gap-2">
              {usos.map((u) => (
                <span key={u} className="rounded-full bg-[var(--color-primary-soft)] px-4 py-1.5 text-sm font-medium text-[var(--color-primary-dark)]">
                  {u}
                </span>
              ))}
            </div>
          </div>
        )}

        {especificaciones.length > 0 && (
          <div className="reveal-up">
            <p className="eyebrow mb-4">Especificaciones</p>
            <dl className="overflow-hidden rounded-2xl border border-[var(--color-line)]">
              {especificaciones.map((e, i) => (
                <div key={i} className={`flex gap-4 px-5 py-3 text-sm ${i % 2 ? "bg-[var(--color-bg)]" : "bg-[var(--color-surface)]"}`}>
                  <dt className="w-40 shrink-0 font-semibold text-[var(--color-ink)]">{e.item}</dt>
                  <dd className="text-[var(--color-ink-soft)]">{e.detalle}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {cuidados.length > 0 && (
          <div className="reveal-up">
            <p className="eyebrow mb-4">Recomendaciones</p>
            <ul className="space-y-2 text-[var(--color-ink-soft)]">
              {cuidados.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {faqs.length > 0 && (
          <div className="reveal-up">
            <p className="eyebrow mb-4">Preguntas frecuentes</p>
            <div className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
              {faqs.map((f, i) => (
                <details key={i} className="group py-4" {...(i === 0 ? { open: true } : {})}>
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                    <h3 className="font-display text-base font-semibold text-[var(--color-ink)] text-balance sm:text-lg">{f.pregunta}</h3>
                    <span aria-hidden="true" className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--color-primary)]/40 text-[var(--color-primary)] transition-transform group-open:rotate-45">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-2 leading-relaxed text-[var(--color-ink-soft)] text-pretty">{f.respuesta}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
